import type { Material } from "three";
import type { BitId } from "../types/hardwareTypes";
import { gripGeometry } from "../utils/geometryFactory";
import { MATERIALS } from "./materials";
import { Box, Cyl } from "./primitives";

/** Phillips tip size per bit, in cm. Visual scale only; the fit rule reads data/fasteners.json. */
export const BIT_TIP_RADIUS: Record<BitId, number> = { PH0: 0.1, PH1: 0.15, PH2: 0.21 };

/**
 * Precision screwdriver with a swappable Phillips bit.
 * Origin at the very tip, body extending along +y.
 */
export function Screwdriver({ bit, gripMaterial }: { bit: BitId; gripMaterial: Material }) {
  const r = BIT_TIP_RADIUS[bit];
  return (
    <group>
      {/* Phillips tip: cone with two crossed fins */}
      <mesh position={[0, 0.25, 0]} rotation={[Math.PI, 0, 0]} material={MATERIALS.chrome}>
        <coneGeometry args={[r * 1.15, 0.5, 4]} />
      </mesh>
      <Box size={[r * 2.2, 0.36, r * 0.35]} position={[0, 0.3, 0]} material={MATERIALS.chrome} />
      <Box size={[r * 0.35, 0.36, r * 2.2]} position={[0, 0.3, 0]} material={MATERIALS.chrome} />
      {/* Hex bit shank */}
      <Cyl radius={0.3} height={2.0} position={[0, 1.5, 0]} material={MATERIALS.chrome} segments={6} />
      {/* Magnetic bit holder + shaft */}
      <Cyl radius={0.36} height={0.8} position={[0, 2.9, 0]} material={MATERIALS.steelBright} segments={20} />
      <Cyl radius={0.28} height={5.6} position={[0, 6.1, 0]} material={MATERIALS.chrome} segments={16} />
      {/* Ferrule */}
      <Cyl radius={0.5} height={0.5} position={[0, 9.15, 0]} material={MATERIALS.steelBright} segments={24} />
      {/* Grip with rubber bands and a spinning end cap */}
      <mesh geometry={gripGeometry()} position={[0, 9.4, 0]} material={gripMaterial} />
      {[11.2, 12.6, 14.0].map((y) => (
        <Cyl key={y} radius={0.93} height={0.28} position={[0, y, 0]} material={MATERIALS.gripRubber} segments={24} />
      ))}
      <Cyl radius={0.5} height={0.12} position={[0, 16.72, 0]} material={MATERIALS.steelBright} segments={24} />
    </group>
  );
}
