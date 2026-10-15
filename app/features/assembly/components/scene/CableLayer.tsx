import { useFrame, type RootState } from "@react-three/fiber";
import { easing } from "maath";
import { useEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, Quaternion, TubeGeometry, Vector3, type Group, type Mesh } from "three";
import { getConnector } from "@shared/hardware";
import { MAT_T } from "../../constants/layouts";
import { footprintOf, PlugModel } from "../../models/Connector";
import { MATERIALS } from "../../models/materials";
import { useInteractive } from "../../hooks/useInteractive";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { CableSpec, EndId } from "../../types/assemblyTypes";
import { pointerOnPlane } from "../../utils/pointerPlane";
import { runtime, worldPose } from "../../utils/runtime";

const RADIUS: Record<CableSpec["gauge"], number> = { bundle: 0.42, thick: 0.28, thin: 0.12, ribbon: 0.14, hair: 0.07 };
const MATERIAL = { black: MATERIALS.cableBlack, red: MATERIALS.cableRed, grey: MATERIALS.cableGrey } as const;
const Y = new Vector3(0, 1, 0);
const HELD_HEIGHT = MAT_T + 24;

/** Every cable in the build: a spline from its fixed end to wherever its free end is. */
export function CableLayer() {
  const specs = useAssemblyStore((s) => s.cableSpecs);
  return (
    <group>
      {specs.map((c, i) => (
        <CableRig key={c.id} spec={c} index={i} />
      ))}
      <FrontPanelBundle />
    </group>
  );
}

interface EndPose {
  pos: Vector3;
  dir: Vector3;
  quat: Quaternion;
  ok: boolean;
}
const newPose = (): EndPose => ({ pos: new Vector3(), dir: new Vector3(0, 1, 0), quat: new Quaternion(), ok: false });

/** Where a free end lies when nobody holds it: next to whatever it's attached to, or on the mat. */
function restPoint(end: EndId, index: number, other: EndPose, out: EndPose) {
  if (other.ok) {
    out.pos.copy(other.pos).addScaledVector(other.dir, 4 + (index % 4) * 0.8);
    out.pos.x += ((index % 3) - 1) * 1.6;
    out.pos.y = Math.max(out.pos.y - 1.5, MAT_T + 0.6);
  } else {
    out.pos.set(10 + index * 3 + (end === "b" ? 8 : 0), MAT_T + 0.5, 54);
  }
  out.dir.set(0, 0, 1);
  out.quat.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
  out.ok = true;
}

function CableRig({ spec, index }: { spec: CableSpec; index: number }) {
  const mesh = useRef<Mesh>(null);
  const plugs = useRef<Record<EndId, Group | null>>({ a: null, b: null });
  const poses = useRef({ a: newPose(), b: newPose() });
  const lastKey = useRef("");
  const geometryRef = useRef<TubeGeometry | null>(null);
  const radius = RADIUS[spec.gauge];

  useEffect(
    () => () => {
      geometryRef.current?.dispose();
    },
    [],
  );

  useFrame((state, dt) => {
    const s = readAssembly();
    const st = s.cables[spec.id];
    if (!st) return;
    const P = poses.current;
    for (const end of ["a", "b"] as const) {
      const fixed = spec.ends[end].fixedTo;
      if (fixed) P[end].ok = anchorPose(`cable:${fixed.partId}:${fixed.anchor}`, P[end]);
    }
    for (const end of ["a", "b"] as const) {
      if (spec.ends[end].fixedTo) continue;
      const other = P[end === "a" ? "b" : "a"];
      freeEndPose(state, spec, end, index, other, P[end]);
      const plug = plugs.current[end];
      if (plug) {
        const flips = st.ends[end].flips;
        const target = P[end].quat.clone().multiply(new Quaternion().setFromAxisAngle(Y, Math.PI * flips));
        if (st.ends[end].state === "held") {
          easing.damp3(plug.position, P[end].pos, 0.06, dt);
          easing.dampQ(plug.quaternion, target, 0.08, dt);
        } else {
          plug.position.copy(P[end].pos);
          plug.quaternion.copy(target);
        }
      }
    }
    // Rebuild the tube only when an end actually moved.
    const a = spec.ends.a.fixedTo ? P.a.pos : plugs.current.a?.position ?? P.a.pos;
    const b = spec.ends.b.fixedTo ? P.b.pos : plugs.current.b?.position ?? P.b.pos;
    const key = `${a.x.toFixed(1)},${a.y.toFixed(1)},${a.z.toFixed(1)}|${b.x.toFixed(1)},${b.y.toFixed(1)},${b.z.toFixed(1)}|${st.via.join()}`;
    if (key === lastKey.current || !P.a.ok || !P.b.ok || !mesh.current) return;
    lastKey.current = key;
    const pts = [a.clone(), a.clone().addScaledVector(P.a.dir, 2.2)];
    for (const v of st.via) {
      const o = runtime.anchors.get(`grommet:${v}`);
      if (o) pts.push(o.getWorldPosition(new Vector3()));
    }
    const bDir = spec.ends.b.fixedTo ? P.b.dir : new Vector3(0, 1, 0).applyQuaternion(plugs.current.b?.quaternion ?? P.b.quat);
    const aDir = spec.ends.a.fixedTo ? P.a.dir : new Vector3(0, 1, 0).applyQuaternion(plugs.current.a?.quaternion ?? P.a.quat);
    pts[1] = a.clone().addScaledVector(aDir, 2.2);
    const plugLen = (end: EndId) => (spec.ends[end].fixedTo ? 0 : footprintOf(spec.ends[end].plugKind).plugH);
    pts[0] = a.clone().addScaledVector(aDir, plugLen("a"));
    pts.push(b.clone().addScaledVector(bDir, plugLen("b") + 2.2), b.clone().addScaledVector(bDir, plugLen("b")));
    for (const p of pts) p.y = Math.max(p.y, MAT_T + radius);
    const curve = new CatmullRomCurve3(pts, false, "centripetal");
    const geo = new TubeGeometry(curve, Math.min(96, 24 + pts.length * 8), radius, spec.gauge === "bundle" ? 10 : 6, false);
    geometryRef.current?.dispose();
    geometryRef.current = geo;
    mesh.current.geometry = geo;
  });

  return (
    <group>
      <mesh ref={mesh} material={MATERIAL[spec.color]} />
      {(["a", "b"] as const)
        .filter((e) => !spec.ends[e].fixedTo)
        .map((e) => (
          <CablePlug key={e} spec={spec} end={e} setRef={(g) => (plugs.current[e] = g)} />
        ))}
    </group>
  );
}

function anchorPose(id: string, out: EndPose): boolean {
  if (!worldPose(runtime.anchors, id, out.pos, out.quat)) return false;
  out.dir.set(0, 1, 0).applyQuaternion(out.quat);
  return true;
}

const pointer = new Vector3();
function freeEndPose(state: RootState, spec: CableSpec, end: EndId, index: number, other: EndPose, out: EndPose) {
  const s = readAssembly();
  const st = s.cables[spec.id]!.ends[end];
  if (st.state === "plugged" && st.portId && worldPose(runtime.ports, st.portId, out.pos, out.quat)) {
    out.dir.set(0, 1, 0).applyQuaternion(out.quat);
    out.ok = true;
    return;
  }
  if (st.state === "held") {
    const snap = s.snap;
    if (snap && worldPose(runtime.ports, snap.id, out.pos, out.quat)) {
      out.dir.set(0, 1, 0).applyQuaternion(out.quat);
      out.pos.addScaledVector(out.dir, 1.6);
      out.ok = true;
      return;
    }
    if (pointerOnPlane(state, HELD_HEIGHT, pointer)) out.pos.copy(pointer);
    out.quat.identity();
    out.dir.set(0, 1, 0);
    out.ok = true;
    return;
  }
  restPoint(end, index, other, out);
}

function CablePlug({ spec, end, setRef }: { spec: CableSpec; end: EndId; setRef: (g: Group | null) => void }) {
  const kind = spec.ends[end].plugKind;
  const held = useAssemblyStore((s) => s.held?.kind === "cable" && s.held.id === spec.id && s.held.end === end);
  const f = footprintOf(kind);
  const { handlers } = useInteractive({
    id: `plug:${spec.id}:${end}`,
    enabled: !held,
    label: () => {
      const st = readAssembly().cables[spec.id]?.ends[end];
      return `${spec.label} · ${getConnector(kind).name}${st?.state === "plugged" ? " · tercolok (klik untuk mencabut)" : ""}`;
    },
    onTap: () => readAssembly().pickCableEnd(spec.id, end),
  });
  const hit = useMemo(() => [Math.max(1.4, f.x + 0.6), f.plugH + 0.8, Math.max(1.2, f.z + 0.8)] as [number, number, number], [f]);
  return (
    <group ref={setRef}>
      <PlugModel kind={kind} />
      <mesh {...handlers} position={[0, f.plugH / 2, 0]}>
        <boxGeometry args={hit} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

/** The bundle of thin front-panel wires, drawn once any of them is on the header. */
function FrontPanelBundle() {
  const any = useAssemblyStore((s) => Object.keys(s.frontPanel).length > 0);
  const mesh = useRef<Mesh>(null);
  const done = useRef("");
  useFrame(() => {
    if (!any || !mesh.current) return;
    const a = runtime.anchors.get("cable:case:fp");
    const b = runtime.anchors.get("fp-header");
    if (!a || !b) return;
    const pa = a.getWorldPosition(new Vector3());
    const pb = b.getWorldPosition(new Vector3());
    const key = `${pa.toArray().map((x) => x.toFixed(1))}|${pb.toArray().map((x) => x.toFixed(1))}`;
    if (key === done.current) return;
    done.current = key;
    const curve = new CatmullRomCurve3([pa, pa.clone().add(new Vector3(0, 1.5, -1)), pb.clone().add(new Vector3(0, 3, 1.5)), pb.clone().add(new Vector3(0, 1.2, 0))]);
    mesh.current.geometry.dispose();
    mesh.current.geometry = new TubeGeometry(curve, 40, 0.16, 6, false);
  });
  if (!any) return null;
  return <mesh ref={mesh} material={MATERIALS.cableBlack} />;
}
