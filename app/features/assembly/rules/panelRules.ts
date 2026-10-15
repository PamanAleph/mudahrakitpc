import type { RuleResult } from "../types/assemblyTypes";

export function canRemovePanel(screwsLeft: number): RuleResult {
  return screwsLeft === 0 ? { ok: true } : { ok: false, key: "panel.stillScrewed", params: { left: screwsLeft } };
}
