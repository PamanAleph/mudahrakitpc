import type { BoardSpec, CaseSpec, FormFactor } from "@shared/hardware";

/**
 * Geometry of the bench (visual layer), in centimetres. 1 unit = 1 cm.
 * World frame: the case lies on its right side on the mat at the origin.
 *   x+ = top of the tower, z− = rear (I/O side), y+ = up from the desk.
 * Board-local frame: origin at the board's top-rear corner on its top surface;
 *   u = cm down from the top edge (world −x), v = cm forward from the rear edge (world +z).
 * Positions of on-board features are layout choices [BELUM DIKONFIRMASI] until
 * checked against a reference board manual; sizes that are standards come from data.
 */

type UV = { u: number; v: number };

export const MAT_T = 0.25;
export const WALL = 0.12;
export const STANDOFF_H = 0.65;
export const BOARD_T = 0.16;
export const TRAY_TOP = MAT_T + WALL;
export const BOARD_TOP_IN_CASE = TRAY_TOP + STANDOFF_H + BOARD_T;
export const SLOT_PITCH = 2.032; // expansion slot pitch (0.8 in), [BELUM DIKONFIRMASI] against the ATX spec
export const BEZEL = 2.4;

/** Board sizes from data: Wikipedia, Motherboard form factor. */
export const BOARD_SIZE: Record<FormFactor, { length: number; width: number }> = {
  ATX: { length: 30.5, width: 24.4 },
  "Micro-ATX": { length: 24.4, width: 24.4 },
  "Mini-ITX": { length: 17, width: 17 },
};

export const RAM_SLOT_LEN = 14.2;

export interface BoardTemplate {
  socket: UV;
  ram: UV[];
  atx24: UV;
  eps: UV[];
  cpuFan: UV;
  sysFans: UV[];
  pcie: Array<UV & { len: number }>;
  m2: UV[];
  sata: UV[];
  frontPanel: UV;
  usb2: UV | null;
  usb3: UV;
  usbc: UV | null;
  audio: UV;
  chipset: UV | null;
  battery: UV | null;
  debugLeds: UV;
  ioShroud: { u0: number; u1: number; v0: number; v1: number };
  vrmTop: { u0: number; u1: number; v0: number; v1: number };
  vrmSide: { u0: number; u1: number; v0: number; v1: number };
  holes: Array<{ id: string } & UV>;
}

const grid = (ff: string, us: number[], vs: number[]) =>
  us.flatMap((u) => vs.map((v) => ({ id: `${ff}:${u}:${v}`, u, v })));

export const BOARD_TEMPLATES: Record<FormFactor, BoardTemplate> = {
  ATX: {
    socket: { u: 6.5, v: 8.5 },
    ram: [
      { u: 7.5, v: 13.9 },
      { u: 7.5, v: 14.8 },
      { u: 7.5, v: 15.7 },
      { u: 7.5, v: 16.6 },
    ],
    atx24: { u: 7.5, v: 23.55 },
    eps: [
      { u: 1.85, v: 1.3 },
      { u: 1.85, v: 3.7 },
    ],
    cpuFan: { u: 1.35, v: 11.4 },
    sysFans: [
      { u: 1.35, v: 18.2 },
      { u: 29.7, v: 15 },
      { u: 29.7, v: 12 },
    ],
    pcie: [
      { u: 16, v: 5.65, len: 8.9 },
      { u: 18.7, v: 2.25, len: 2.5 },
      { u: 23.5, v: 5.65, len: 8.9 },
    ],
    m2: [
      { u: 11, v: 3.5 },
      { u: 20.6, v: 3.5 },
    ],
    sata: [
      { u: 25.6, v: 23.85 },
      { u: 24.45, v: 23.85 },
      { u: 23.3, v: 23.85 },
      { u: 22.15, v: 23.85 },
    ],
    frontPanel: { u: 29.7, v: 20.8 },
    usb2: { u: 27.4, v: 21.8 },
    usb3: { u: 19.4, v: 23.75 },
    usbc: { u: 16.6, v: 23.6 },
    audio: { u: 29.7, v: 3.0 },
    chipset: { u: 22.25, v: 16.8 },
    battery: { u: 18.85, v: 13.3 },
    debugLeds: { u: 11.6, v: 21.9 },
    ioShroud: { u0: 3, u1: 12.5, v0: 0, v1: 2.4 },
    vrmTop: { u0: 0.95, u1: 2.85, v0: 4.9, v1: 13.2 },
    vrmSide: { u0: 2.95, u1: 9.15, v0: 2.6, v1: 4.5 },
    holes: grid("atx", [0.5, 14.05, 29.15], [0.6, 12, 23.5]),
  },
  "Micro-ATX": {
    socket: { u: 6.5, v: 8.5 },
    ram: [
      { u: 7.5, v: 13.9 },
      { u: 7.5, v: 14.8 },
      { u: 7.5, v: 15.7 },
      { u: 7.5, v: 16.6 },
    ],
    atx24: { u: 7.5, v: 23.55 },
    eps: [{ u: 1.85, v: 1.3 }],
    cpuFan: { u: 1.35, v: 11.4 },
    sysFans: [
      { u: 1.35, v: 18.2 },
      { u: 23.6, v: 15 },
    ],
    pcie: [
      { u: 16, v: 5.65, len: 8.9 },
      { u: 18.7, v: 2.25, len: 2.5 },
    ],
    m2: [{ u: 11, v: 3.5 }],
    sata: [
      { u: 21.3, v: 23.85 },
      { u: 20.15, v: 23.85 },
      { u: 19.0, v: 23.85 },
      { u: 17.85, v: 23.85 },
    ],
    frontPanel: { u: 23.6, v: 20.8 },
    usb2: { u: 23.6, v: 17.6 },
    usb3: { u: 13.4, v: 23.75 },
    usbc: null,
    audio: { u: 23.6, v: 3.0 },
    chipset: { u: 20, v: 13.6 },
    battery: { u: 17.6, v: 11.6 },
    debugLeds: { u: 11.6, v: 21.9 },
    ioShroud: { u0: 3, u1: 12.5, v0: 0, v1: 2.4 },
    vrmTop: { u0: 0.95, u1: 2.85, v0: 4.9, v1: 13.2 },
    vrmSide: { u0: 2.95, u1: 9.15, v0: 2.6, v1: 4.5 },
    holes: grid("matx", [0.5, 14.05, 23.9], [0.6, 12, 23.5]),
  },
  "Mini-ITX": {
    socket: { u: 6.5, v: 7.6 },
    ram: [
      { u: 7.5, v: 13.4 },
      { u: 7.5, v: 14.4 },
    ],
    atx24: { u: 7.5, v: 16.3 },
    eps: [{ u: 1.85, v: 1.3 }],
    cpuFan: { u: 1.35, v: 11 },
    sysFans: [{ u: 16.4, v: 10.5 }],
    pcie: [{ u: 15, v: 5.65, len: 8.9 }],
    m2: [{ u: 11, v: 3.0 }],
    sata: [
      { u: 12.0, v: 16.3 },
      { u: 10.85, v: 16.3 },
    ],
    frontPanel: { u: 15.6, v: 15.8 },
    usb2: null,
    usb3: { u: 16.0, v: 11.8 },
    usbc: { u: 16.0, v: 13.4 },
    audio: { u: 16.2, v: 0.8 },
    chipset: null,
    battery: null,
    debugLeds: { u: 14.2, v: 11.4 },
    ioShroud: { u0: 3, u1: 12.5, v0: 0, v1: 2.4 },
    vrmTop: { u0: 0.95, u1: 2.85, v0: 3.3, v1: 10 },
    vrmSide: { u0: 2.95, u1: 9.15, v0: 2.6, v1: 4.3 },
    holes: [
      { id: "itx:0.5:0.6", u: 0.5, v: 0.6 },
      { id: "itx:0.5:16.4", u: 0.5, v: 16.4 },
      { id: "itx:16.4:0.6", u: 16.4, v: 0.6 },
      { id: "itx:16.4:16.4", u: 16.4, v: 16.4 },
    ],
  },
};

/** Board-local (u, v, height) → board group local position. */
export const uv = (p: UV, y = 0): [number, number, number] => [-p.u, y, p.v];

/** Holes that land at the same physical spot across form factors share one case position. */
export function holeKey(u: number, v: number): string {
  return `${u.toFixed(2)}:${v.toFixed(2)}`;
}

export interface CaseGeometry {
  L: number;
  D: number;
  H: number;
  anchor: { x: number; z: number };
  psu: { size: [number, number, number]; center: [number, number, number] };
  shroud: { x1: number; zEnd: number; height: number };
  /** Union of standoff holes for every form factor the case accepts, in case-local x/z. */
  holes: Array<{ key: string; x: number; z: number; formFactors: FormFactor[] }>;
  /** Standoffs the case ships with. */
  preinstalled: string[];
  frontCableExit: [number, number, number];
  slotCoverX: (index: number, firstSlotU: number) => number;
}

/** PSU outer sizes from data (Wikipedia, PSU form factors): width × height × depth in cm. */
const PSU_SIZE = { ATX: [15, 8.6, 14], SFX: [12.5, 6.35, 10] } as const;

export function caseGeometry(spec: CaseSpec): CaseGeometry {
  const { length: L, depth: D, width: H } = spec.dimensionsCm;
  const [pw, ph, pd] = PSU_SIZE[spec.psuFormFactor];
  // Lying on its side: PSU height runs along x, width along y, depth along z.
  const psuCenter: [number, number, number] = [-L / 2 + WALL + ph / 2 + 0.1, TRAY_TOP + pw / 2 + 0.2, -D / 2 + WALL + pd / 2];
  const map = new Map<string, { key: string; x: number; z: number; formFactors: FormFactor[] }>();
  for (const ff of spec.formFactors) {
    for (const h of BOARD_TEMPLATES[ff].holes) {
      const key = holeKey(h.u, h.v);
      const entry = map.get(key) ?? { key, x: spec.boardAnchor.x - h.u, z: spec.boardAnchor.z + h.v, formFactors: [] };
      entry.formFactors.push(ff);
      map.set(key, entry);
    }
  }
  const largest = spec.formFactors[0] ?? "ATX";
  return {
    L,
    D,
    H,
    anchor: spec.boardAnchor,
    psu: { size: [ph, pw, pd], center: psuCenter },
    shroud: { x1: -L / 2 + WALL + ph + 0.6, zEnd: -D / 2 + pd + 2.2, height: pw + 1.2 },
    holes: [...map.values()],
    preinstalled: BOARD_TEMPLATES[largest].holes.map((h) => holeKey(h.u, h.v)),
    frontCableExit: [-L / 2 + WALL + ph + 3, TRAY_TOP + 0.5, D / 2 - 3.5],
    slotCoverX: (i, firstSlotU) => spec.boardAnchor.x - firstSlotU - i * SLOT_PITCH,
  };
}

/* ---------- Desk ---------- */
export const MAT = { width: 156, depth: 104, center: [0, 0, 12] as [number, number, number] };

/** Where the board box (the "bench" for out-of-case work) sits. */
export function benchCenter(caseL: number): [number, number, number] {
  return [-caseL / 2 - 30, MAT_T, 4];
}
export const BENCH_BOX = { size: [34, 6, 28] as [number, number, number] };
export const BENCH_TOP = MAT_T + BENCH_BOX.size[1];

/* ---------- Case-mounted parts ---------- */
type Pose = { position: [number, number, number]; rotation: [number, number, number] };
const FAN_HALF_DEPTH = 1.25;

/**
 * Fan mount poses (case-local = world). Mount data u/v: front and rear walls use
 * u = x along the case length and v = height above the mat; the top wall uses
 * u = z along the depth and v = height. Fan-local +z points into the case.
 */
export function fanMountPose(mount: CaseSpec["fanMounts"][number], g: Pick<CaseGeometry, "L" | "D">): Pose {
  const y = MAT_T + mount.v;
  if (mount.side === "front") return { position: [mount.u, y, g.D / 2 - WALL - FAN_HALF_DEPTH - 0.05], rotation: [0, Math.PI, 0] };
  if (mount.side === "rear") return { position: [mount.u, y, -g.D / 2 + WALL + FAN_HALF_DEPTH + 0.05], rotation: [0, 0, 0] };
  return { position: [g.L / 2 - WALL - FAN_HALF_DEPTH - 0.05, y, mount.u], rotation: [0, -Math.PI / 2, 0] };
}

/** Drive bays: 2.5" lie with their length along x (connectors towards the PSU end), 3.5" along z (connectors to the rear). */
export function bayPose(bay: CaseSpec["driveBays"][number]): Pose {
  return { position: [bay.x, TRAY_TOP, bay.z], rotation: bay.kind === "2.5" ? [0, Math.PI / 2, 0] : [0, 0, 0] };
}

/** First expansion slot of the case, in board u, from the largest board it takes. */
export function firstSlotU(spec: CaseSpec): number {
  return BOARD_TEMPLATES[spec.formFactors[0] ?? "ATX"].pcie[0]?.u ?? 16;
}

/** Board-local v of the rear wall's inner face for this case (where a card bracket sits). */
export function bracketV(g: Pick<CaseGeometry, "D" | "anchor">): number {
  return -g.D / 2 + WALL - g.anchor.z;
}

export const powerButtonPoint = (g: Pick<CaseGeometry, "L" | "D" | "H">): [number, number, number] => [g.L / 2 + 0.25, MAT_T + g.H * 0.62, g.D / 2 - 2.6];

/** Where each front-panel cable leaves the case interior. */
export function frontCableAnchor(g: CaseGeometry, id: string): [number, number, number] {
  const [x, y, z] = g.frontCableExit;
  const dx = id === "usb3" ? 0 : id === "usbc" ? 1.6 : id === "audio" ? 3.2 : 4.8;
  return [x + dx, y, z];
}

/* ---------- Board features mapped to the board's spec ---------- */
export interface BoardLayout {
  t: BoardTemplate;
  size: { length: number; width: number };
  ram: Record<string, UV>;
  pcie: Record<string, UV & { len: number }>;
  m2: Record<string, UV>;
  sata: UV[];
  eps: UV[];
  sysFans: UV[];
}

/** Pairs each slot/port id from data with a template position (layout choice, [BELUM DIKONFIRMASI]). */
export function boardLayout(spec: BoardSpec): BoardLayout {
  const t = BOARD_TEMPLATES[spec.formFactor];
  const n = spec.ramSlots.length;
  const ramPos = n === t.ram.length ? t.ram : n === 2 && t.ram.length === 4 ? [t.ram[1]!, t.ram[3]!] : t.ram.slice(0, n);
  const pick = <T,>(list: T[], i: number): T => list[Math.min(i, list.length - 1)]!;
  return {
    t,
    size: BOARD_SIZE[spec.formFactor],
    ram: Object.fromEntries(spec.ramSlots.map((r, i) => [r.id, pick(ramPos, i)])),
    pcie: Object.fromEntries(spec.pcieSlots.map((p, i) => {
      const base = pick(t.pcie, i);
      return [p.id, p.kind === "pcie-x1" ? { ...base, len: 2.5 } : { ...base, len: 8.9 }];
    })),
    m2: Object.fromEntries(spec.m2Slots.map((m, i) => [m.id, pick(t.m2, i)])),
    sata: spec.sataPorts.map((_, i) => pick(t.sata, i)),
    eps: Array.from({ length: spec.headers.eps }, (_, i) => pick(t.eps, i)),
    sysFans: Array.from({ length: spec.headers.sysFan }, (_, i) => pick(t.sysFans, i)),
  };
}
