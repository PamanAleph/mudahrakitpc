import { BOARD_TEMPLATES, holeKey, type CaseGeometry } from "../constants/layouts";
import type { AssemblySnapshot, CableSpec, EndId, RuleResult } from "../types/assemblyTypes";
import type { PortDef } from "./ports";

export const isMounted = (s: AssemblySnapshot, id: string) => s.parts[id]?.location === "mounted";
export const boardInCase = (s: AssemblySnapshot) => s.parts.board?.mount === "case-board";
export const panelOff = (s: AssemblySnapshot) => s.parts.panel?.location !== "mounted";

export function matchesPort(pattern: string, portId: string): boolean {
  return pattern.endsWith("*") ? portId.startsWith(pattern.slice(0, -1)) : pattern === portId;
}

export function portOccupant(s: AssemblySnapshot, portId: string): { cableId: string; end: EndId } | null {
  for (const [cableId, c] of Object.entries(s.cables)) {
    for (const end of ["a", "b"] as const) {
      if (c.ends[end].state === "plugged" && c.ends[end].portId === portId) return { cableId, end };
    }
  }
  return null;
}

export function portAvailable(s: AssemblySnapshot, port: PortDef): RuleResult {
  if (port.owner === "board") {
    if (!boardInCase(s)) return { ok: false, key: "cable.portUnavailable", params: { reason: "Board masih di luar casing. Kabel dipasang setelah board terpasang di casing." } };
    return { ok: true };
  }
  if (!isMounted(s, port.owner)) {
    return { ok: false, key: "cable.portUnavailable", params: { reason: "Komponennya belum terpasang di casing." } };
  }
  return { ok: true };
}

export function cableAvailable(s: AssemblySnapshot, spec: CableSpec): RuleResult {
  if (spec.availableWhen && !isMounted(s, spec.availableWhen)) {
    const what = spec.availableWhen === "psu" ? "PSU" : spec.availableWhen === "cooler" ? "cooler" : "kipas";
    return { ok: false, key: "cable.notYet", params: { reason: `Kabel ini ikut ${what}. Pasang ${what} dulu.` } };
  }
  return { ok: true };
}

export function cableSatisfied(s: AssemblySnapshot, spec: CableSpec): boolean {
  const st = s.cables[spec.id];
  if (!st) return false;
  return spec.targets.every((t) => {
    const e = st.ends[t.end];
    return e.state === "plugged" && !!e.portId && matchesPort(t.portId, e.portId);
  });
}

export function standoffDiff(s: AssemblySnapshot, geometry: CaseGeometry): { missing: string[]; extra: string[] } {
  const required = new Set(BOARD_TEMPLATES[s.build.board.formFactor].holes.map((h) => holeKey(h.u, h.v)));
  const missing = [...required].filter((k) => !s.standoffs[k]);
  const extra = geometry.holes.map((h) => h.key).filter((k) => s.standoffs[k] && !required.has(k));
  return { missing, extra };
}

export function requiredCovers(s: AssemblySnapshot): number[] {
  return s.build.gpu ? Array.from({ length: s.build.gpu.slots }, (_, i) => i) : [];
}

export function recommendedRamSlots(s: AssemblySnapshot): string[] {
  const map = s.build.board.recommendedRamSlots;
  return map[String(s.build.ram.sticks)] ?? s.build.board.ramSlots.slice(0, s.build.ram.sticks).map((r) => r.id);
}

/** SATA ports switched off because an M.2 slot that shares lanes is occupied. */
export function disabledSataPorts(s: AssemblySnapshot): string[] {
  const out: string[] = [];
  for (const slot of s.build.board.m2Slots) {
    const used = Object.values(s.parts).some((p) => p.location === "mounted" && p.mount === `m2:${slot.id}`);
    if (used) out.push(...slot.disablesSata);
  }
  return out;
}

export function sataPortName(s: AssemblySnapshot, portId: string): string {
  const i = Number(portId.split("-").pop());
  return s.build.board.sataPorts[i] ?? portId;
}

/** Will the firmware see this drive? */
export function driveDetected(s: AssemblySnapshot, index: number): { ok: boolean; reason: string } {
  const spec = s.build.storage[index];
  const id = `drive-${index}`;
  const p = s.parts[id];
  if (!spec || !p || p.location !== "mounted") return { ok: false, reason: "Drive belum terpasang." };
  if (spec.kind === "m2") return p.stage === "flat" || p.fastened >= 1 ? { ok: true, reason: "" } : { ok: false, reason: "SSD M.2 belum ditekan rata." };
  const data = s.cables[`satad-${index}`];
  const power = s.cables[`satap-${index}`];
  const dataOk = data && ["a", "b"].every((e) => data.ends[e as EndId].state === "plugged");
  const dataPort = data ? [data.ends.a.portId, data.ends.b.portId].find((x) => x?.startsWith("board:sata-")) : null;
  const driveSide = data ? [data.ends.a.portId, data.ends.b.portId].includes(`${id}:data`) : false;
  if (!dataOk || !dataPort || !driveSide) return { ok: false, reason: "Kabel SATA data belum menghubungkan drive dan board." };
  if (!power || power.ends.b.state !== "plugged" || power.ends.b.portId !== `${id}:power`) return { ok: false, reason: "Kabel SATA power belum tercolok." };
  if (disabledSataPorts(s).includes(sataPortName(s, dataPort))) return { ok: false, reason: `Port ${sataPortName(s, dataPort)} mati karena berbagi jalur dengan slot M.2.` };
  return { ok: true, reason: "" };
}
