import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import {
  BOARD_ORIGIN,
  BOARD_SIZE,
  BOARD_THICKNESS,
  CPU_SOCKET_LOCAL,
  M2_CONNECTOR_LOCAL,
  MOUNTING_HOLES_LOCAL,
  PCIE_X16_LOCAL,
  RAM_SLOT,
  RAM_SLOT_IDS,
  RAM_SLOT_LOCAL_Z,
  RAM_STICK,
  SSD_BOARD,
} from "../constants/sceneLayout";
import { pcbTexture, type SilkLabel } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Box, Cyl, RoundBox } from "./primitives";

/**
 * ATX motherboard, static parts only. RAM latches, the M.2 card and its
 * screw are separate interactive objects placed with the same layout constants.
 * Board-local frame: origin at the board centre, y = 0 on the top surface.
 */
export function Motherboard() {
  const L = BOARD_SIZE.length;
  const W = BOARD_SIZE.width;

  const labels = useMemo<SilkLabel[]>(
    () => [
      ...RAM_SLOT_IDS.map((id) => ({ text: `DDR5_${id}`, x: 0.4, z: RAM_SLOT_LOCAL_Z[id] + 0.05, size: 11 })),
      { text: "CPU_SOCKET", x: CPU_SOCKET_LOCAL.x - 2.2, z: CPU_SOCKET_LOCAL.z + 3.6, size: 13 },
      { text: "M2_1", x: M2_CONNECTOR_LOCAL.x - 1.95, z: M2_CONNECTOR_LOCAL.z + 1.2, size: 13, rotate: Math.PI / 2 },
      { text: "2242", x: M2_CONNECTOR_LOCAL.x + 1.3, z: M2_CONNECTOR_LOCAL.z + 4.4, size: 10 },
      { text: "2260", x: M2_CONNECTOR_LOCAL.x + 1.3, z: M2_CONNECTOR_LOCAL.z + 6.4, size: 10 },
      { text: "2280", x: M2_CONNECTOR_LOCAL.x + 1.3, z: M2_CONNECTOR_LOCAL.z + 8.4, size: 10 },
      { text: "PCIEX16_1", x: PCIE_X16_LOCAL.x - 1.9, z: -1.2, size: 12 },
      { text: "ATX_PWR", x: 5.2, z: 10.3, size: 12 },
      { text: "CPU_PWR", x: 11.4, z: -11.2, size: 11 },
      { text: "F_PANEL", x: -14.9, z: 7.4, size: 11 },
      { text: "SATA", x: -10.6, z: 10.6, size: 11 },
      { text: "CPU_FAN", x: 13.2, z: 5.2, size: 10 },
      { text: "BIOS_BAT", x: -4.6, z: 2.3, size: 10 },
      { text: "BOARD ATX DEMO", x: -12.5, z: -3.5, size: 16 },
    ],
    [],
  );

  const pcbTop = useMemo(() => new MeshStandardMaterial({ map: pcbTexture(L, W, labels), roughness: 0.62, metalness: 0.08 }), [L, W, labels]);
  const pcbMaterials = useMemo(
    () => [MATERIALS.pcbEdge, MATERIALS.pcbEdge, pcbTop, MATERIALS.pcbEdge, MATERIALS.pcbEdge, MATERIALS.pcbEdge],
    [pcbTop],
  );

  return (
    <group position={BOARD_ORIGIN}>
      <mesh position={[0, -BOARD_THICKNESS / 2, 0]} material={pcbMaterials}>
        <boxGeometry args={[L, BOARD_THICKNESS, W]} />
      </mesh>

      {/* Mounting hole pads */}
      {MOUNTING_HOLES_LOCAL.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.003, z]} rotation={[-Math.PI / 2, 0, 0]} material={MATERIALS.steelBright}>
          <ringGeometry args={[0.17, 0.42, 20]} />
        </mesh>
      ))}

      <CpuSocket />
      <PowerDelivery />
      <RamSlotBodies />

      {/* 24-pin ATX power, vertical */}
      <group position={[7.75, 0, 11.35]}>
        <Box size={[5.4, 1.2, 1.3]} position={[0, 0.6, 0]} material={MATERIALS.connectorWhite} />
        {Array.from({ length: 24 }, (_, i) => (
          <Box key={i} size={[0.32, 0.02, 0.38]} position={[-2.35 + (i % 12) * 0.42, 1.205, i < 12 ? -0.24 : 0.24]} material={MATERIALS.chip} />
        ))}
      </group>

      {/* PCIe slots: reinforced x16, an x1, and a second x16 (x4 electrical) */}
      <PcieSlot x={PCIE_X16_LOCAL.x} z={PCIE_X16_LOCAL.z} length={PCIE_X16_LOCAL.length} armored />
      <PcieSlot x={-3.45} z={-9.95} length={2.5} />
      <PcieSlot x={-8.25} z={-6.55} length={8.9} />

      {/* M.2 connector + standoff holes for 2242 / 2260 (2280 standoff is interactive) */}
      <group position={[M2_CONNECTOR_LOCAL.x, 0, M2_CONNECTOR_LOCAL.z]}>
        <Box size={[SSD_BOARD.width + 0.2, 0.55, 0.62]} position={[0, 0.28, 0]} material={MATERIALS.slotBlack} />
        <Box size={[SSD_BOARD.width - 0.1, 0.03, 0.14]} position={[0, 0.56, 0.12]} material={MATERIALS.gold} />
        {[4.25, 6.25].map((dz) => (
          <mesh key={dz} position={[0, 0.003, 0.3 + dz]} rotation={[-Math.PI / 2, 0, 0]} material={MATERIALS.steelBright}>
            <ringGeometry args={[0.12, 0.3, 16]} />
          </mesh>
        ))}
      </group>

      {/* Chipset heatsink */}
      <group position={[-7, 0, 4.6]}>
        <RoundBox size={[4.8, 0.9, 4.8]} position={[0, 0.45, 0]} material={MATERIALS.heatsink} radius={0.18} />
        {[-1.4, -0.7, 0, 0.7, 1.4].map((dx) => (
          <Box key={dx} size={[0.12, 0.05, 3.8]} position={[dx, 0.92, 0]} material={MATERIALS.heatsinkAccent} />
        ))}
      </group>

      {/* SATA ports on the board edge */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[-10.4 + i * 1.15, 0, 11.65]}>
          <Box size={[0.95, 0.6, 1.1]} position={[0, 0.3, 0]} material={MATERIALS.slotBlack} />
          <Box size={[0.55, 0.14, 0.05]} position={[0, 0.34, 0.56]} material={MATERIALS.chipMarking} />
        </group>
      ))}

      {/* Front panel header (2x5, one pin keyed out) and USB 2.0 header */}
      <PinHeader x={-14.45} z={8.6} rows={5} missing={9} />
      <PinHeader x={-12.3} z={9.6} rows={5} missing={9} />
      {/* USB 3.x header */}
      <Box size={[1.95, 0.85, 0.95]} position={[-5.2, 0.43, 11.6]} material={MATERIALS.slotBlack} />
      {/* Fan headers */}
      <Box size={[0.95, 0.55, 0.42]} position={[13.9, 0.28, 6]} material={MATERIALS.connectorWhite} />
      <Box size={[0.95, 0.55, 0.42]} position={[-13.6, 0.28, 2.5]} material={MATERIALS.connectorWhite} />

      {/* CMOS battery (CR2032) */}
      <Cyl radius={1.0} height={0.32} position={[-3.6, 0.17, 1.1]} material={MATERIALS.steelBright} segments={32} />
      <Cyl radius={0.85} height={0.02} position={[-3.6, 0.34, 1.1]} material={MATERIALS.capacitor} segments={32} />

      {/* Audio codec corner */}
      <Box size={[0.8, 0.12, 0.8]} position={[-12.2, 0.06, -9.9]} material={MATERIALS.chip} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Cyl key={i} radius={0.28} height={0.7} position={[-13.8 + (i % 3) * 0.7, 0.35, -11.1 + Math.floor(i / 3) * 0.7]} material={MATERIALS.gold} />
      ))}
    </group>
  );
}

function CpuSocket() {
  const { x, z } = CPU_SOCKET_LOCAL;
  return (
    <group position={[x, 0, z]}>
      {/* Socket body and backplate stand-ins */}
      <Box size={[5.2, 0.22, 6.0]} position={[0, 0.11, 0]} material={MATERIALS.slotBlack} />
      {/* Load plate: steel frame around the CPU */}
      <Box size={[4.6, 0.1, 0.5]} position={[0, 0.27, 2.55]} material={MATERIALS.steelBright} />
      <Box size={[4.6, 0.1, 0.5]} position={[0, 0.27, -2.55]} material={MATERIALS.steelBright} />
      <Box size={[0.42, 0.1, 4.6]} position={[2.09, 0.27, 0]} material={MATERIALS.steelBright} />
      <Box size={[0.42, 0.1, 4.6]} position={[-2.09, 0.27, 0]} material={MATERIALS.steelBright} />
      {/* CPU: integrated heat spreader with the orientation triangle */}
      <RoundBox size={[3.75, 0.32, 4.5]} position={[0, 0.33, 0]} material={MATERIALS.aluminium} radius={0.12} />
      <RoundBox size={[3.1, 0.06, 3.7]} position={[0, 0.5, 0]} material={MATERIALS.aluminium} radius={0.02} />
      <mesh position={[-1.55, 0.53, -1.9]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} material={MATERIALS.gold}>
        <circleGeometry args={[0.2, 3]} />
      </mesh>
      {/* Retention screws and lever */}
      {[
        [2.3, 2.75],
        [-2.3, 2.75],
        [2.3, -2.75],
        [-2.3, -2.75],
      ].map(([sx, sz]) => (
        <Cyl key={`${sx}${sz}`} radius={0.18} height={0.18} position={[sx as number, 0.32, sz as number]} material={MATERIALS.chrome} />
      ))}
      <Cyl radius={0.055} height={5.6} rotation={[Math.PI / 2, 0, 0]} position={[-2.75, 0.3, 0]} material={MATERIALS.chrome} />
      <Cyl radius={0.055} height={0.9} rotation={[0, 0, Math.PI / 2]} position={[-2.35, 0.3, 2.75]} material={MATERIALS.chrome} />
    </group>
  );
}

function PowerDelivery() {
  return (
    <group>
      {/* Heatsink along the top edge */}
      <group position={[13.25, 0, -4.35]}>
        <RoundBox size={[1.9, 0.5, 9.7]} position={[0, 0.25, 0]} material={MATERIALS.heatsink} radius={0.08} />
        {Array.from({ length: 9 }, (_, i) => (
          <Box key={i} size={[1.9, 1.1, 0.42]} position={[0, 0.95, -4.3 + i * 1.07]} material={MATERIALS.heatsink} />
        ))}
        <Box size={[0.08, 0.06, 9.4]} position={[-0.95, 1.52, 0]} material={MATERIALS.heatsinkAccent} />
      </group>
      {/* Heatsink along the rear (I/O) edge */}
      <group position={[9.3, 0, -8.6]}>
        <RoundBox size={[6.2, 0.5, 1.9]} position={[0, 0.25, 0]} material={MATERIALS.heatsink} radius={0.08} />
        {Array.from({ length: 6 }, (_, i) => (
          <Box key={i} size={[0.42, 1.1, 1.9]} position={[-2.7 + i * 1.08, 0.95, 0]} material={MATERIALS.heatsink} />
        ))}
      </group>
      {/* Chokes and solid capacitors on the socket side of the heatsinks */}
      {Array.from({ length: 7 }, (_, i) => (
        <Box key={`ch${i}`} size={[0.7, 0.6, 0.7]} position={[11.85, 0.3, -7.6 + i * 1.0]} material={MATERIALS.choke} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={`cap${i}`} position={[6.6 + i * 0.85, 0, 0.15]}>
          <Cyl radius={0.3} height={0.85} position={[0, 0.43, 0]} material={MATERIALS.capacitor} />
          <Cyl radius={0.31} height={0.02} position={[0, 0.86, 0]} material={MATERIALS.capacitorTop} />
        </group>
      ))}
      {/* I/O cover shroud */}
      <RoundBox size={[9.5, 3.2, 2.4]} position={[7.75, 1.6, -11]} material={MATERIALS.slotBlack} radius={0.2} />
      <Box size={[8.6, 0.06, 0.1]} position={[7.75, 3.2, -9.82]} material={MATERIALS.heatsinkAccent} />
      {/* 8-pin EPS CPU power */}
      <group position={[13.4, 0, -10.9]}>
        <Box size={[1.0, 0.95, 2.1]} position={[0, 0.48, 0]} material={MATERIALS.slotBlack} />
        {Array.from({ length: 8 }, (_, i) => (
          <Box key={i} size={[0.36, 0.02, 0.36]} position={[i < 4 ? -0.21 : 0.21, 0.96, -0.66 + (i % 4) * 0.44]} material={MATERIALS.chip} />
        ))}
      </group>
    </group>
  );
}

function RamSlotBodies() {
  const keyX = RAM_STICK.notchOffset;
  return (
    <group>
      {RAM_SLOT_IDS.map((id, i) => {
        const z = RAM_SLOT_LOCAL_Z[id];
        const body = i % 2 === 0 ? MATERIALS.slotGrey : MATERIALS.slotBlack;
        const bodyLen = RAM_SLOT.length - 0.9;
        return (
          <group key={id} position={[RAM_SLOT.localX - 0.45, 0, z]}>
            <Box size={[bodyLen, RAM_SLOT.height, RAM_SLOT.width]} position={[0, RAM_SLOT.height / 2, 0]} material={body} />
            <Box size={[bodyLen - 0.4, 0.02, 0.16]} position={[0, RAM_SLOT.height + 0.005, 0]} material={MATERIALS.chip} />
            {/* The key ridge the DIMM notch must line up with */}
            <Box size={[0.18, 0.08, 0.15]} position={[keyX + 0.45, RAM_SLOT.height + 0.02, 0]} material={MATERIALS.latch} />
            {/* Fixed end stop */}
            <Box size={[0.5, 1.15, RAM_SLOT.width]} position={[-bodyLen / 2 - 0.2, 0.58, 0]} material={body} />
          </group>
        );
      })}
    </group>
  );
}

function PcieSlot({ x, z, length, armored = false }: { x: number; z: number; length: number; armored?: boolean }) {
  return (
    <group position={[x, 0, z]}>
      <Box size={[0.75, 1.05, length]} position={[0, 0.53, 0]} material={MATERIALS.slotBlack} />
      <Box size={[0.2, 0.02, length - 0.3]} position={[0, 1.06, 0]} material={MATERIALS.chip} />
      {armored ? (
        <>
          <Box size={[0.82, 0.75, length - 0.2]} position={[0, 0.5, 0]} material={MATERIALS.aluminium} />
          <Box size={[0.75, 1.3, 0.6]} position={[0, 0.65, length / 2 + 0.2]} material={MATERIALS.latch} />
        </>
      ) : null}
    </group>
  );
}

function PinHeader({ x, z, rows, missing }: { x: number; z: number; rows: number; missing?: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box size={[0.55, 0.25, rows * 0.254 + 0.1]} position={[0, 0.125, 0]} material={MATERIALS.slotBlack} />
      {Array.from({ length: rows * 2 }, (_, i) =>
        i === missing ? null : (
          <Box key={i} size={[0.064, 0.6, 0.064]} position={[i < rows ? -0.127 : 0.127, 0.45, -((rows - 1) * 0.254) / 2 + (i % rows) * 0.254]} material={MATERIALS.pin} />
        ),
      )}
    </group>
  );
}

