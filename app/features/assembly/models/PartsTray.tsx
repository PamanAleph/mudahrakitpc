import { PARTS_TRAY } from "../constants/sceneLayout";
import { MATERIALS } from "./materials";
import { Box, RoundBox } from "./primitives";

/** Two-compartment parts tray: RAM on the left, M.2 SSD on the right. */
export function PartsTray() {
  const [w, h, d] = PARTS_TRAY.size;
  const wall = 0.3;
  return (
    <group position={PARTS_TRAY.center}>
      <RoundBox size={[w, 0.3, d]} position={[0, 0.15, 0]} material={MATERIALS.traySurface} radius={0.12} />
      <Box size={[w, h, wall]} position={[0, h / 2, d / 2 - wall / 2]} material={MATERIALS.traySurface} />
      <Box size={[w, h, wall]} position={[0, h / 2, -d / 2 + wall / 2]} material={MATERIALS.traySurface} />
      <Box size={[wall, h, d]} position={[w / 2 - wall / 2, h / 2, 0]} material={MATERIALS.traySurface} />
      <Box size={[wall, h, d]} position={[-w / 2 + wall / 2, h / 2, 0]} material={MATERIALS.traySurface} />
      <Box size={[wall, h * 0.8, d]} position={[3.6, (h * 0.8) / 2, 0]} material={MATERIALS.traySurface} />
    </group>
  );
}
