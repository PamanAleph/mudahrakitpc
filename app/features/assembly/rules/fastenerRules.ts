import type { BitSpec, ScrewSpec } from "../types/hardwareTypes";
import type { RuleResult, ToolId } from "../types/assemblyTypes";

/** Does the selected tool fit this screw head? Pure: data in, verdict out. */
export function checkBitFits(screw: ScrewSpec, tool: ToolId, bits: readonly BitSpec[]): RuleResult {
  if (tool === "hand") return { ok: false, key: "screw.needsTool", params: { screw: screw.name } };
  if (tool === screw.bit) return { ok: true };
  const order = (id: string) => bits.find((b) => b.id === id)?.order ?? 0;
  const params = { bit: tool, need: screw.bit, screw: screw.name };
  return order(tool) < order(screw.bit)
    ? { ok: false, key: "screw.bitTooSmall", params }
    : { ok: false, key: "screw.bitTooLarge", params };
}
