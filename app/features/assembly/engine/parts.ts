import type { ResolvedBuild } from "@shared/hardware";
import type { PartInstance, PartState } from "../types/assemblyTypes";

/** One physical thing per RAM stick, drive and fan, derived from what was bought. */
export function derivePartInstances(b: ResolvedBuild): PartInstance[] {
  const list: PartInstance[] = [
    { id: "board", kind: "board", specId: b.board.id, label: b.board.name, index: 0 },
    { id: "cpu", kind: "cpu", specId: b.cpu.id, label: b.cpu.name, index: 0 },
    { id: "cooler", kind: "cooler", specId: b.cooler.id, label: b.cooler.name, index: 0 },
  ];
  for (let i = 0; i < b.ram.sticks; i++) {
    list.push({ id: `ram-${i}`, kind: "ram", specId: b.ram.id, label: `${b.ram.type} keping ${i + 1}`, index: i });
  }
  b.storage.forEach((s, i) => {
    list.push({ id: `drive-${i}`, kind: s.kind === "m2" ? "m2" : "drive", specId: s.id, label: s.name, index: i });
  });
  if (b.gpu) list.push({ id: "gpu", kind: "gpu", specId: b.gpu.id, label: b.gpu.name, index: 0 });
  list.push({ id: "psu", kind: "psu", specId: b.psu.id, label: b.psu.name, index: 0 });
  for (let i = 0; i < b.fanCount; i++) {
    list.push({ id: `fan-${i}`, kind: "fan", specId: b.fan?.id ?? null, label: `Kipas ${i + 1}`, index: i });
  }
  list.push({ id: "panel", kind: "panel", specId: null, label: "Panel samping", index: 0 });
  return list;
}

export function initialPartStates(instances: PartInstance[]): Record<string, PartState> {
  const out: Record<string, PartState> = {};
  for (const p of instances) {
    const base: PartState = { location: "tray", mount: null, flips: 0, fastened: 0, stage: null };
    if (p.kind === "board") Object.assign(base, { location: "mounted", mount: "bench" });
    if (p.kind === "panel") Object.assign(base, { location: "mounted", mount: "panel", fastened: 1 });
    // Start rotated on purpose where orientation is the lesson.
    if (p.kind === "cpu" || p.kind === "ram") base.flips = 1;
    out[p.id] = base;
  }
  return out;
}

/** Screws each part takes once mounted: fastener id + count. */
export function fastenersFor(b: ResolvedBuild, p: PartInstance): { screwId: string; count: number } | null {
  switch (p.kind) {
    case "board":
      return { screwId: "board-6-32", count: b.board.formFactor === "Mini-ITX" ? 4 : 9 };
    case "psu":
      return { screwId: "psu-6-32", count: 4 };
    case "gpu":
      return { screwId: "bracket-6-32", count: Math.min(2, b.gpu?.slots ?? 2) };
    case "drive": {
      const s = b.storage[p.index];
      return s?.kind === "3.5" ? { screwId: "hdd-6-32", count: 4 } : { screwId: "ssd-m3", count: 4 };
    }
    case "m2":
      return { screwId: "m2-screw", count: 1 };
    case "fan":
      return { screwId: "fan-screw", count: 4 };
    case "cooler":
      return { screwId: "cooler-screw", count: 4 };
    case "panel":
      return { screwId: b.case.panelScrewId, count: 4 };
    default:
      return null;
  }
}
