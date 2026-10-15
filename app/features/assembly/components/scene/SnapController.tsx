import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, MeshBasicMaterial, Vector3, type Group } from "three";
import { useCssTokens } from "@shared/hooks/useCssTokens";
import { mountAccepts } from "../../rules/placementRules";
import { readAssembly } from "../../store/assemblyStore";
import { runtime } from "../../utils/runtime";

const SNAP_PX = 70;
const GROMMET_PX = 34;
const REEVALUATE_FRAMES = 12;
const v = new Vector3();

/**
 * While something is in hand, finds the nearest place it could go (in screen
 * space, so it works at any zoom) and asks the rules whether it fits there.
 * Cables also thread through any grommet the pointer passes over.
 */
export function SnapController() {
  const last = useRef<{ id: string | null; frames: number }>({ id: null, frames: 0 });
  useFrame((state) => {
    const s = readAssembly();
    const h = s.held;
    if (!h) {
      if (s.snap) s.setSnap(null);
      last.current.id = null;
      return;
    }
    const { width, height } = state.size;
    const px = ((state.pointer.x + 1) / 2) * width;
    const py = ((1 - state.pointer.y) / 2) * height;
    const project = (o: { getWorldPosition: (t: Vector3) => Vector3 }) => {
      o.getWorldPosition(v).project(state.camera);
      if (v.z > 1) return Infinity;
      return Math.hypot(((v.x + 1) / 2) * width - px, ((1 - v.y) / 2) * height - py);
    };

    let best: string | null = null;
    let bestD = SNAP_PX;
    if (h.kind === "part") {
      const kind = s.instances.find((p) => p.id === h.id)?.kind;
      for (const [id, o] of runtime.mounts) {
        if (id === "bench" || mountAccepts(id) !== kind) continue;
        const d = project(o);
        if (d < bestD) (bestD = d), (best = id);
      }
    } else {
      for (const [id, o] of runtime.ports) {
        const d = project(o);
        if (d < bestD) (bestD = d), (best = id);
      }
      for (const [id, o] of runtime.anchors) {
        if (!id.startsWith("grommet:")) continue;
        if (project(o) < GROMMET_PX) s.routeVia(id.slice(8));
      }
    }

    const L = last.current;
    L.frames++;
    if (best === L.id && L.frames < REEVALUATE_FRAMES) return;
    L.id = best;
    L.frames = 0;
    if (!best) return s.setSnap(null);
    const res = h.kind === "part" ? s.evaluatePlacement(h.id, best) : s.evaluatePlug(best);
    s.setSnap(res);
  });
  return null;
}

/** A ring at the snap target (valid / invalid colour) and faint dots at every other candidate. */
export function SnapIndicator() {
  const tokens = useCssTokens(["--scene-snap-valid", "--scene-snap-invalid", "--scene-accent"] as const, "#2fb463");
  const ring = useRef<Group>(null);
  const mats = useMemo(
    () => ({
      ring: new MeshBasicMaterial({ transparent: true, opacity: 0.9, depthTest: false }),
      dot: new MeshBasicMaterial({ transparent: true, opacity: 0.45, depthTest: false }),
    }),
    [],
  );
  const dots = useRef<Array<Group | null>>([]);
  const valid = useMemo(() => new Color(tokens["--scene-snap-valid"]), [tokens]);
  const invalid = useMemo(() => new Color(tokens["--scene-snap-invalid"]), [tokens]);
  mats.dot.color.set(tokens["--scene-accent"]);

  useFrame((state) => {
    const s = readAssembly();
    const r = ring.current;
    const target = s.snap ? (runtime.mounts.get(s.snap.id) ?? runtime.ports.get(s.snap.id)) : null;
    if (r) {
      r.visible = !!target;
      if (target) {
        target.getWorldPosition(r.position);
        r.position.y += 0.15;
        mats.ring.color.copy(s.snap!.valid ? valid : invalid);
        r.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 6) * 0.06);
      }
    }
    const kind = s.held?.kind === "part" ? s.instances.find((p) => p.id === s.held!.id)?.kind : null;
    let i = 0;
    if (kind) {
      for (const [id, o] of runtime.mounts) {
        if (id === "bench" || mountAccepts(id) !== kind || id === s.snap?.id) continue;
        const d = dots.current[i++];
        if (!d) break;
        o.getWorldPosition(d.position);
        d.position.y += 0.1;
        d.visible = true;
      }
    }
    for (; i < dots.current.length; i++) {
      const d = dots.current[i];
      if (d) d.visible = false;
    }
  });

  return (
    <group>
      <group ref={ring} visible={false} renderOrder={5}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.ring}>
          <ringGeometry args={[1.0, 1.25, 40]} />
        </mesh>
      </group>
      {Array.from({ length: 12 }, (_, i) => (
        <group key={i} ref={(g) => (dots.current[i] = g)} visible={false}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.dot}>
            <ringGeometry args={[0.5, 0.7, 24]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
