import type { RuleResult, SlotId } from "../types/assemblyTypes";

interface RamInsertInput {
  slot: SlotId;
  latchOpen: boolean;
  /** True when the stick is rotated 180° from the slot key. */
  flipped: boolean;
  ramType: string;
  slotType: string;
}

/** Order matters: the most fundamental problem is reported first. */
export function canInsertRam(input: RamInsertInput): RuleResult {
  if (input.ramType !== input.slotType) {
    return { ok: false, key: "ram.typeMismatch", params: { ramType: input.ramType, slotType: input.slotType } };
  }
  if (!input.latchOpen) return { ok: false, key: "ram.latchClosed", params: { slot: input.slot } };
  if (input.flipped) return { ok: false, key: "ram.notchMisaligned" };
  return { ok: true };
}

export function isRamSnapValid(input: RamInsertInput): boolean {
  return canInsertRam(input).ok;
}
