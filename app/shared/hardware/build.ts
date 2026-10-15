import { getPart } from "./catalog";
import type { Build, ResolvedBuild } from "./types";

export const EMPTY_BUILD: Build = {
  caseId: null,
  boardId: null,
  cpuId: null,
  coolerId: null,
  ramId: null,
  gpuId: null,
  storageIds: [],
  psuId: null,
  fanId: null,
  fanCount: 0,
};

/** Ready-made, fully compatible builds for "try it now". */
export const PRESET_BUILDS: Array<{ id: string; label: string; build: Build }> = [
  {
    id: "gaming",
    label: "Contoh gaming (ATX, LGA1700)",
    build: {
      caseId: "case-mid-atx",
      boardId: "board-atx-1700",
      cpuId: "cpu-lga1700",
      coolerId: "cooler-tower-120",
      ramId: "ram-ddr5-2x16",
      gpuId: "gpu-8pin",
      storageIds: ["ssd-m2-nvme", "hdd-35"],
      psuId: "psu-atx-850",
      fanId: "fan-120-pwm",
      fanCount: 2,
    },
  },
  {
    id: "office",
    label: "Contoh kantor (mATX, AM4)",
    build: {
      caseId: "case-mini-matx",
      boardId: "board-matx-am4",
      cpuId: "cpu-am4-f",
      coolerId: "cooler-stock-amd",
      ramId: "ram-ddr4-2x8",
      gpuId: "gpu-slot-power",
      storageIds: ["ssd-sata-25"],
      psuId: "psu-atx-550",
      fanId: "fan-120-dc",
      fanCount: 1,
    },
  },
];

const STORAGE_KEY = "rakit-pc:build:v2";

export function saveBuild(build: Build): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(build));
  } catch {
    // Private mode or blocked storage: the build simply isn't remembered.
  }
}

export function loadBuild(): Build | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const b = JSON.parse(raw) as Partial<Build>;
    return { ...EMPTY_BUILD, ...b, storageIds: Array.isArray(b.storageIds) ? b.storageIds : [] };
  } catch {
    return null;
  }
}

/** Resolve ids to specs. Returns null when a required part is missing. */
export function resolveBuild(build: Build): ResolvedBuild | null {
  const c = getPart("case", build.caseId);
  const board = getPart("board", build.boardId);
  const cpu = getPart("cpu", build.cpuId);
  const cooler = getPart("cooler", build.coolerId);
  const ram = getPart("ram", build.ramId);
  const psu = getPart("psu", build.psuId);
  const storage = build.storageIds.map((id) => getPart("storage", id)).filter((s): s is NonNullable<typeof s> => !!s);
  if (!c || !board || !cpu || !cooler || !ram || !psu || storage.length === 0) return null;
  const fan = getPart("fan", build.fanId);
  return {
    case: c,
    board,
    cpu,
    cooler,
    ram,
    gpu: getPart("gpu", build.gpuId),
    storage,
    psu,
    fan,
    fanCount: fan ? build.fanCount : 0,
  };
}

export function buildPrice(build: Build): number {
  const parts = [
    getPart("case", build.caseId),
    getPart("board", build.boardId),
    getPart("cpu", build.cpuId),
    getPart("cooler", build.coolerId),
    getPart("ram", build.ramId),
    getPart("gpu", build.gpuId),
    getPart("psu", build.psuId),
    ...build.storageIds.map((id) => getPart("storage", id)),
  ];
  const fan = getPart("fan", build.fanId);
  return parts.reduce((sum, p) => sum + (p?.price ?? 0), 0) + (fan ? fan.price * build.fanCount : 0);
}
