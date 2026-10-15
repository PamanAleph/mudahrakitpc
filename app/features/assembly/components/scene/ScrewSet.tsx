import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import { PanHeadScrew, Thumbscrew } from "../../models/Screws";
import { useAssemblyStore } from "../../store/assemblyStore";
import { runtime } from "../../utils/runtime";
import { Marker } from "./Marker";

import type { ScrewPoint } from "../../utils/screwPoints";

const UP = new Vector3(0, 1, 0);

/**
 * The screws of one part. Each screw drives in over its share of the hold
 * progress, rising and turning while loose, flush when done. Hidden at 0
 * (they're still in the bowl).
 */
export function ScrewSet({ partId, points, thumb = false, headRadius = 0.22 }: { partId: string; points: ScrewPoint[]; thumb?: boolean; headRadius?: number }) {
  const fastened = useAssemblyStore((s) => s.parts[partId]?.fastened ?? 0);
  const quats = useMemo(() => points.map((pt) => new Quaternion().setFromUnitVectors(UP, new Vector3(...pt.n).normalize())), [points]);
  const n = points.length;
  return (
    <group>
      {/* Where the screwdriver goes for screw i: local +y = the screw's axis, pointing out */}
      {points.map((pt, i) => (
        <group key={`m${i}`} position={pt.p} quaternion={quats[i]}>
          <Marker map={runtime.anchors} id={`screw:${partId}:${i}`} position={[0, 0.25, 0]} />
        </group>
      ))}
      {points.map((pt, i) => {
        const local = Math.min(1, Math.max(0, fastened * n - i));
        if (local <= 0) return null;
        const lift = (1 - local) * 0.6;
        const q = quats[i]!;
        const spin = new Quaternion().setFromAxisAngle(UP, local * Math.PI * 6);
        const rot = q.clone().multiply(spin);
        return (
          <group key={i} position={[pt.p[0] + pt.n[0] * lift, pt.p[1] + pt.n[1] * lift, pt.p[2] + pt.n[2] * lift]} quaternion={rot}>
            {thumb ? <Thumbscrew headRadius={0.5} /> : <PanHeadScrew headRadius={headRadius} length={0.5} />}
          </group>
        );
      })}
    </group>
  );
}
