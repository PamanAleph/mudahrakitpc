import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useRef } from "react";
import type { Group } from "three";
import { BOARD_TOP, M2_SCREW_BOWL, M2_SCREW_SEATED_Y, M2_STANDOFF, STANDOFF_TOP } from "../../constants/sceneLayout";
import { HOLD_MS } from "../../constants/timings";
import { useInteractive } from "../../hooks/useInteractive";
import { MATERIALS } from "../../models/materials";
import { Cyl } from "../../models/primitives";
import { PanHeadScrew } from "../../models/Screws";
import { M2_SCREW } from "../../services/hardwareSpec";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import { runtime } from "../../utils/interactionRuntime";
import { DAMP } from "@shared/constants/motion";

/** Head height above the screw origin; the driver tip sits here. */
const HEAD_TOP = 0.14;

/** The tiny M.2 screw (lives in the dish until a fitting bit picks it up) and the standoff it goes into. */
export function InteractiveM2Screw() {
  const screw = useRef<Group>(null);
  const state = useAssemblyStore((s) => s.m2Screw);
  const panel = useAssemblyStore((s) => s.panel);
  const ssd = useAssemblyStore((s) => s.ssd);

  const pickup = useInteractive({
    id: "m2-screw",
    label: () => `${M2_SCREW.name} · ulir ${M2_SCREW.thread}`,
    enabled: state === "bowl",
    anchor: () => (screw.current ? { object: screw.current, offset: [0, HEAD_TOP, 0] } : null),
    onTap: () => readAssembly().pickM2Screw(),
  });

  const standoff = useInteractive({
    id: "m2-standoff",
    label: () => "Standoff M.2 · lubang baut SSD",
    enabled: panel === "removed" && ssd !== "secured",
    anchor: () => (screw.current && readAssembly().m2Screw === "onBit" ? { object: screw.current, offset: [0, HEAD_TOP, 0] } : null),
    getHold: () => {
      const s = readAssembly();
      if (!s.beginM2Screw() || !screw.current) return "handled";
      return {
        id: "m2-screw",
        durationMs: HOLD_MS.m2Screw,
        anchor: { object: screw.current, offset: [0, HEAD_TOP, 0] },
        onComplete: () => readAssembly().completeM2Screw(),
      };
    },
    onTap: () => readAssembly().notify("screw.holdToTurn"),
  });

  useFrame((_, rawDt) => {
    const g = screw.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.05);
    const s = readAssembly();
    const [sx, , sz] = M2_STANDOFF;
    if (s.hold?.id === "m2-screw") {
      const p = s.hold.progress;
      g.position.set(sx, M2_SCREW_SEATED_Y + 0.4 * (1 - p), sz);
      g.rotation.set(0, -p * M2_SCREW.turnsToRemove * Math.PI * 2, 0);
      return;
    }
    if (s.m2Screw === "onBit") {
      // Stuck to the magnetic tip, following the driver exactly.
      g.position.set(runtime.toolTip.x, runtime.toolTip.y - HEAD_TOP, runtime.toolTip.z);
      return;
    }
    if (s.m2Screw === "installed") {
      easing.damp3(g.position, [sx, M2_SCREW_SEATED_Y, sz], DAMP.place, dt);
      return;
    }
    easing.damp3(g.position, M2_SCREW_BOWL, DAMP.place, dt);
    easing.dampE(g.rotation, [0, 0, 0], DAMP.place, dt);
  });

  const [sx, , sz] = M2_STANDOFF;
  return (
    <>
      <group ref={screw} position={M2_SCREW_BOWL} {...pickup.handlers}>
        <PanHeadScrew />
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.9, 10, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </group>
      {/* Brass standoff for the 2280 position */}
      <Cyl radius={0.28} height={STANDOFF_TOP - BOARD_TOP} position={[sx, (STANDOFF_TOP + BOARD_TOP) / 2, sz]} material={MATERIALS.brass} segments={6} />
      <mesh position={[sx, BOARD_TOP + 0.8, sz]} {...standoff.handlers}>
        <boxGeometry args={[1.3, 1.6, 1.3]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  );
}
