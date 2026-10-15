import type { M2ScrewState, RuleResult, SsdState } from "../types/assemblyTypes";

export function canDriveM2Screw(ssd: SsdState, screw: M2ScrewState): RuleResult {
  if (ssd === "secured") return { ok: false, key: "standoff.done" };
  if (ssd !== "flat") return { ok: false, key: "standoff.needsSsd" };
  if (screw !== "onBit") return { ok: false, key: "standoff.needsScrew" };
  return { ok: true };
}
