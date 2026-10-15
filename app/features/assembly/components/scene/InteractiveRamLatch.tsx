import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, type Group } from "three";
import { RAM_SLOT, RAM_SLOT_LOCAL_Z, boardToWorld } from "../../constants/sceneLayout";
import { useInteractive } from "../../hooks/useInteractive";
import { MATERIALS } from "../../models/materials";
import { RamLatch } from "../../models/RamLatch";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { SlotId } from "../../types/assemblyTypes";
import { createSpring, stepSpring } from "@shared/utils/spring";
import { SPRING } from "@shared/constants/motion";

const OPEN_ANGLE = -0.85;

/** The lever at the end of a DIMM slot. It snaps open/closed with a small overshoot. */
export function InteractiveRamLatch({ slot, highlightColor }: { slot: SlotId; highlightColor: string }) {
  const pivot = useRef<Group>(null);
  const spring = useRef(createSpring(0));
  const panel = useAssemblyStore((s) => s.panel);
  const position = boardToWorld(RAM_SLOT.localX + 6.2, 0.12, RAM_SLOT_LOCAL_Z[slot]);

  const material = useMemo(() => MATERIALS.latch.clone(), []);
  const highlight = useMemo(() => new Color(highlightColor), [highlightColor]);

  const { hovered, handlers } = useInteractive({
    id: `latch-${slot}`,
    label: () => `Klip slot ${slot} · ${readAssembly().latches[slot] ? "terbuka" : "tertutup"}`,
    enabled: panel === "removed",
    onTap: () => readAssembly().toggleLatch(slot),
  });

  useFrame((_, dt) => {
    if (!pivot.current) return;
    const open = readAssembly().latches[slot];
    pivot.current.rotation.z = stepSpring(spring.current, open ? OPEN_ANGLE : 0, Math.min(dt, 0.05), SPRING.click);
    // Hover glow shows exactly which of the closely spaced latches you are about to flip.
    material.emissive.copy(highlight);
    material.emissiveIntensity += ((hovered ? 0.55 : 0) - material.emissiveIntensity) * Math.min(1, dt * 14);
  });

  return (
    <group position={position} {...handlers}>
      <group ref={pivot}>
        <RamLatch material={material} />
      </group>
      <mesh position={[0.3, 0.7, 0]}>
        <boxGeometry args={[1.0, 1.4, 0.7]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
