import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { RAM_STICK } from "../constants/sceneLayout";
import { HARDWARE } from "../services/hardwareSpec";
import { dimmBoardGeometry } from "../utils/geometryFactory";
import { goldFingerTexture, stickerTexture } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Box } from "./primitives";

/**
 * DDR5 DIMM with heat spreaders. Origin at the middle of the contact edge.
 * The key notch sits at +notchOffset on local x: that offset is the fact the
 * slot checks against, so it comes from data/ram.json.
 */
export function RamStick({ pcbMaterial }: { pcbMaterial: MeshStandardMaterial }) {
  const { length, height, thickness, notchOffset } = RAM_STICK;
  const board = dimmBoardGeometry(length, height, thickness, notchOffset);

  const mats = useMemo(() => {
    const fingers = goldFingerTexture(72);
    const fingerMat = new MeshStandardMaterial({ map: fingers, metalness: 0.9, roughness: 0.28 });
    const sticker = new MeshStandardMaterial({
      map: stickerTexture("ram", [`${HARDWARE.ram.type} · ${HARDWARE.ram.pins}-PIN`, HARDWARE.ram.name.toUpperCase(), "1.1V · DIMM"], {
        width: 512,
        height: 128,
      }),
      roughness: 0.6,
    });
    return { fingerMat, sticker };
  }, []);

  const left = length / 2 + notchOffset - 0.11;
  const right = length / 2 - notchOffset - 0.11;
  const spreaderH = height - 0.85;
  const spreaderY = 0.62 + spreaderH / 2;

  return (
    <group>
      <mesh geometry={board} material={pcbMaterial} />
      {/* Gold fingers on both faces, split by the key notch */}
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
      {/* Heat spreaders, clipped on both faces */}
      {[1, -1].map((side) => (
        <group key={`hs${side}`} position={[0, spreaderY, side * (thickness / 2 + 0.06)]}>
          <Box size={[length - 0.5, spreaderH, 0.1]} material={MATERIALS.ramSpreader} />
          <Box size={[length - 0.9, 0.08, 0.02]} position={[0, spreaderH / 2 - 0.25, side * 0.06]} material={MATERIALS.heatsinkAccent} />
        </group>
      ))}
      <mesh position={[1.6, spreaderY - 0.2, thickness / 2 + 0.115]} material={mats.sticker}>
        <planeGeometry args={[6.4, 1.6]} />
      </mesh>
      {/* Top edge of the spreader folds over the PCB */}
      <Box size={[length - 0.5, 0.08, thickness + 0.32]} position={[0, height - 0.2, 0]} material={MATERIALS.ramSpreader} />
    </group>
  );
}
