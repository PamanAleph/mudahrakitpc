import type { ReactNode } from "react";
import { CASE, PANEL_SCREW_IDS, PANEL_SCREW_LOCAL, PANEL_THICKNESS } from "../constants/sceneLayout";
import { MATERIALS } from "./materials";
import { Box } from "./primitives";

/** Tempered-glass side panel with a printed black border and rubber-grommeted screw holes. */
export function SideGlassPanel({ children }: { children?: ReactNode }) {
  const L = CASE.length;
  const D = CASE.depth;
  const band = 2.4;
  return (
    <group>
      <mesh position={[0, PANEL_THICKNESS / 2, 0]} material={MATERIALS.glass} renderOrder={2}>
        <boxGeometry args={[L, PANEL_THICKNESS, D]} />
      </mesh>
      {/* Ceramic frit border printed on the inside of the glass */}
      <Box size={[L, 0.02, band]} position={[0, 0.03, D / 2 - band / 2]} material={MATERIALS.glassFrit} />
      <Box size={[L, 0.02, band]} position={[0, 0.03, -D / 2 + band / 2]} material={MATERIALS.glassFrit} />
      <Box size={[band, 0.02, D - band * 2]} position={[L / 2 - band / 2, 0.03, 0]} material={MATERIALS.glassFrit} />
      <Box size={[band, 0.02, D - band * 2]} position={[-L / 2 + band / 2, 0.03, 0]} material={MATERIALS.glassFrit} />
      {PANEL_SCREW_IDS.map((id) => {
        const [x, , z] = PANEL_SCREW_LOCAL[id];
        return (
          <mesh key={id} position={[x, PANEL_THICKNESS + 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} material={MATERIALS.rubber}>
            <ringGeometry args={[0.32, 0.7, 24]} />
          </mesh>
        );
      })}
      {children}
    </group>
  );
}
