import { useMemo, type Ref } from "react";
import { MeshStandardMaterial, type Group } from "three";
import type { GpuSpec } from "@shared/hardware";
import { SLOT_PITCH } from "../constants/layouts";
import { goldFingerTexture } from "../utils/proceduralTextures";
import { CaseFan } from "./CaseFan";
import { MATERIALS } from "./materials";
import { Box } from "./primitives";

type Vec3 = [number, number, number];

export const GPU_HEIGHT = 11.1;
export const GPU_BRACKET_H = 12.0;
export const PCIE_X16_FINGERS = 8.9;

/** Power connector positions on the top edge (GPU-local, mating face up). */
export function gpuPowerPorts(spec: GpuSpec): Vec3[] {
  const out: Vec3[] = [];
  let k = 0;
  for (const c of spec.powerConnectors) {
    for (let n = 0; n < c.count; n++, k++) out.push([-0.9, GPU_HEIGHT + 0.6, spec.lengthCm - 3.2 - k * 2.8]);
  }
  return out;
}

/** Bracket screws (into the case's slot ledge). */
export function gpuScrewPoints(spec: GpuSpec): Vec3[] {
  return Array.from({ length: Math.min(2, spec.slots) }, (_, i) => [-i * SLOT_PITCH - 0.2, GPU_BRACKET_H + 0.1, 0.55] as Vec3);
}

/**
 * Graphics card. Origin: on the rear bracket plane (z = 0), at the bottom of
 * the PCIe fingers (y = 0), in the PCB plane (x = 0). The card extends along +z
 * (length from data), stands up along +y, and its cooler hangs towards −x over
 * `slots` expansion slots (from data). `fingerStart` = distance from the bracket
 * to where the x16 fingers begin, set by the slot position on the board.
 */
export function GpuModel({ spec, fingerStart, rotorRefs }: { spec: GpuSpec; fingerStart: number; rotorRefs?: Array<Ref<Group>> }) {
  const L = spec.lengthCm;
  const thick = spec.slots * SLOT_PITCH - 0.5;
  const fanCount = L > 28 ? 3 : L > 20 ? 2 : 1;
  const fanSize = Math.min(9.2, (L - 2) / fanCount - 0.4);
  const fingers = useMemo(() => new MeshStandardMaterial({ map: goldFingerTexture(82), metalness: 0.9, roughness: 0.3 }), []);
  const portsInfo = gpuPowerPorts(spec);

  return (
    <group>
      {/* PCB and the x16 edge connector */}
      <Box size={[0.16, GPU_HEIGHT - 0.8, L - 0.4]} position={[0, 0.8 + (GPU_HEIGHT - 0.8) / 2, 0.2 + (L - 0.4) / 2]} material={MATERIALS.pcbEdge} />
      <Box size={[0.16, 0.8, PCIE_X16_FINGERS]} position={[0, 0.4, fingerStart + PCIE_X16_FINGERS / 2]} material={MATERIALS.pcbEdge} />
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.081, 0.38, fingerStart + PCIE_X16_FINGERS / 2]} rotation={[0, (s * Math.PI) / 2, 0]} material={fingers}>
          <planeGeometry args={[PCIE_X16_FINGERS - 0.1, 0.6]} />
        </mesh>
      ))}
      {/* Backplate */}
      {L > 18 ? <Box size={[0.2, GPU_HEIGHT - 0.6, L - 0.8]} position={[0.2, 0.9 + (GPU_HEIGHT - 0.6) / 2, 0.4 + (L - 0.8) / 2]} material={MATERIALS.gpuBackplate} /> : null}
      {/* Heatsink and shroud */}
      <Box size={[thick * 0.45, GPU_HEIGHT - 1.4, L - 1.6]} position={[-0.3 - thick * 0.225, 1.2 + (GPU_HEIGHT - 1.4) / 2, 0.8 + (L - 1.6) / 2]} material={MATERIALS.heatsink} />
      <Box size={[0.5, GPU_HEIGHT, L - 0.6]} position={[-thick + 0.25, 0.8 + GPU_HEIGHT / 2, 0.6 + (L - 0.6) / 2]} material={MATERIALS.gpuShroud} />
      <Box size={[thick - 0.2, 0.4, L - 0.6]} position={[-thick / 2 - 0.1, GPU_HEIGHT + 0.6, 0.6 + (L - 0.6) / 2]} material={MATERIALS.gpuShroud} />
      <Box size={[thick - 0.2, 0.4, L - 0.6]} position={[-thick / 2 - 0.1, 1.0, 0.6 + (L - 0.6) / 2]} material={MATERIALS.gpuShroud} />
      {Array.from({ length: fanCount }, (_, i) => (
        <group key={i} position={[-thick - 0.05, 0.8 + GPU_HEIGHT / 2, 1.2 + (L - 2) * ((i + 0.5) / fanCount)]} rotation={[0, Math.PI / 2, 0]}>
          <CaseFan size={fanSize} depth={1.0} rotorRef={rotorRefs?.[i]} />
        </group>
      ))}
      {/* Rear bracket with display outputs and the screw tab */}
      <Box size={[thick + 0.6, GPU_BRACKET_H, 0.1]} position={[-thick / 2 + 0.1, GPU_BRACKET_H / 2 - 0.4, -0.05]} material={MATERIALS.steelBright} />
      <Box size={[thick + 0.6, 0.1, 1.1]} position={[-thick / 2 + 0.1, GPU_BRACKET_H - 0.4, 0.5]} material={MATERIALS.steelBright} />
      {[2.5, 4.6, 6.7, 8.8].map((y) => (
        <Box key={y} size={[0.9, 1.1, 0.12]} position={[-0.8, y, -0.12]} material={MATERIALS.chip} />
      ))}
      {portsInfo.map((p, i) => (
        <Box key={i} size={[1.2, 0.5, 2.4]} position={[p[0], GPU_HEIGHT + 0.6 - 0.25, p[2]]} material={MATERIALS.gpuShroud} />
      ))}
    </group>
  );
}
