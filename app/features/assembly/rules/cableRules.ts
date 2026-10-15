import { connectorAccepts, getConnector } from "@shared/hardware";
import { disabledSataPorts, portAvailable, portOccupant, sataPortName } from "../engine/selectors";
import type { PortDef } from "../engine/ports";
import type { AssemblySnapshot, CableSpec, EndId, Mode, RuleResult } from "../types/assemblyTypes";

/** Can this cable end go into this port? Keying first, then orientation, then the softer rules. */
export function canPlug(s: AssemblySnapshot, spec: CableSpec, end: EndId, port: PortDef, mode: Mode): RuleResult {
  const plug = spec.ends[end].plugKind;
  const occ = portOccupant(s, port.id);
  if (occ && !(occ.cableId === spec.id && occ.end === end)) return { ok: false, key: "cable.portBusy" };
  const avail = portAvailable(s, port);
  if (!avail.ok) return avail;
  if (!connectorAccepts(port.kind, plug)) {
    if (plug === "pcie-8" && port.kind === "eps-8") return { ok: false, key: "cable.pcieIntoEps" };
    if (plug === "eps-8" && port.kind === "pcie-8") return { ok: false, key: "cable.epsIntoPcie" };
    return { ok: false, key: "cable.wrongKind", params: { plug: getConnector(plug).name, port: getConnector(port.kind).name } };
  }
  if ((s.cables[spec.id]?.ends[end].flips ?? 0) % 2 !== 0) return { ok: false, key: "cable.flipped", params: { connector: getConnector(plug).name } };
  if (mode === "guided") {
    if (port.kind === "sata-data" && port.owner === "board") {
      const name = sataPortName(s, port.id);
      if (disabledSataPorts(s).includes(name)) {
        const slot = s.build.board.m2Slots.find((x) => x.disablesSata.includes(name))?.id ?? "M.2";
        return { ok: false, key: "cable.sataDisabled", params: { port: name, slot } };
      }
    }
    if (spec.id === "cpu-fan" && port.id !== "board:cpu_fan") return { ok: false, key: "cable.cpuFanHeader" };
    if (spec.id.startsWith("fan-") && port.id === "board:cpu_fan") return { ok: false, key: "cable.caseFanHeader" };
  }
  return { ok: true };
}
