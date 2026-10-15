import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import type { BoardSpec } from "@shared/hardware";
import { BOARD_T, RAM_SLOT_LEN, uv, type BoardLayout } from "../constants/layouts";
import { boardTexture, type BoardLabel } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Box, Cyl } from "./primitives";

export type DebugLedId = "CPU" | "DRAM" | "VGA" | "BOOT";
export const DEBUG_LEDS: DebugLedId[] = ["CPU", "DRAM", "VGA", "BOOT"];

export const RAM_SLOT_H = 0.75;
export const PCIE_SLOT_H = 1.1;
export const M2_STANDOFF_H = 0.42;

/** Standoff positions for M.2 cards along +v from the connector (2242/2260/2280). */
export const M2_LENGTHS_CM = [4.2, 6.0, 8.0];

/**
 * Motherboard: PCB, heatsinks, slot bodies and silkscreen. Interactive parts
 * (socket lever, DIMM latches, headers that take cables, the front panel
 * header) are added by the scene at the same template positions.
 * Origin: top-rear corner of the PCB on its top surface. u → −x, v → +z.
 */
export function BoardModel({ spec, layout, led }: { spec: BoardSpec; layout: BoardLayout; led: DebugLedId | null }) {
  const { t, size } = layout;
  const labels = useMemo<BoardLabel[]>(() => {
    const l: BoardLabel[] = [
      { text: spec.socket, u: t.socket.u + 3.4, v: t.socket.v - 2.6, size: 15 },
      { text: "CPU_FAN", u: t.cpuFan.u + 0.9, v: t.cpuFan.v, size: 11 },
      { text: "ATX_PWR", u: t.atx24.u - 3.4, v: t.atx24.v - 1.0, size: 11 },
      { text: "F_PANEL", u: t.frontPanel.u - 1.0, v: t.frontPanel.v, size: 11 },
      { text: "USB3", u: t.usb3.u - 1.6, v: t.usb3.v - 1.0, size: 11 },
      { text: "AUDIO", u: t.audio.u - 1.0, v: t.audio.v, size: 11 },
    ];
    layout.eps.forEach((p, i) => l.push({ text: `CPU_PWR${i + 1}`, u: p.u + 0.95, v: p.v, size: 11 }));
    layout.sysFans.forEach((p, i) => l.push({ text: `SYS_FAN${i + 1}`, u: p.u - 0.9, v: p.v, size: 11 }));
    Object.entries(layout.ram).forEach(([id, p]) => l.push({ text: id, u: p.u + RAM_SLOT_LEN / 2 + 0.5, v: p.v, size: 12 }));
    Object.entries(layout.pcie).forEach(([id, p]) => l.push({ text: id, u: p.u - 0.9, v: p.v - p.len / 2 + 1.0, size: 12 }));
    Object.entries(layout.m2).forEach(([id, p]) => l.push({ text: id, u: p.u - 1.6, v: p.v + 1.6, size: 12 }));
    spec.sataPorts.forEach((name, i) => {
      const p = layout.sata[i];
      if (p) l.push({ text: name, u: p.u, v: p.v - 1.1, size: 10, rotate: -Math.PI / 2 });
    });
    if (t.usbc) l.push({ text: "USB_C", u: t.usbc.u - 1.0, v: t.usbc.v - 0.9, size: 11 });
    if (t.usb2) l.push({ text: "USB2", u: t.usb2.u - 1.0, v: t.usb2.v, size: 11 });
    DEBUG_LEDS.forEach((name, i) => l.push({ text: name, u: t.debugLeds.u + i * 0.8, v: t.debugLeds.v + 0.7, size: 9, rotate: -Math.PI / 2 }));
    return l;
  }, [spec, layout, t]);

  const topMat = useMemo(
    () => new MeshStandardMaterial({ map: boardTexture(spec.id, size.length, size.width, labels), roughness: 0.62, metalness: 0.1 }),
    [spec.id, size.length, size.width, labels],
  );

  const rect = (r: { u0: number; u1: number; v0: number; v1: number }, h: number, y = 0) => ({
    size: [r.u1 - r.u0, h, r.v1 - r.v0] as [number, number, number],
    position: [-(r.u0 + r.u1) / 2, y + h / 2, (r.v0 + r.v1) / 2] as [number, number, number],
  });

  return (
    <group>
      <Box size={[size.length, BOARD_T, size.width]} position={[-size.length / 2, -BOARD_T / 2, size.width / 2]} material={MATERIALS.pcbEdge} />
      <mesh position={[-size.length / 2, 0.002, size.width / 2]} rotation={[-Math.PI / 2, 0, 0]} material={topMat}>
        <planeGeometry args={[size.length, size.width]} />
      </mesh>

      {/* Rear I/O shroud and VRM heatsinks */}
      <Box {...rect(t.ioShroud, 3.6)} material={MATERIALS.heatsink} />
      <Box {...rect(t.vrmTop, 2.0)} material={MATERIALS.heatsink} />
      <Box {...rect(t.vrmSide, 2.0)} material={MATERIALS.heatsink} />
      {[0.3, 0.9, 1.5].map((y) => (
        <Box key={y} size={[t.vrmTop.u1 - t.vrmTop.u0 + 0.02, 0.12, t.vrmTop.v1 - t.vrmTop.v0 + 0.02]} position={[-(t.vrmTop.u0 + t.vrmTop.u1) / 2, y + 0.4, (t.vrmTop.v0 + t.vrmTop.v1) / 2]} material={MATERIALS.heatsinkAccent} />
      ))}
      {/* Chokes along the VRM */}
      {Array.from({ length: 6 }, (_, i) => (
        <Box key={`ch${i}`} size={[0.65, 0.5, 0.65]} position={uv({ u: t.vrmTop.u1 + 0.6, v: t.vrmTop.v0 + 0.5 + i * ((t.vrmTop.v1 - t.vrmTop.v0 - 1) / 5) }, 0.25)} material={MATERIALS.choke} />
      ))}
      {/* Rear I/O ports showing at the back edge */}
      {[0, 1, 2].map((i) => (
        <Box key={`io${i}`} size={[1.4, 1.1, 1.0]} position={uv({ u: t.ioShroud.u0 + 1.2 + i * 2.8, v: -0.3 }, 0.55)} material={MATERIALS.chip} />
      ))}

      {t.chipset ? <Box size={[4.2, 0.9, 4.2]} position={uv(t.chipset, 0.45)} material={MATERIALS.heatsink} /> : null}
      {t.chipset ? <Box size={[3.2, 0.06, 3.2]} position={uv(t.chipset, 0.93)} material={MATERIALS.heatsinkAccent} /> : null}
      {t.battery ? <Cyl radius={1.0} height={0.32} position={uv(t.battery, 0.16)} material={MATERIALS.chrome} segments={28} /> : null}

      {/* Electrolytic caps around the socket */}
      {Array.from({ length: 5 }, (_, i) => (
        <group key={`cap${i}`} position={uv({ u: t.socket.u - 3.6 + i * 1.6, v: t.socket.v + 3.9 }, 0)}>
          <Cyl radius={0.32} height={0.9} position={[0, 0.45, 0]} material={MATERIALS.capacitor} segments={14} />
          <Cyl radius={0.33} height={0.04} position={[0, 0.91, 0]} material={MATERIALS.capacitorTop} segments={14} />
        </group>
      ))}

      {/* DIMM slots (latches are interactive and drawn by the scene) */}
      {Object.entries(layout.ram).map(([id, p]) => {
        const ch = spec.ramSlots.find((r) => r.id === id)?.channel;
        return <Box key={id} size={[RAM_SLOT_LEN, RAM_SLOT_H, 0.62]} position={uv(p, RAM_SLOT_H / 2)} material={ch === "B" ? MATERIALS.slotGrey : MATERIALS.slotBlack} />;
      })}

      {/* PCIe slots: x16 slots get the steel reinforcement */}
      {Object.entries(layout.pcie).map(([id, p]) => (
        <group key={id}>
          <Box size={[0.75, PCIE_SLOT_H, p.len]} position={uv(p, PCIE_SLOT_H / 2)} material={MATERIALS.slotBlack} />
          {p.len > 5 ? <Box size={[0.8, PCIE_SLOT_H - 0.1, p.len - 0.4]} position={uv(p, PCIE_SLOT_H / 2)} material={MATERIALS.steelBright} /> : null}
          {p.len > 5 ? <Box size={[0.9, 0.4, 0.5]} position={uv({ u: p.u, v: p.v + p.len / 2 + 0.3 }, 0.5)} material={MATERIALS.latch} /> : null}
          <Box size={[0.2, 0.02, p.len - 0.3]} position={uv(p, PCIE_SLOT_H + 0.005)} material={MATERIALS.chip} />
        </group>
      ))}

      {/* M.2 connectors and standoffs */}
      {Object.entries(layout.m2).map(([id, p]) => (
        <group key={id}>
          <Box size={[2.3, 0.45, 0.6]} position={uv({ u: p.u, v: p.v - 0.3 }, 0.225)} material={MATERIALS.slotBlack} />
          {M2_LENGTHS_CM.map((len) => (
            <Cyl key={len} radius={len === 8 ? 0.22 : 0.12} height={len === 8 ? M2_STANDOFF_H : 0.04} position={uv({ u: p.u, v: p.v + len }, len === 8 ? M2_STANDOFF_H / 2 : 0.02)} material={len === 8 ? MATERIALS.brass : MATERIALS.gold} segments={12} />
          ))}
        </group>
      ))}

      {/* Debug LEDs: the one matching the failing stage lights up */}
      {DEBUG_LEDS.map((name, i) => (
        <Box key={name} size={[0.3, 0.12, 0.18]} position={uv({ u: t.debugLeds.u + i * 0.8, v: t.debugLeds.v }, 0.06)} material={led === name ? MATERIALS.ledOn : MATERIALS.ledOff} />
      ))}
      {/* Chips: audio codec, LAN, super I/O */}
      <Box size={[0.9, 0.12, 0.9]} position={uv({ u: t.audio.u - 2.4, v: t.audio.v + 1.2 }, 0.06)} material={MATERIALS.chip} />
      <Box size={[0.8, 0.12, 0.8]} position={uv({ u: t.ioShroud.u1 + 1.3, v: 3.4 }, 0.06)} material={MATERIALS.chip} />
      <Box size={[1.4, 0.12, 1.4]} position={uv({ u: t.frontPanel.u - 3.2, v: t.frontPanel.v - 3.4 }, 0.06)} material={MATERIALS.chip} />
    </group>
  );
}
