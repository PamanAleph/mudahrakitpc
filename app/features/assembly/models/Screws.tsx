import { panHeadGeometry, threadGeometry } from "../utils/geometryFactory";
import { MATERIALS } from "./materials";
import { Box, Cyl } from "./primitives";

/** Phillips cross recess on top of a head. */
function CrossRecess({ radius, y }: { radius: number; y: number }) {
  return (
    <group position={[0, y, 0]}>
      <Box size={[radius * 1.25, radius * 0.18, radius * 0.22]} material={MATERIALS.chip} />
      <Box size={[radius * 0.22, radius * 0.18, radius * 1.25]} material={MATERIALS.chip} />
    </group>
  );
}

/** Pan-head machine screw (e.g. M2 for M.2 cards). Origin under the head. */
export function PanHeadScrew({ headRadius = 0.2, length = 0.35 }: { headRadius?: number; length?: number }) {
  const headH = headRadius * 0.65;
  const shaftR = headRadius * 0.42;
  return (
    <group>
      <mesh geometry={panHeadGeometry(headRadius, headH)} material={MATERIALS.steelBright} />
      <CrossRecess radius={headRadius} y={headH * 0.92} />
      <Cyl radius={shaftR * 0.86} height={length} position={[0, -length / 2, 0]} material={MATERIALS.steelBright} segments={12} />
      <mesh geometry={threadGeometry(shaftR * 0.9, length * 0.95, headRadius * 0.2)} material={MATERIALS.steelBright} />
    </group>
  );
}

/** Knurled thumbscrew with a Phillips recess, as on glass side panels. Origin under the head. */
export function Thumbscrew({ headRadius = 0.55 }: { headRadius?: number }) {
  const headH = 0.42;
  const length = 0.8;
  return (
    <group>
      <Cyl radius={headRadius * 0.62} height={0.08} position={[0, 0.04, 0]} material={MATERIALS.steelBright} segments={20} />
      <mesh position={[0, 0.08 + headH / 2, 0]} material={MATERIALS.knurl}>
        {/* Flat-shaded facets read as knurling */}
        <cylinderGeometry args={[headRadius, headRadius, headH, 30]} />
      </mesh>
      <Cyl radius={headRadius * 0.82} height={0.03} position={[0, 0.08 + headH + 0.015, 0]} material={MATERIALS.chrome} segments={30} />
      <CrossRecess radius={headRadius * 0.6} y={0.08 + headH + 0.02} />
      <Cyl radius={0.15} height={length} position={[0, -length / 2, 0]} material={MATERIALS.steelBright} segments={12} />
      <mesh geometry={threadGeometry(0.16, length * 0.95, 0.08)} material={MATERIALS.steelBright} />
    </group>
  );
}
