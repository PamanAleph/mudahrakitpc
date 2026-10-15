import { HARDWARE } from "../services/hardwareSpec";
import type { PanelScrewId, SlotId } from "../types/assemblyTypes";

/**
 * World layout of the workbench, in centimetres (1 unit = 1 cm).
 * The case lies on its right side on an anti-static mat:
 *   x+ = top of the tower, z- = rear (I/O side), y+ = up from the desk.
 * Real dimensions come from data/*.json; positions of on-board features
 * are layout choices (visual layer) unless a data entry says otherwise.
 */
type Vec3 = [number, number, number];

const mmToCm = (mm: number) => mm / 10;

export const MAT_THICKNESS = 0.25;
export const CASE_Y = MAT_THICKNESS;
export const CASE = {
  length: HARDWARE.case.dimensionsCm.length,
  depth: HARDWARE.case.dimensionsCm.depth,
  height: HARDWARE.case.dimensionsCm.width,
  wall: 0.12,
  bezelDepth: 2.4,
} as const;

export const TRAY_TOP = CASE_Y + CASE.wall;
export const STANDOFF_HEIGHT = 0.65;
export const BOARD_THICKNESS = 0.16;
export const BOARD_BOTTOM = TRAY_TOP + STANDOFF_HEIGHT;
export const BOARD_TOP = BOARD_BOTTOM + BOARD_THICKNESS;
export const BOARD_SIZE = { length: HARDWARE.motherboard.sizeCm.length, width: HARDWARE.motherboard.sizeCm.width };
/** World position of the board centre (top surface). Board-local coords add to this. */
export const BOARD_ORIGIN: Vec3 = [1.25, BOARD_TOP, -8.3];

export function boardToWorld(x: number, y: number, z: number): Vec3 {
  return [BOARD_ORIGIN[0] + x, BOARD_ORIGIN[1] + y, BOARD_ORIGIN[2] + z];
}

/* ---------- RAM ---------- */
export const RAM_STICK = {
  length: mmToCm(HARDWARE.ram.sizeMm.length),
  height: mmToCm(HARDWARE.ram.sizeMm.height),
  thickness: 0.12,
  notchOffset: mmToCm(HARDWARE.ram.notchOffsetMm),
} as const;
export const RAM_SLOT = { length: 14.2, height: 0.75, width: 0.62, localX: 7.75 } as const;
export const RAM_SLOT_LOCAL_Z: Record<SlotId, number> = { A1: 1.7, A2: 2.6, B1: 3.5, B2: 4.4 };
export const RAM_SLOT_IDS: SlotId[] = ["A1", "A2", "B1", "B2"];
export function ramSlotWorld(slot: SlotId): Vec3 {
  return boardToWorld(RAM_SLOT.localX, 0, RAM_SLOT_LOCAL_Z[slot]);
}
export const RAM_SEAT_Y = BOARD_TOP + 0.22;
export const RAM_INSERTED_Y = RAM_SEAT_Y + 0.45;
export const RAM_HOVER_Y = BOARD_TOP + RAM_SLOT.height + 1.4;
export const RAM_CARRY_Y = BOARD_TOP + 4.5;

/* ---------- M.2 ---------- */
export const SSD_BOARD = {
  width: mmToCm(HARDWARE.ssd.sizeMm.width),
  length: mmToCm(HARDWARE.ssd.sizeMm.length),
  thickness: 0.15,
  tilt: -(HARDWARE.ssd.insertAngleDeg * Math.PI) / 180,
} as const;
export const M2_CONNECTOR_LOCAL = { x: 4.25, z: -8.7 } as const;
export const STANDOFF_TOP = BOARD_TOP + 0.3;
/** SSD origin = middle of its gold-finger edge when inserted. */
export const SSD_INSTALLED: Vec3 = boardToWorld(M2_CONNECTOR_LOCAL.x, 0.3, M2_CONNECTOR_LOCAL.z + 0.3);
export const M2_STANDOFF: Vec3 = [SSD_INSTALLED[0], BOARD_TOP, SSD_INSTALLED[2] + SSD_BOARD.length - 0.15];
export const M2_SCREW_SEATED_Y = STANDOFF_TOP + SSD_BOARD.thickness;

/* ---------- Side panel ---------- */
export const PANEL_Y = CASE_Y + CASE.height;
export const PANEL_THICKNESS = 0.4;
export const PANEL_SCREW_LOCAL: Record<PanelScrewId, Vec3> = {
  tr: [21.4, PANEL_THICKNESS, -20.6],
  tl: [-21.4, PANEL_THICKNESS, -20.6],
  br: [21.4, PANEL_THICKNESS, 20.6],
  bl: [-21.4, PANEL_THICKNESS, 20.6],
};
export const PANEL_SCREW_IDS: PanelScrewId[] = ["tr", "tl", "br", "bl"];
/** Where the glass panel rests on the desk after removal. */
export const PANEL_REST: { position: Vec3; rotation: Vec3 } = { position: [-62, 0.02, 2], rotation: [0, 0.18, 0] };

/* ---------- Desk props ---------- */
export const MAT = { width: 98, depth: 70, center: [0, 0, 5] as Vec3 };
export const PARTS_TRAY = { center: [31, MAT_THICKNESS, 30] as Vec3, size: [24, 1.4, 10] as Vec3 };
export const RAM_TRAY_POSE: { position: Vec3; rotation: Vec3 } = {
  position: [26.5, MAT_THICKNESS + 0.45, 33.2],
  rotation: [-Math.PI / 2, 0, 0],
};
export const SSD_TRAY_POSE: { position: Vec3; rotation: Vec3 } = {
  position: [38.8, MAT_THICKNESS + 0.32, 26],
  rotation: [0, 0, 0],
};
export const BOWL: Vec3 = [12, MAT_THICKNESS, 31.5];
export const M2_SCREW_BOWL: Vec3 = [11.4, MAT_THICKNESS + 0.42, 31.1];
export const SCREWDRIVER_REST: { position: Vec3; rotation: Vec3 } = {
  position: [-27, MAT_THICKNESS + 1.0, 31],
  rotation: [0, 0.35, Math.PI / 2],
};

/* ---------- Board features (board-local x, z in cm) ---------- */
/** Approximate ATX mounting-hole positions. [BELUM DIKONFIRMASI] until checked against the ATX drawing. */
export const MOUNTING_HOLES_LOCAL: Array<[number, number]> = [
  [14.75, 11.3],
  [14.75, -0.2],
  [14.75, -11.6],
  [1.2, -11.6],
  [1.2, -0.2],
  [1.2, 11.3],
  [-13.9, -11.6],
  [-13.9, -0.2],
  [-13.9, 11.3],
];
export const CPU_SOCKET_LOCAL = { x: 8.75, z: -3.7 } as const;
export const PCIE_X16_LOCAL = { x: -0.75, z: -6.55, length: 8.9 } as const;
