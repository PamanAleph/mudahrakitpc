import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import type { StorageSpec } from "@shared/hardware";
import { stickerTexture } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Box, Cyl } from "./primitives";

type Vec3 = [number, number, number];

/** Outer sizes (cm) of the drive form factors: 3.5" 101.6 × 147 × 26.1 mm, 2.5" 69.85 × 100 × 7 mm (SFF-8301 / SFF-8201). */
export function driveSize(spec: StorageSpec): { x: number; y: number; z: number } {
  return spec.kind === "3.5" ? { x: 10.16, y: 2.61, z: 14.7 } : { x: 6.985, y: 0.7, z: 10.0 };
}

/** SATA data and power receptacles on the −z end (drive-local; mating face towards −z, rotated by the scene). */
export function drivePorts(spec: StorageSpec): { data: Vec3; power: Vec3 } {
  const s = driveSize(spec);
  const y = s.y * 0.5;
  return { data: [s.x / 2 - 1.2, y, -s.z / 2], power: [s.x / 2 - 3.3, y, -s.z / 2] };
}

/** Side mounting screws: 6-32 on 3.5" drives, M3 on 2.5" (screw ids come from data). */
export function driveScrewPoints(spec: StorageSpec): Vec3[] {
  const s = driveSize(spec);
  const y = s.y / 2;
  const z = s.z * 0.3;
  return [
    [s.x / 2 + 0.05, y, z],
    [s.x / 2 + 0.05, y, -z],
    [-s.x / 2 - 0.05, y, z],
    [-s.x / 2 - 0.05, y, -z],
  ];
}

/**
 * 2.5" SSD / SSHD or 3.5" HDD, lying flat. Origin: centre of the bottom face.
 * The SATA connectors face −z.
 */
export function DriveModel({ spec }: { spec: StorageSpec }) {
  const s = driveSize(spec);
  const label = useMemo(
    () =>
      new MeshStandardMaterial({
        map: stickerTexture(`drive:${spec.id}`, [spec.kind === "3.5" ? 'HDD 3.5"' : spec.hybrid ? 'SSHD 2.5"' : 'SSD 2.5"', "SATA 6Gb/s", spec.hybrid ? "HDD + NAND CACHE" : spec.kind === "3.5" ? "7200 RPM" : "SATA III"], {
          width: 512,
          height: 384,
          dark: spec.kind !== "3.5",
        }),
        roughness: 0.6,
      }),
    [spec.id, spec.kind, spec.hybrid],
  );
  const ports = drivePorts(spec);
  return (
    <group>
      {spec.kind === "3.5" ? (
        <>
          <Box size={[s.x, s.y * 0.75, s.z]} position={[0, s.y * 0.375, 0]} material={MATERIALS.driveBody} />
          <Box size={[s.x - 0.4, s.y * 0.25, s.z - 0.4]} position={[0, s.y * 0.875, 0]} material={MATERIALS.driveBody} />
          {/* Bottom PCB visible on the underside edge */}
          <Box size={[s.x * 0.8, 0.12, s.z * 0.5]} position={[0, 0.06, -s.z * 0.2]} material={MATERIALS.pcbEdge} />
          {[[-2.8, 3.2], [2.8, 3.2], [-2.8, -3.2], [2.8, -3.2]].map(([x, z]) => (
            <Cyl key={`${x}${z}`} radius={0.18} height={0.04} position={[x as number, s.y + 0.02, z as number]} material={MATERIALS.chrome} segments={10} />
          ))}
        </>
      ) : (
        <Box size={[s.x, s.y, s.z]} position={[0, s.y / 2, 0]} material={spec.hybrid ? MATERIALS.driveBody : MATERIALS.driveDark} />
      )}
      <mesh position={[0, s.y + 0.003, 0.4]} rotation={[-Math.PI / 2, 0, 0]} material={label}>
        <planeGeometry args={[s.x * 0.8, s.z * 0.55]} />
      </mesh>
      {/* Connector block: 7-pin data and 15-pin power, keyed L shapes */}
      <Box size={[1.05, 0.45, 0.4]} position={[ports.data[0], ports.data[1], -s.z / 2 + 0.15]} material={MATERIALS.chip} />
      <Box size={[2.3, 0.55, 0.4]} position={[ports.power[0], ports.power[1], -s.z / 2 + 0.15]} material={MATERIALS.chip} />
    </group>
  );
}
