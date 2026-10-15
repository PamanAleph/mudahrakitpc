import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import type { StorageSpec } from "@shared/hardware";
import { m2BoardGeometry } from "../utils/geometryFactory";
import { goldFingerTexture, stickerTexture } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Box } from "./primitives";

export const M2_WIDTH = 2.2;
export const M2_THICKNESS = 0.08;

/** "2280" → 8.0 cm: the last two digits of the M.2 size code are the length in mm. */
export const m2LengthCm = (code: number | undefined) => ((code ?? 2280) % 100) / 10;

/**
 * M.2 card. Origin: middle of the contact edge, card extending along +z,
 * bottom face at y = 0. B+M cards show both notches (visual approximation of
 * the key positions, [BELUM DIKONFIRMASI]); the fit rule reads m2Key from data.
 */
export function M2Ssd({ spec }: { spec: StorageSpec }) {
  const length = m2LengthCm(spec.m2Length);
  const board = m2BoardGeometry(M2_WIDTH, length, M2_THICKNESS, -0.62);
  const sata = spec.interface === "sata";

  const mats = useMemo(() => {
    const fingerMat = new MeshStandardMaterial({ map: goldFingerTexture(30), metalness: 0.9, roughness: 0.28 });
    const label = new MeshStandardMaterial({
      map: stickerTexture(`m2:${spec.id}`, [sata ? "M.2 SATA" : "M.2 NVMe", `${spec.m2Length ?? ""} · ${spec.m2Key ?? "M"}`, sata ? "SATA 6Gb/s" : "PCIe x4"], {
        width: 256,
        height: 512,
        dark: true,
      }),
      roughness: 0.55,
    });
    return { fingerMat, label };
  }, [spec.id, spec.m2Length, spec.m2Key, sata]);

  return (
    <group>
      <mesh geometry={board} material={MATERIALS.ssdPcb} />
      {spec.m2Key === "B+M" ? <Box size={[0.13, M2_THICKNESS + 0.02, 0.42]} position={[0.55, M2_THICKNESS / 2, 0.2]} material={MATERIALS.chip} /> : null}
      <mesh position={[0, M2_THICKNESS + 0.002, 0.2]} rotation={[-Math.PI / 2, 0, 0]} material={mats.fingerMat}>
        <planeGeometry args={[M2_WIDTH - 0.2, 0.34]} />
      </mesh>
      <Box size={[1.2, 0.12, 1.2]} position={[0, M2_THICKNESS + 0.06, 1.3]} material={MATERIALS.chip} />
      <Box size={[1.6, 0.14, Math.min(1.8, length * 0.22)]} position={[0, M2_THICKNESS + 0.07, length * 0.5]} material={MATERIALS.chip} />
      {length > 5 ? <Box size={[1.6, 0.14, 1.8]} position={[0, M2_THICKNESS + 0.07, length * 0.76]} material={MATERIALS.chip} /> : null}
      <mesh position={[0, M2_THICKNESS + 0.155, length * 0.55]} rotation={[-Math.PI / 2, 0, 0]} material={mats.label}>
        <planeGeometry args={[M2_WIDTH - 0.15, length * 0.75]} />
      </mesh>
    </group>
  );
}
