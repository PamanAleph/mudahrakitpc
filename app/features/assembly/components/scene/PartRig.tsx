import { useFrame, type RootState } from "@react-three/fiber";
import { easing } from "maath";
import { useCallback, useRef } from "react";
import { Euler, Quaternion, Vector3, type Group } from "three";
import { getScrew } from "@shared/hardware";
import { DAMP } from "@shared/constants/motion";
import { prefersReducedMotion } from "@shared/hooks/useReducedMotion";
import { heldHeight, restPose } from "../../constants/deskLayout";
import { MS_PER_SCREW, PRESS_MS } from "../../constants/timings";
import { fastenersFor } from "../../engine/parts";
import { useInteractive } from "../../hooks/useInteractive";
import { mountAccepts } from "../../rules/placementRules";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { PartInstance } from "../../types/assemblyTypes";
import { pointerOnPlane, shakeOffset } from "../../utils/pointerPlane";
import { runtime, worldPose } from "../../utils/runtime";
import { PartContent } from "./PartContent";

const offset = new Vector3();
const stageQ = new Quaternion();
const flipQ = new Quaternion();
const restQ = new Quaternion();
const restE = new Euler();
const Y = new Vector3(0, 1, 0);
const X = new Vector3(1, 0, 0);
const pointer = new Vector3();


/**
 * One physical part on the bench. Its pose is derived from the store every
 * frame (tray → hand → mount) and damped towards it, so every transition,
 * including reversals, animates without extra code.
 */
export function PartRig({ inst }: { inst: PartInstance }) {
  const group = useRef<Group | null>(null);
  const first = useRef(true);
  const location = useAssemblyStore((s) => s.parts[inst.id]?.location ?? "tray");
  const target = useRef({ pos: new Vector3(), quat: new Quaternion() });

  const {
    handlers: { ref: registerInteractive, ...events },
  } = useInteractive({
    id: inst.id,
    enabled: location !== "held",
    label: () => describe(inst),
    getHold: () => holdFor(inst),
    onTap: () => tapPart(inst),
  });
  const setGroup = useCallback(
    (g: Group | null) => {
      group.current = g;
      registerInteractive(g);
    },
    [registerInteractive],
  );

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    computeTarget(inst, state, target.current.pos, target.current.quat);
    const s = readAssembly();
    const st = s.parts[inst.id];
    const reduced = prefersReducedMotion();
    if (first.current || reduced) {
      g.position.copy(target.current.pos);
      g.quaternion.copy(target.current.quat);
      first.current = false;
    } else {
      const smooth = st?.location === "held" ? DAMP.follow : DAMP.place;
      easing.damp3(g.position, target.current.pos, smooth, dt);
      easing.dampQ(g.quaternion, target.current.quat, smooth, dt);
    }
    const shake = shakeOffset(s.shakes[inst.id], performance.now());
    if (shake) g.position.x += shake;
  });

  return (
    <group ref={setGroup} {...events}>
      <PartContent inst={inst} />
    </group>
  );
}

function computeTarget(inst: PartInstance, state: RootState, pos: Vector3, quat: Quaternion) {
  const s = readAssembly();
  const st = s.parts[inst.id];
  const flips = st?.flips ?? 0;
  if (inst.kind === "fan") flipQ.setFromAxisAngle(X, Math.PI * flips);
  else if (inst.kind === "cpu" || inst.kind === "ram") flipQ.setFromAxisAngle(Y, Math.PI * flips);
  else flipQ.identity();

  if (st?.location === "mounted" && st.mount && worldPose(runtime.mounts, st.mount, pos, quat)) {
    offset.set(0, 0, 0);
    stageQ.identity();
    if (st.stage === "inserted") offset.set(0, 0.35, 0);
    if (st.stage === "angled") {
      offset.set(0, 0.15, 0);
      stageQ.setFromAxisAngle(X, -0.33);
    }
    pos.add(offset.applyQuaternion(quat));
    quat.multiply(stageQ).multiply(flipQ);
    return;
  }

  if (st?.location === "held") {
    const snap = s.snap;
    if (snap && mountAccepts(snap.id) === inst.kind && worldPose(runtime.mounts, snap.id, pos, quat)) {
      // Hover just above the target, already lined up: the user sees how it will sit.
      offset.set(0, inst.kind === "board" ? 3 : inst.kind === "panel" ? 4 : 2.2, 0);
      pos.add(offset);
      quat.multiply(flipQ);
      return;
    }
    const h = heldHeight(inst.kind, s.parts.board?.mount === "bench");
    if (pointerOnPlane(state, h, pointer)) pos.copy(pointer);
    quat.copy(flipQ);
    if (inst.kind === "fan") quat.premultiply(restQ.setFromEuler(restE.set(-Math.PI / 2, 0, 0)));
    return;
  }

  const rest = restPose(inst, s.build, s.geometry);
  pos.set(...rest.position);
  quat.setFromEuler(restE.set(...rest.rotation)).multiply(flipQ);
}

function describe(inst: PartInstance): string {
  const s = readAssembly();
  const st = s.parts[inst.id];
  const f = fastenersFor(s.build, inst);
  const bits: string[] = [inst.label];
  if (st?.location === "mounted" && st.mount !== "bench") {
    if (st.stage === "inserted") bits.push("belum ditekan");
    else if (st.stage === "angled") bits.push("masih miring");
    else bits.push("terpasang");
    if (f) bits.push(`baut ${Math.round(st.fastened * f.count)}/${f.count} · ${getScrew(f.screwId).bit}`);
  }
  return bits.join(" · ");
}

function holdFor(inst: PartInstance) {
  const s = readAssembly();
  const st = s.parts[inst.id];
  if (!st || s.held) return null;
  if (s.tool === "paste") return null;
  if (s.tool !== "hand") {
    if (!s.report(s.fastenCheck(inst.id), inst.id)) return "handled" as const;
    const f = fastenersFor(s.build, inst);
    const dir = s.fastenDirection(inst.id);
    return {
      id: `fasten:${inst.id}`,
      durationMs: (f?.count ?? 1) * MS_PER_SCREW,
      initialProgress: dir === 1 ? st.fastened : 1 - st.fastened,
      onProgress: (p: number) => readAssembly().setFastenProgress(inst.id, p),
      onComplete: () => readAssembly().completeFasten(inst.id),
    };
  }
  if (inst.kind === "ram" && st.location === "mounted" && st.stage === "inserted") {
    return { id: `press:${inst.id}`, durationMs: PRESS_MS.ram, onComplete: () => readAssembly().completeRamPress(inst.id) };
  }
  if (inst.kind === "m2" && st.location === "mounted" && st.stage === "angled") {
    return { id: `press:${inst.id}`, durationMs: PRESS_MS.m2, onComplete: () => readAssembly().completeM2Press(inst.id) };
  }
  return null;
}

function tapPart(inst: PartInstance) {
  const s = readAssembly();
  if (s.tool === "paste") {
    if (inst.kind === "cpu" && s.parts.cpu?.location === "mounted") s.setOverlay("paste");
    else s.notify("tool.paste");
    return;
  }
  if (s.tool !== "hand") return;
  s.pickPart(inst.id);
}
