import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import type { RamSpec } from "@shared/hardware";
import { dimmBoardGeometry } from "../utils/geometryFactory";
import { goldFingerTexture, stickerTexture } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Box } from "./primitives";

/** DIMM length (133.35 mm) is the JEDEC standard for both DDR4 and DDR5. */
export const DIMM_LENGTH = 13.335;
export const DIMM_THICKNESS = 0.12;
/**
 * Key notch offset from the centre, cm. Visual approximation per type
 * [BELUM DIKONFIRMASI]: the rule that blocks a DDR4 stick in a DDR5 slot reads
 * the type from data, not this offset.
 */
export const NOTCH_OFFSET = { DDR4: 0.43, DDR5: -0.2 } as const;

/**
 * DIMM with heat spreaders. Origin: middle of the contact edge, stick standing
 * in the local xy plane (length along x, height along y).
 */
export function RamStick({ spec }: { spec: RamSpec }) {
  const length = DIMM_LENGTH;
  const height = spec.heightCm;
  const thickness = DIMM_THICKNESS;
  const notch = NOTCH_OFFSET[spec.type];
  const board = dimmBoardGeometry(length, Math.min(height, 3.125), thickness, notch);

  const mats = useMemo(() => {
    const fingerMat = new MeshStandardMaterial({ map: goldFingerTexture(72), metalness: 0.9, roughness: 0.28 });
    const sticker = new MeshStandardMaterial({
      map: stickerTexture(`ram:${spec.id}`, [`${spec.type} · ${spec.capacityGbPerStick} GB`, "DIMM · 288-PIN", spec.type === "DDR5" ? "1.1V" : "1.2V"], { width: 512, height: 128 }),
      roughness: 0.6,
    });
    return { fingerMat, sticker };
  }, [spec.id, spec.type, spec.capacityGbPerStick]);

  const left = length / 2 + notch - 0.11;
  const right = length / 2 - notch - 0.11;
  const spreaderH = height - 0.85;
  const spreaderY = 0.62 + spreaderH / 2;

  return (
    <group>
      <mesh geometry={board} material={MATERIALS.ramPcb} />
      {[1, -1].map((side) => (
        <group key={side} position={[0, 0.16, side * (thickness / 2 + 0.002)]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
          <mesh position={[side > 0 ? -length / 2 + left / 2 : length / 2 - left / 2, 0, 0]} material={mats.fingerMat}>
            <planeGeometry args={[left - 0.1, 0.3]} />
          </mesh>
          <mesh position={[side > 0 ? length / 2 - right / 2 : -length / 2 + right / 2, 0, 0]} material={mats.fingerMat}>
            <planeGeometry args={[right - 0.1, 0.3]} />
          </mesh>
        </group>
      ))}
      {[1, -1].map((side) => (
        <group key={`hs${side}`} position={[0, spreaderY, side * (thickness / 2 + 0.06)]}>
          <Box size={[length - 0.5, spreaderH, 0.1]} material={MATERIALS.ramSpreader} />
          <Box size={[length - 0.9, 0.08, 0.02]} position={[0, spreaderH / 2 - 0.25, side * 0.06]} material={MATERIALS.heatsinkAccent} />
        </group>
      ))}
      <mesh position={[1.6, spreaderY - 0.1, thickness / 2 + 0.115]} material={mats.sticker}>
        <planeGeometry args={[6.4, Math.min(1.6, spreaderH - 0.3)]} />
      </mesh>
      <Box size={[length - 0.5, 0.08, thickness + 0.32]} position={[0, height - 0.2, 0]} material={MATERIALS.ramSpreader} />
    </group>
  );
}
