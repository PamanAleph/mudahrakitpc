import type { Material } from "three";
import { MATERIALS } from "./materials";
import { Box } from "./primitives";

/** One-sided DIMM latch lever. Pivot at its base; the caller rotates the group. */
export function RamLatch({ material = MATERIALS.latch }: { material?: Material }) {
  return (
    <group>
      <Box size={[0.42, 1.25, 0.62]} position={[0.21, 0.62, 0]} material={material} />
      <Box size={[0.62, 0.22, 0.62]} position={[0.42, 1.18, 0]} material={material} />
      <Box size={[0.12, 0.45, 0.4]} position={[0.04, 0.95, 0]} material={material} />
    </group>
  );
}
