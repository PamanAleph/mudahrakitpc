import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { SSD_BOARD } from "../constants/sceneLayout";
import { HARDWARE } from "../services/hardwareSpec";
import { m2BoardGeometry } from "../utils/geometryFactory";
import { goldFingerTexture, stickerTexture } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Box } from "./primitives";

/**
 * M.2 2280 NVMe card. Origin at the middle of the contact edge, card
 * extending along +z, bottom face at y = 0.
 */
export function M2Ssd({ pcbMaterial }: { pcbMaterial: MeshStandardMaterial }) {
  const { width, length, thickness } = SSD_BOARD;
  // M-key notch sits off-centre; visual approximation.
  const board = m2BoardGeometry(width, length, thickness, -0.62);

  const mats = useMemo(() => {
    const fingerMat = new MeshStandardMaterial({ map: goldFingerTexture(30), metalness: 0.9, roughness: 0.28 });
    const label = new MeshStandardMaterial({
      map: stickerTexture("ssd", [`NVMe · M.2 ${HARDWARE.ssd.formFactor}`, HARDWARE.ssd.name.toUpperCase(), `${HARDWARE.ssd.key}-KEY · PCIe`], {
        width: 256,
        height: 512,
        dark: true,
      }),
      roughness: 0.55,
    });
    return { fingerMat, label };
  }, []);

  return (
    <group>
      <mesh geometry={board} material={pcbMaterial} />
      <mesh position={[0, thickness + 0.002, 0.2]} rotation={[-Math.PI / 2, 0, 0]} material={mats.fingerMat}>
        <planeGeometry args={[width - 0.2, 0.34]} />
      </mesh>
      {/* Controller, DRAM cache, NAND packages under the label */}
      <Box size={[1.2, 0.12, 1.2]} position={[0, thickness + 0.06, 1.3]} material={MATERIALS.chip} />
      <Box size={[0.9, 0.1, 0.7]} position={[0, thickness + 0.05, 2.4]} material={MATERIALS.chip} />
      <Box size={[1.6, 0.14, 1.8]} position={[0, thickness + 0.07, 4.0]} material={MATERIALS.chip} />
      <Box size={[1.6, 0.14, 1.8]} position={[0, thickness + 0.07, 6.1]} material={MATERIALS.chip} />
      <mesh position={[0, thickness + 0.155, 4.3]} rotation={[-Math.PI / 2, 0, 0]} material={mats.label}>
        <planeGeometry args={[width - 0.15, 6.2]} />
      </mesh>
    </group>
  );
}
