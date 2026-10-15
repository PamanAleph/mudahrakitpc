import type { CaseGeometry } from "../constants/layouts";
import { boardInCase, isMounted, panelOff, recommendedRamSlots, requiredCovers, standoffDiff } from "../engine/selectors";
import type { AssemblySnapshot, Mode, PartInstance, RuleResult } from "../types/assemblyTypes";

const OK: RuleResult = { ok: true };

export function mountAccepts(mountId: string): PartInstance["kind"] | null {
  if (mountId === "bench" || mountId === "case-board") return "board";
  if (mountId === "socket") return "cpu";
  if (mountId === "cooler") return "cooler";
  if (mountId === "psu-bay") return "psu";
  if (mountId === "panel") return "panel";
  const [prefix] = mountId.split(":");
  switch (prefix) {
    case "ram":
      return "ram";
    case "m2":
      return "m2";
    case "bay":
      return "drive";
    case "pcie":
      return "gpu";
    case "fan":
      return "fan";
    default:
      return null;
  }
}

const occupied = (s: AssemblySnapshot, mountId: string, except: string) =>
  Object.entries(s.parts).some(([id, p]) => id !== except && p.location === "mounted" && p.mount === mountId);

/**
 * Can this part go on this mount right now? Order matters: the most fundamental
 * problem is reported first. Guided mode is stricter about recommendations.
 */
export function canPlace(s: AssemblySnapshot, part: PartInstance, mountId: string, mode: Mode, geometry: CaseGeometry): RuleResult {
  if (mountAccepts(mountId) !== part.kind) return { ok: false, key: "hands.aim" };
  if (occupied(s, mountId, part.id)) return { ok: false, key: "cable.portBusy" };
  const st = s.parts[part.id];
  const b = s.build;

  switch (part.kind) {
    case "board": {
      if (mountId !== "case-board") return { ok: false, key: "hands.aim" };
      if (!panelOff(s)) return { ok: false, key: "panel.mustBeOff" };
      const d = standoffDiff(s, geometry);
      if (d.extra.length) return { ok: false, key: "board.extraStandoff", params: { n: d.extra.length, ff: b.board.formFactor } };
      if (d.missing.length) return { ok: false, key: "board.missingStandoffs", params: { n: d.missing.length } };
      return OK;
    }
    case "cpu":
      if (s.lever !== "open") return { ok: false, key: "cpu.leverClosed" };
      if ((st?.flips ?? 0) % 2 !== 0) return { ok: false, key: "cpu.triangle" };
      return OK;
    case "cooler":
      if (!isMounted(s, "cpu") || s.lever !== "closed") return { ok: false, key: "cooler.needsCpu" };
      if (!s.plasticPeeled) return { ok: false, key: "cooler.plastic" };
      if (b.cooler.prePasted && s.paste !== "none") return { ok: false, key: "paste.prePasted" };
      if (!b.cooler.prePasted && s.paste === "none") return { ok: false, key: "cooler.needsPaste" };
      if (!b.cooler.prePasted && s.paste !== "pas" && mode === "guided") return { ok: false, key: "cooler.badPaste" };
      return OK;
    case "ram": {
      const slot = mountId.split(":")[1] ?? "";
      if (!s.latches[slot]) return { ok: false, key: "ram.latchClosed", params: { slot } };
      if ((st?.flips ?? 0) % 2 !== 0) return { ok: false, key: "ram.notchMisaligned" };
      if (b.ram.type !== b.board.ramType) return { ok: false, key: "ram.typeMismatch", params: { slotType: b.board.ramType, ramType: b.ram.type } };
      const rec = recommendedRamSlots(s);
      if (mode === "guided" && !rec.includes(slot)) {
        return { ok: false, key: "ram.notRecommended", params: { count: b.ram.sticks, slots: rec.join(", ") } };
      }
      return OK;
    }
    case "m2": {
      const slotId = mountId.split(":")[1] ?? "";
      const slot = b.board.m2Slots.find((x) => x.id === slotId);
      const drive = b.storage[part.index];
      if (!slot || !drive) return { ok: false, key: "hands.aim" };
      if (drive.interface === "sata" && !slot.interfaces.includes("sata")) return { ok: false, key: "m2.slotNoSata", params: { slot: slot.id } };
      if (drive.m2Length && !slot.lengths.includes(drive.m2Length)) return { ok: false, key: "m2.length", params: { slot: slot.id, length: drive.m2Length } };
      return OK;
    }
    case "drive": {
      const bayId = mountId.split(":")[1];
      const bay = b.case.driveBays.find((x) => x.id === bayId);
      const drive = b.storage[part.index];
      if (!bay || !drive) return { ok: false, key: "hands.aim" };
      if (!panelOff(s)) return { ok: false, key: "panel.mustBeOff" };
      if (bay.kind !== drive.kind) return { ok: false, key: "drive.wrongBay", params: { kind: drive.kind, bay: bay.kind } };
      return OK;
    }
    case "psu":
      if (!panelOff(s)) return { ok: false, key: "panel.mustBeOff" };
      return OK;
    case "gpu": {
      const slotId = mountId.split(":")[1];
      const slot = b.board.pcieSlots.find((x) => x.id === slotId);
      if (!slot) return { ok: false, key: "hands.aim" };
      if (!boardInCase(s)) return { ok: false, key: "gpu.boardFirst" };
      if (slot.kind === "pcie-x1") return { ok: false, key: "gpu.x1", params: { slot: slot.id } };
      if (slot.id !== b.board.pcieSlots[0]?.id && mode === "guided") {
        return { ok: false, key: "gpu.notPrimary", params: { slot: slot.id, lanes: `x${slot.lanes}` } };
      }
      const covers = requiredCovers(s);
      const missing = covers.filter((i) => !s.slotCovers[i]).length;
      if (missing) return { ok: false, key: "gpu.covers", params: { n: covers.length } };
      return OK;
    }
    case "fan": {
      const mount = b.case.fanMounts.find((m) => `fan:${m.id}` === mountId);
      const fan = b.fan;
      if (!mount || !fan) return { ok: false, key: "hands.aim" };
      if (!panelOff(s)) return { ok: false, key: "panel.mustBeOff" };
      if (!(mount.sizes as number[]).includes(fan.sizeMm)) return { ok: false, key: "fan.size", params: { sizes: mount.sizes.join("/"), size: fan.sizeMm } };
      const intake = mount.side === "front";
      const flipped = (st?.flips ?? 0) % 2 === 1;
      // flips even = blowing into the case
      if (intake === flipped) {
        const side = mount.side === "front" ? "depan" : mount.side === "rear" ? "belakang" : "atas";
        return { ok: false, key: "fan.airflow", params: { side, expected: intake ? "menyedot udara masuk" : "membuang udara keluar" } };
      }
      return OK;
    }
    case "panel":
      return OK;
    default:
      return OK;
  }
}
