import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { tagTexture } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Box } from "./primitives";

/**
 * Housings for cable plugs and the matching board/device receptacles.
 * Footprints follow the connector's pin grid × pitch (pitches from the
 * connector families: Mini-Fit 4.2 mm, 12V-2x6 3.0 mm, headers 2.54 mm,
 * USB 3 header 2.0 mm). Visual only; which plug fits which port is data.
 *
 * Origin: centre of the mating face. Receptacles grow down (−y) from it,
 * plugs grow up (+y) from it, so a plug placed on a port's origin sits on it.
 * Local x = the long side (columns), z = rows. The latch/key side is +z.
 */
export interface Footprint {
  x: number;
  z: number;
  plugH: number;
  portH: number;
  tag?: string;
  light?: boolean;
}

export const FOOTPRINTS: Record<string, Footprint> = {
  "atx-24": { x: 5.3, z: 1.1, plugH: 1.6, portH: 1.0, light: true },
  "eps-8": { x: 1.95, z: 1.1, plugH: 1.6, portH: 1.0, tag: "CPU" },
  "pcie-8": { x: 1.95, z: 1.1, plugH: 1.6, portH: 1.0, tag: "PCIe" },
  "pcie-6": { x: 1.5, z: 1.1, plugH: 1.6, portH: 1.0, tag: "PCIe" },
  "12v-2x6": { x: 2.0, z: 0.95, plugH: 1.4, portH: 0.9 },
  "sata-power": { x: 2.3, z: 0.55, plugH: 1.0, portH: 0.6 },
  "sata-data": { x: 1.05, z: 0.45, plugH: 0.9, portH: 0.55 },
  "fan-4pin": { x: 1.05, z: 0.5, plugH: 0.6, portH: 0.6, light: true },
  "fan-3pin": { x: 0.8, z: 0.5, plugH: 0.6, portH: 0.6, light: true },
  "usb3-header": { x: 2.2, z: 0.95, plugH: 1.0, portH: 0.9 },
  "usbc-header": { x: 1.0, z: 0.5, plugH: 0.9, portH: 0.7 },
  "usb2-header": { x: 1.4, z: 0.75, plugH: 0.9, portH: 0.7 },
  "hd-audio": { x: 1.4, z: 0.75, plugH: 0.9, portH: 0.7 },
  "fp-intel": { x: 1.4, z: 0.6, plugH: 0.9, portH: 0.0 },
};

const fallback: Footprint = { x: 1, z: 0.5, plugH: 0.8, portH: 0.6 };
export const footprintOf = (kind: string): Footprint => FOOTPRINTS[kind] ?? fallback;

function useTagMaterial(tag: string | undefined) {
  return useMemo(() => (tag ? new MeshStandardMaterial({ map: tagTexture(tag, { dark: true }), roughness: 0.6 }) : null), [tag]);
}

/** Cable-side plug. */
export function PlugModel({ kind }: { kind: string }) {
  const f = footprintOf(kind);
  const tagMat = useTagMaterial(f.tag);
  const body = MATERIALS.plug;
  return (
    <group>
      <Box size={[f.x, f.plugH, f.z]} position={[0, f.plugH / 2, 0]} material={body} />
      {/* latch / key on the +z side */}
      {kind === "atx-24" || kind.startsWith("eps") || kind.startsWith("pcie") || kind === "12v-2x6" ? (
        <Box size={[0.5, f.plugH * 0.7, 0.18]} position={[0, f.plugH * 0.55, f.z / 2 + 0.09]} material={body} />
      ) : null}
      {kind === "sata-power" || kind === "sata-data" ? (
        <Box size={[0.12, f.plugH * 0.8, f.z]} position={[f.x / 2 - 0.06, f.plugH * 0.45, 0.05]} material={body} />
      ) : null}
      {tagMat ? (
        <mesh position={[0, f.plugH * 0.6, -f.z / 2 - 0.005]} rotation={[0, Math.PI, 0]} material={tagMat}>
          <planeGeometry args={[Math.min(f.x * 0.8, 1.6), 0.5]} />
        </mesh>
      ) : null}
    </group>
  );
}

/** Board or device receptacle (shrouded header). */
export function PortModel({ kind }: { kind: string }) {
  const f = footprintOf(kind);
  const mat = f.light ? MATERIALS.connectorWhite : MATERIALS.slotBlack;
  if (f.portH === 0) return null;
  return (
    <group>
      <Box size={[f.x + 0.12, f.portH, f.z + 0.12]} position={[0, -f.portH / 2, 0]} material={mat} />
      <Box size={[f.x - 0.1, 0.02, f.z - 0.1]} position={[0, -0.01, 0]} material={MATERIALS.chip} />
      {kind === "atx-24" || kind.startsWith("eps") || kind.startsWith("pcie") || kind === "12v-2x6" ? (
        <Box size={[0.5, f.portH * 0.5, 0.14]} position={[0, -f.portH * 0.35, f.z / 2 + 0.12]} material={mat} />
      ) : null}
    </group>
  );
}

/** Bare 2-row pin header (front panel): pins only, no shroud. */
export function PinHeader({ cols, rows = 2, pitch = 0.254, missing = [] as number[] }: { cols: number; rows?: number; pitch?: number; missing?: number[] }) {
  const pins: Array<[number, number]> = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      // Pin numbering of the 2×5 front panel header: odd pins on one row, even on the other.
      const n = c * 2 + (r === 0 ? 1 : 2);
      if (!missing.includes(n)) pins.push([(c - (cols - 1) / 2) * pitch, (r - (rows - 1) / 2) * pitch]);
    }
  }
  return (
    <group>
      <Box size={[cols * pitch, 0.25, rows * pitch]} position={[0, 0.125, 0]} material={MATERIALS.slotBlack} />
      {pins.map(([x, z]) => (
        <Box key={`${x}:${z}`} size={[0.064, 0.6, 0.064]} position={[x, 0.3, z]} material={MATERIALS.gold} />
      ))}
    </group>
  );
}
