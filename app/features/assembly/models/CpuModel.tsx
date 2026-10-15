import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import type { CpuSpec } from "@shared/hardware";
import { stickerTexture } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Box, Cyl } from "./primitives";

export const CPU_HEIGHT = 0.45;

/** Package footprint in cm, x = length, z = width. Sizes come from data (packageMm). */
export function cpuFootprint(spec: CpuSpec): { x: number; z: number } {
  return { x: spec.packageMm.length / 10, z: spec.packageMm.width / 10 };
}

/**
 * Desktop CPU package. Origin: centre of the package bottom.
 * The gold triangle marks pin 1 at the (−x, −z) corner; the socket shows
 * the same mark, so a 180° turn (Ry π) is visibly wrong.
 */
export function CpuModel({ spec }: { spec: CpuSpec }) {
  const { x, z } = cpuFootprint(spec);
  const lid = useMemo(
    () =>
      new MeshStandardMaterial({
        map: stickerTexture(`cpu:${spec.id}`, [spec.socket, "DESKTOP CPU", spec.integratedGraphics ? "iGPU" : "NO iGPU"], { width: 256, height: 256, dark: true }),
        metalness: 0.8,
        roughness: 0.35,
        color: "#c9ccd1",
      }),
    [spec.id, spec.socket, spec.integratedGraphics],
  );
  const ihsX = x * 0.72;
  const ihsZ = z * 0.78;
  return (
    <group>
      <Box size={[x, 0.12, z]} position={[0, 0.06, 0]} material={MATERIALS.substrate} />
      {/* PGA parts (contacts on the CPU) get a pin field underneath */}
      {spec.contacts === "cpu" ? <Box size={[x * 0.86, 0.12, z * 0.86]} position={[0, -0.06, 0]} material={MATERIALS.gold} /> : null}
      <Box size={[ihsX, 0.08, ihsZ]} position={[0, 0.16, 0]} material={MATERIALS.aluminium} />
      <Box size={[ihsX - 0.3, 0.22, ihsZ - 0.3]} position={[0, 0.31, 0]} material={MATERIALS.aluminium} />
      <mesh position={[0, 0.421, 0]} rotation={[-Math.PI / 2, 0, 0]} material={lid}>
        <planeGeometry args={[ihsX - 0.5, ihsZ - 0.5]} />
      </mesh>
      {/* Pin-1 triangle */}
      <mesh position={[-x / 2 + 0.35, 0.121, -z / 2 + 0.35]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} material={MATERIALS.gold}>
        <circleGeometry args={[0.28, 3]} />
      </mesh>
      {/* Small SMD caps on the substrate edge */}
      {Array.from({ length: 6 }, (_, i) => (
        <Cyl key={i} radius={0.05} height={0.06} position={[x / 2 - 0.3, 0.15, -z / 2 + 0.8 + i * 0.4]} material={MATERIALS.capacitor} segments={8} />
      ))}
    </group>
  );
}

/** Thermal paste blob on the IHS. Radius in cm per amount (visual). */
export const PASTE_RADIUS = { none: 0, sedikit: 0.25, pas: 0.55, banyak: 1.4 } as const;
