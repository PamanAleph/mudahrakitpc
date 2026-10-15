import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Box3, MeshBasicMaterial, Shape, Vector3, type Group, type Mesh } from "three";
import { useCssTokens } from "@shared/hooks/useCssTokens";
import { prefersReducedMotion } from "@shared/hooks/useReducedMotion";
import { currentTask } from "../../engine/tasks";
import { readAssembly } from "../../store/assemblyStore";
import type { GuideStep } from "../../types/assemblyTypes";
import { runtime } from "../../utils/runtime";

/** Marker size as a fraction of the camera distance: same size on screen at any zoom. */
const SCREEN_SCALE = 0.03;
const REFRESH_S = 0.12;
const DOTS = 12;
const ORDER = 40;

const box = new Box3();
const cam = new Vector3();
const right = new Vector3();
const up = new Vector3();
const from = new Vector3();

/** Top-centre of something clickable (or the point of a mount, port or anchor). */
function pointOf(id: string, interactive: boolean, out: Vector3): boolean {
  const o = (interactive ? runtime.interactives.get(id) : null) ?? runtime.mounts.get(id) ?? runtime.ports.get(id) ?? runtime.anchors.get(id);
  if (!o) return false;
  box.setFromObject(o);
  if (box.isEmpty()) o.getWorldPosition(out);
  else {
    box.getCenter(out);
    out.y = box.max.y;
  }
  return true;
}

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/**
 * Points at what to do next, always (guided mode): a pulsing ring with an arrow
 * on the object to touch, and a green one where a carried part goes. "Tunjukkan"
 * additionally plays a ghost pointer doing the gesture in a loop.
 */
export function GuideLayer() {
  const tokens = useCssTokens(["--scene-accent", "--scene-snap-valid"] as const, "#2f7fe0");
  const mats = useMemo(
    () => ({
      target: new MeshBasicMaterial({ transparent: true, opacity: 0.95, depthTest: false }),
      spot: new MeshBasicMaterial({ transparent: true, opacity: 0.95, depthTest: false }),
      ripple: new MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false }),
      dot: new MeshBasicMaterial({ transparent: true, opacity: 0.95, depthTest: false }),
      ghost: new MeshBasicMaterial({ transparent: true, opacity: 0.55, depthTest: false }),
      cursor: new MeshBasicMaterial({ color: "#ffffff", transparent: true, depthTest: false }),
      outline: new MeshBasicMaterial({ color: "#10151c", transparent: true, depthTest: false }),
    }),
    [],
  );
  mats.target.color.set(tokens["--scene-accent"]);
  mats.spot.color.set(tokens["--scene-snap-valid"]);
  mats.ripple.color.set(tokens["--scene-accent"]);
  mats.dot.color.set(tokens["--scene-accent"]);
  mats.ghost.color.set(tokens["--scene-snap-valid"]);

  const cursorShape = useMemo(() => {
    const s = new Shape();
    const pts: Array<[number, number]> = [[0, 0], [0, -1.45], [0.36, -1.12], [0.64, -1.72], [0.9, -1.6], [0.62, -1.02], [1.05, -1.02]];
    pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
    s.closePath();
    return s;
  }, []);

  const targetBeacon = useRef<Group>(null);
  const spotBeacon = useRef<Group>(null);
  const cursor = useRef<Group>(null);
  const ghost = useRef<Mesh>(null);
  const ripple = useRef<Mesh>(null);
  const dots = useRef<Array<Mesh | null>>([]);

  const state = useRef({ step: null as GuideStep | null, key: "", acc: 99, hasTarget: false, hasSpot: false, t: 0, demoWas: false });
  const P0 = useRef(new Vector3());
  const P1 = useRef(new Vector3());

  useFrame((frameState, dt) => {
    const s = readAssembly();
    const st = state.current;
    const camera = frameState.camera;
    const show = s.mode === "guided" || s.demo;

    st.acc += dt;
    if (st.acc > REFRESH_S) {
      st.acc = 0;
      const task = s.ready ? currentTask(s.tasks, s) : null;
      const step = task?.guide?.(s) ?? null;
      const key = step ? `${task!.id}|${step.gesture}|${step.target ?? ""}|${step.spot ?? ""}` : "";
      if (key !== st.key) {
        st.key = key;
        st.t = 0;
      }
      st.step = step;
      st.hasTarget = !!step?.target && pointOf(step.target, true, P0.current);
      st.hasSpot = !!step?.spot && pointOf(step.spot, false, P1.current);
      if (st.hasSpot) P1.current.y += 0.3;
    }
    if (s.demo !== st.demoWas) {
      st.demoWas = s.demo;
      st.t = 0;
    }

    const step = st.step;
    camera.getWorldPosition(cam);
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);

    const place = (g: Group | null, p: Vector3, on: boolean) => {
      if (!g) return;
      g.visible = on;
      if (!on) return;
      const d = cam.distanceTo(p);
      g.position.copy(p);
      g.quaternion.copy(camera.quaternion);
      g.scale.setScalar(Math.max(0.15, d * SCREEN_SCALE));
    };
    place(targetBeacon.current, P0.current, show && !!step && st.hasTarget);
    place(spotBeacon.current, P1.current, show && !!step && st.hasSpot);

    /* ---------- Demo pointer ---------- */
    const c = cursor.current;
    if (!c) return;
    const playing = s.demo && !!step && (st.hasTarget || st.hasSpot);
    c.visible = playing;
    if (ripple.current) ripple.current.visible = playing;
    if (!playing || !step) return;

    const still = prefersReducedMotion();
    const home = st.hasTarget ? P0.current : P1.current;
    const dist = cam.distanceTo(home);
    const unit = Math.max(0.15, dist * SCREEN_SCALE);
    from.copy(home).addScaledVector(right, unit * 5).addScaledVector(up, -unit * 4);

    const gesture = step.gesture;
    const period = gesture === "tap" ? 2.6 : gesture === "hold" ? 3.8 : 5.4;
    st.t = still ? 0.95 : (st.t + dt) % period;
    const t = st.t;

    let pressed = false;
    let clickAt = -1;
    let holdProgress = 0;
    let fade = 1;
    let showGhost = false;
    const pos = c.position;
    if (gesture === "tap") {
      const a = ease(span(t, 0, 0.9));
      pos.lerpVectors(from, home, a);
      pressed = t > 0.95 && t < 1.15;
      clickAt = 1.0;
      fade = 1 - span(t, 2.2, 2.6);
    } else if (gesture === "hold") {
      const a = ease(span(t, 0, 0.9));
      pos.lerpVectors(from, home, a);
      holdProgress = span(t, 1.0, 2.8);
      pressed = t > 1.0 && t < 2.8;
      clickAt = 1.0;
      fade = 1 - span(t, 3.3, 3.8);
    } else {
      const start = st.hasTarget ? P0.current : home;
      const end = st.hasSpot ? P1.current : start;
      if (t < 1.0) pos.lerpVectors(from, start, ease(span(t, 0, 0.9)));
      else {
        const m = ease(span(t, 1.3, 3.0));
        pos.lerpVectors(start, end, m);
        pos.y += Math.sin(m * Math.PI) * unit * 2.2;
      }
      pressed = (t > 1.0 && t < 1.2) || (t > 3.05 && t < 3.25);
      showGhost = t > 1.1 && t < 3.1;
      clickAt = t < 2.0 ? 1.05 : 3.1;
      fade = 1 - span(t, 4.9, 5.4);
    }

    c.quaternion.copy(camera.quaternion);
    c.scale.setScalar(unit * (pressed ? 0.82 : 1) * 0.9);
    mats.cursor.opacity = fade;
    mats.outline.opacity = fade;

    if (ghost.current) {
      ghost.current.visible = showGhost;
      ghost.current.position.set(0.5, -1.4, 0);
    }
    for (let i = 0; i < DOTS; i++) {
      const d = dots.current[i];
      if (d) d.visible = gesture === "hold" && holdProgress > i / DOTS;
    }
    const r = ripple.current;
    if (r) {
      const since = t - clickAt;
      const live = since > 0 && since < 0.6;
      mats.ripple.opacity = live ? 0.8 * (1 - since / 0.6) * fade : 0;
      r.position.copy(pos);
      r.quaternion.copy(camera.quaternion);
      r.scale.setScalar(unit * (0.6 + (since / 0.6) * 1.6));
    }
  });

  return (
    <group>
      <group ref={targetBeacon} visible={false}>
        <Beacon material={mats.target} />
      </group>
      <group ref={spotBeacon} visible={false}>
        <Beacon material={mats.spot} />
      </group>

      <group ref={cursor} visible={false} renderOrder={ORDER + 2}>
        <mesh material={mats.outline} scale={1.3} renderOrder={ORDER + 2} position={[-0.02, 0.05, -0.01]}>
          <shapeGeometry args={[cursorShape]} />
        </mesh>
        <mesh material={mats.cursor} renderOrder={ORDER + 3}>
          <shapeGeometry args={[cursorShape]} />
        </mesh>
        <mesh ref={ghost} material={mats.ghost} visible={false} renderOrder={ORDER + 1}>
          <circleGeometry args={[0.8, 24]} />
        </mesh>
        {Array.from({ length: DOTS }, (_, i) => {
          const a = (i / DOTS) * Math.PI * 2 - Math.PI / 2;
          return (
            <mesh key={i} ref={(m) => (dots.current[i] = m)} material={mats.dot} position={[Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0]} visible={false} renderOrder={ORDER + 1}>
              <circleGeometry args={[0.28, 12]} />
            </mesh>
          );
        })}
      </group>
      <mesh ref={ripple} material={mats.ripple} visible={false} renderOrder={ORDER + 1}>
        <ringGeometry args={[0.85, 1, 40]} />
      </mesh>
    </group>
  );
}

/** Ring plus a bobbing arrow pointing down at it. Drawn on top, facing the camera. */
function Beacon({ material }: { material: MeshBasicMaterial }) {
  const ring = useRef<Mesh>(null);
  const arrow = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(t * 5) * 0.1);
    if (arrow.current) arrow.current.position.y = 2.1 + Math.sin(t * 5) * 0.3;
  });
  return (
    <group>
      <mesh ref={ring} material={material} renderOrder={ORDER}>
        <ringGeometry args={[1.1, 1.4, 48]} />
      </mesh>
      <mesh ref={arrow} material={material} position={[0, 2.1, 0]} rotation={[0, 0, Math.PI]} renderOrder={ORDER}>
        <coneGeometry args={[0.55, 1.1, 16]} />
      </mesh>
    </group>
  );
}
