import type { Material } from "three";
import { RoundedBox as DreiRoundedBox } from "@react-three/drei";

type Vec3 = [number, number, number];

interface BoxProps {
  size: Vec3;
  position?: Vec3;
  rotation?: Vec3;
  material: Material;
}

export function Box({ size, position, rotation, material }: BoxProps) {
  return (
    <mesh position={position} rotation={rotation} material={material}>
      <boxGeometry args={size} />
    </mesh>
  );
}

export function RoundBox({ size, position, rotation, material, radius = 0.1 }: BoxProps & { radius?: number }) {
  return (
    <DreiRoundedBox args={size} radius={Math.min(radius, Math.min(...size) / 2 - 0.0001)} smoothness={3} position={position} rotation={rotation} material={material} />
  );
}

interface CylProps {
  radius: number;
  height: number;
  position?: Vec3;
  rotation?: Vec3;
  material: Material;
  segments?: number;
}

export function Cyl({ radius, height, position, rotation, material, segments = 16 }: CylProps) {
  return (
    <mesh position={position} rotation={rotation} material={material}>
      <cylinderGeometry args={[radius, radius, height, segments]} />
    </mesh>
  );
}
