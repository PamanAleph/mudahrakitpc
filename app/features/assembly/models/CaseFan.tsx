import { useMemo, type Ref } from "react";
import { DoubleSide, MeshBasicMaterial, type Group } from "three";
import { arrowTexture } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Box, Cyl } from "./primitives";

export const FAN_DEPTH = 2.5;

/** Corner screw positions of a fan of this size, in the fan's local frame. */
export function fanScrewPoints(size: number): Array<[number, number, number]> {
  const o = size / 2 - 0.75;
  return [
    [o, o, -FAN_DEPTH / 2],
    [-o, o, -FAN_DEPTH / 2],
    [o, -o, -FAN_DEPTH / 2],
    [-o, -o, -FAN_DEPTH / 2],
  ];
}

/**
 * Square axial fan, axis along local z, air flows towards +z (the arrow on
 * the frame shows it). Origin at the centre. Size in cm (12 for 120 mm).
 */
export function CaseFan({ size = 12, rotorRef, depth = FAN_DEPTH }: { size?: number; rotorRef?: Ref<Group>; depth?: number }) {
  const half = size / 2;
  const blades = Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2);
  const arrow = useMemo(() => new MeshBasicMaterial({ map: arrowTexture(), transparent: true, side: DoubleSide, depthWrite: false }), []);
  const hub = size * 0.16;
  return (
    <group>
      <Box size={[size, 0.3, depth]} position={[0, half - 0.15, 0]} material={MATERIALS.fanFrame} />
      <Box size={[size, 0.3, depth]} position={[0, -half + 0.15, 0]} material={MATERIALS.fanFrame} />
      <Box size={[0.3, size, depth]} position={[half - 0.15, 0, 0]} material={MATERIALS.fanFrame} />
      <Box size={[0.3, size, depth]} position={[-half + 0.15, 0, 0]} material={MATERIALS.fanFrame} />
      {[
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].map(([sx, sy]) => (
        <group key={`${sx}${sy}`} position={[(sx as number) * (half - 0.9), (sy as number) * (half - 0.9), 0]}>
          <Box size={[1.8, 1.8, 0.35]} position={[0, 0, depth / 2 - 0.18]} material={MATERIALS.fanFrame} />
          <Box size={[1.8, 1.8, 0.35]} position={[0, 0, -depth / 2 + 0.18]} material={MATERIALS.fanFrame} />
        </group>
      ))}
      {/* Struts on the outlet side hold the motor */}
      {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map((a) => (
        <Box key={a} size={[half * 1.2, 0.3, 0.22]} position={[Math.cos(a) * half * 0.6, Math.sin(a) * half * 0.6, depth / 2 - 0.15]} rotation={[0, 0, a]} material={MATERIALS.fanFrame} />
      ))}
      {/* Airflow arrow on the side of the frame, pointing +z */}
      <mesh position={[half + 0.01, 0, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]} material={arrow}>
        <planeGeometry args={[1.4, 1.4]} />
      </mesh>
      <group ref={rotorRef}>
        <Cyl radius={hub} height={depth * 0.68} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.fanBlade} segments={28} />
        <Cyl radius={hub * 0.7} height={0.02} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -depth * 0.35]} material={MATERIALS.chipMarking} segments={28} />
        {blades.map((a) => (
          <group key={a} rotation={[0, 0, a]}>
            <Box size={[half - hub - 0.3, size * 0.19, 0.08]} position={[hub + (half - hub - 0.3) / 2, 0, 0]} rotation={[0.62, 0, 0.12]} material={MATERIALS.fanBlade} />
          </group>
        ))}
      </group>
    </group>
  );
}
