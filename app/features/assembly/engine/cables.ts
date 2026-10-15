import type { ResolvedBuild } from "@shared/hardware";
import type { CableSpec, CableState } from "../types/assemblyTypes";

/** Every cable this build needs, where it starts, and where it must end. */
export function deriveCables(b: ResolvedBuild): CableSpec[] {
  const cables: CableSpec[] = [];
  const psu = (anchor: string) => ({ partId: "psu", anchor });

  cables.push({
    id: "atx24",
    label: "Kabel ATX 24-pin",
    gauge: "bundle",
    color: "black",
    ends: { a: { fixedTo: psu("out:atx24"), plugKind: "atx-24" }, b: { plugKind: "atx-24" } },
    targets: [{ end: "b", portId: "board:atx24", portKind: "atx-24" }],
    required: true,
    availableWhen: "psu",
  });
  for (let i = 0; i < b.board.headers.eps; i++) {
    cables.push({
      id: `eps-${i}`,
      label: `Kabel EPS 8-pin (CPU) ${b.board.headers.eps > 1 ? i + 1 : ""}`.trim(),
      gauge: "thick",
      color: "black",
      ends: { a: { fixedTo: psu(`out:eps-${i}`), plugKind: "eps-8" }, b: { plugKind: "eps-8" } },
      targets: [{ end: "b", portId: `board:eps-${i}`, portKind: "eps-8" }],
      required: true,
      availableWhen: "psu",
    });
  }
  if (b.gpu) {
    let k = 0;
    for (const c of b.gpu.powerConnectors) {
      for (let n = 0; n < c.count; n++, k++) {
        cables.push({
          id: `gpu-${k}`,
          label: c.kind === "12v-2x6" ? "Kabel 12V-2x6" : "Kabel PCIe 8-pin (6+2)",
          gauge: "thick",
          color: "black",
          ends: { a: { fixedTo: psu(`out:gpu-${k}`), plugKind: c.kind }, b: { plugKind: c.kind } },
          targets: [{ end: "b", portId: `gpu:pwr-${k}`, portKind: c.kind }],
          required: true,
          availableWhen: "psu",
        });
      }
    }
  }
  // A spare PCIe cable on PSUs that have one: it exists in real boxes and is the classic EPS mix-up.
  if (b.psu.outputs.pcie8 > 0 && !(b.gpu?.powerConnectors.some((c) => c.kind === "pcie-8"))) {
    cables.push({
      id: "pcie-spare",
      label: "Kabel PCIe 8-pin (6+2) cadangan",
      gauge: "thick",
      color: "black",
      ends: { a: { fixedTo: psu("out:pcie-spare"), plugKind: "pcie-8" }, b: { plugKind: "pcie-8" } },
      targets: [],
      required: false,
      availableWhen: "psu",
    });
  }
  let sataIndex = 0;
  b.storage.forEach((s, i) => {
    if (s.kind === "m2") return;
    cables.push({
      id: `satap-${i}`,
      label: `Kabel SATA power · ${s.name}`,
      gauge: "ribbon",
      color: "black",
      ends: { a: { fixedTo: psu(`out:sata-${sataIndex++}`), plugKind: "sata-power" }, b: { plugKind: "sata-power" } },
      targets: [{ end: "b", portId: `drive-${i}:power`, portKind: "sata-power" }],
      required: true,
      availableWhen: "psu",
    });
    cables.push({
      id: `satad-${i}`,
      label: `Kabel SATA data · ${s.name}`,
      gauge: "thin",
      color: "red",
      ends: { a: { plugKind: "sata-data" }, b: { plugKind: "sata-data" } },
      targets: [
        { end: "a", portId: `drive-${i}:data`, portKind: "sata-data" },
        { end: "b", portId: "board:sata-*", portKind: "sata-data" },
      ],
      required: true,
    });
  });
  cables.push({
    id: "cpu-fan",
    label: "Kabel kipas cooler",
    gauge: "hair",
    color: "black",
    ends: { a: { fixedTo: { partId: "cooler", anchor: "fan" }, plugKind: b.cooler.fanConnector }, b: { plugKind: b.cooler.fanConnector } },
    targets: [{ end: "b", portId: "board:cpu_fan", portKind: "fan-4pin" }],
    required: true,
    availableWhen: "cooler",
  });
  for (let i = 0; i < b.fanCount; i++) {
    const kind = b.fan?.connector ?? "fan-4pin";
    cables.push({
      id: `fan-${i}`,
      label: `Kabel kipas ${i + 1}`,
      gauge: "hair",
      color: "black",
      ends: { a: { fixedTo: { partId: `fan-${i}`, anchor: "cable" }, plugKind: kind }, b: { plugKind: kind } },
      targets: [{ end: "b", portId: "board:sys_fan-*", portKind: "fan-4pin" }],
      required: true,
      availableWhen: `fan-${i}`,
    });
  }
  const front = (anchor: string) => ({ partId: "case", anchor });
  if (b.case.frontIO.usb3) {
    cables.push({
      id: "usb3",
      label: "Kabel USB 3.x depan",
      gauge: "thick",
      color: "grey",
      ends: { a: { fixedTo: front("usb3"), plugKind: "usb3-header" }, b: { plugKind: "usb3-header" } },
      targets: [{ end: "b", portId: "board:usb3", portKind: "usb3-header" }],
      required: b.board.headers.usb3 > 0,
    });
  }
  if (b.case.frontIO.usbc) {
    cables.push({
      id: "usbc",
      label: "Kabel USB-C depan",
      gauge: "thin",
      color: "black",
      ends: { a: { fixedTo: front("usbc"), plugKind: "usbc-header" }, b: { plugKind: "usbc-header" } },
      targets: [{ end: "b", portId: "board:usbc", portKind: "usbc-header" }],
      required: b.board.headers.usbc > 0,
    });
  }
  if (b.case.frontIO.audio) {
    cables.push({
      id: "audio",
      label: "Kabel HD Audio depan",
      gauge: "hair",
      color: "black",
      ends: { a: { fixedTo: front("audio"), plugKind: "hd-audio" }, b: { plugKind: "hd-audio" } },
      targets: [{ end: "b", portId: "board:audio", portKind: "hd-audio" }],
      required: b.board.headers.audio > 0,
    });
  }
  return cables;
}

export function initialCableStates(specs: CableSpec[]): Record<string, CableState> {
  const out: Record<string, CableState> = {};
  for (const c of specs) {
    out[c.id] = {
      ends: {
        a: { state: c.ends.a.fixedTo ? "plugged" : "loose", portId: null, flips: 0 },
        // Main power plugs start flipped: finding the latch side is part of the lesson.
        b: { state: "loose", portId: null, flips: c.id === "atx24" || c.id.startsWith("eps") ? 1 : 0 },
      },
      via: [],
    };
  }
  return out;
}
