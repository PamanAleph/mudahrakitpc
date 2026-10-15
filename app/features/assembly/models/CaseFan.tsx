import { MATERIALS } from "./materials";
import { Box, Cyl } from "./primitives";

type Vec3 = [number, number, number];

/** 120 mm case fan, axis along local z. Size in cm. */
export function CaseFan({ position, rotation, size = 12 }: { position: Vec3; rotation?: Vec3; size?: number }) {
  const half = size / 2;
  const depth = 2.5;
  const blades = Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2);
  return (
    <group position={position} rotation={rotation}>
      {/* Frame walls */}
      <Box size={[size, 0.3, depth]} position={[0, half - 0.15, 0]} material={MATERIALS.fanFrame} />
      <Box size={[size, 0.3, depth]} position={[0, -half + 0.15, 0]} material={MATERIALS.fanFrame} />
      <Box size={[0.3, size, depth]} position={[half - 0.15, 0, 0]} material={MATERIALS.fanFrame} />
      <Box size={[0.3, size, depth]} position={[-half + 0.15, 0, 0]} material={MATERIALS.fanFrame} />
      {/* Corner pads with screw holes */}
      {[
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].map(([sx, sy]) => (
        <group key={`${sx}${sy}`} position={[(sx as number) * (half - 1.1), (sy as number) * (half - 1.1), 0]}>
          <Box size={[2.2, 2.2, 0.35]} position={[0, 0, depth / 2 - 0.18]} material={MATERIALS.fanFrame} />
          <Box size={[2.2, 2.2, 0.35]} position={[0, 0, -depth / 2 + 0.18]} material={MATERIALS.fanFrame} />
          <Cyl radius={0.25} height={0.37} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, depth / 2 - 0.17]} material={MATERIALS.rubber} />
        </group>
      ))}
      {/* Motor struts on the back */}
      {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map((a) => (
        <Box key={a} size={[half * 1.25, 0.35, 0.25]} position={[Math.cos(a) * half * 0.62, Math.sin(a) * half * 0.62, -depth / 2 + 0.15]} rotation={[0, 0, a]} material={MATERIALS.fanFrame} />
      ))}
      {/* Hub and blades */}
      <Cyl radius={1.9} height={1.7} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.fanBlade} segments={28} />
      <Cyl radius={1.3} height={0.02} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.86]} material={MATERIALS.chipMarking} segments={28} />
      {blades.map((a) => (
        <group key={a} rotation={[0, 0, a]}>
          <Box size={[half - 2.1, 2.3, 0.08]} position={[1.9 + (half - 2.1) / 2, 0, 0]} rotation={[0.62, 0, 0.12]} material={MATERIALS.fanBlade} />
        </group>
      ))}
    </group>
  );
}
