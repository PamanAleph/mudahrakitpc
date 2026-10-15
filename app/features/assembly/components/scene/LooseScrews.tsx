import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, type Group } from "three";
import { BOWL, PANEL_SCREW_IDS } from "../../constants/sceneLayout";
import { SCREW_FLIGHT_MS } from "../../constants/timings";
import { Thumbscrew } from "../../models/Screws";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { PanelScrewId } from "../../types/assemblyTypes";
import { prefersReducedMotion } from "@shared/hooks/useReducedMotion";

/** Fixed resting spots so screws don't pile into one point. */
const SPOTS: Record<PanelScrewId, [number, number, number]> = {
  tr: [0.9, 0.35, 0.5],
  tl: [-0.8, 0.35, 0.7],
  br: [0.4, 0.35, -0.9],
  bl: [-0.6, 0.35, -0.5],
};

/** Screws that came loose: they hop into the parts dish with a little tumble. */
export function LooseScrews() {
  return (
    <>
      {PANEL_SCREW_IDS.map((id) => (
        <LooseScrew key={id} id={id} />
      ))}
    </>
  );
}

function LooseScrew({ id }: { id: PanelScrewId }) {
  const ref = useRef<Group>(null);
  const removed = useAssemblyStore((s) => s.panelScrews[id].removed);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const st = readAssembly().panelScrews[id];
    if (!st.releasedFrom) return;
    const [fx, fy, fz] = st.releasedFrom;
    const [sx, sy, sz] = SPOTS[id];
    const to = [BOWL[0] + sx, BOWL[1] + sy, BOWL[2] + sz] as const;
    const t = prefersReducedMotion() ? 1 : MathUtils.clamp((performance.now() - st.removedAt) / SCREW_FLIGHT_MS, 0, 1);
    const k = 1 - Math.pow(1 - t, 3);
    g.position.set(MathUtils.lerp(fx, to[0], k), MathUtils.lerp(fy, to[1], k) + Math.sin(t * Math.PI) * 7, MathUtils.lerp(fz, to[2], k));
    // Tumble in flight, land tipped on its side in the dish.
    g.rotation.set(t * Math.PI * 2 + k * 1.4, k * 0.8, 0);
  });

  if (!removed) return null;
  return (
    <group ref={ref}>
      <Thumbscrew />
    </group>
  );
}
