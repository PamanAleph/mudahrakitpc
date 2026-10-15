import type { AnyPart, CatalogItemMap, CategoryId, Goal } from "@shared/hardware";

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  /** One line: why this choice matters, in the order a builder decides. */
  why: string;
  optional?: boolean;
  multi?: boolean;
}

/** Order follows how an experienced builder narrows choices: each pick constrains the next. */
export const CATEGORIES: CategoryInfo[] = [
  { id: "cpu", label: "CPU", why: "Menentukan socket, dan socket menentukan board yang bisa dipakai." },
  { id: "board", label: "Motherboard", why: "Harus cocok dengan socket CPU; menentukan tipe RAM, form factor, slot M.2, dan header." },
  { id: "ram", label: "RAM", why: "Tipe DDR harus sama dengan slot board; jumlah keping tidak boleh melebihi slot." },
  { id: "cooler", label: "CPU cooler", why: "Harus mendukung socket; tingginya nanti dicek ke casing." },
  { id: "gpu", label: "VGA", why: "Panjang, ketebalan slot, dan konektor dayanya menentukan casing dan PSU.", optional: true },
  { id: "storage", label: "Storage", why: "Dibatasi jumlah slot M.2, port SATA, dan bay di casing. Boleh lebih dari satu.", multi: true },
  { id: "case", label: "Casing", why: "Harus menerima form factor board, panjang VGA, tinggi cooler, dan jumlah drive." },
  { id: "fan", label: "Kipas casing", why: "Ukuran dan jumlahnya mengikuti dudukan di casing.", optional: true },
  { id: "psu", label: "PSU", why: "Dipilih terakhir karena kebutuhan daya dan konektor baru jelas setelah semua komponen dipilih." },
];

export const GOAL_LABEL: Record<Goal, string> = { office: "Kantor", gaming: "Gaming", editing: "Editing" };

export const BUDGETS: Array<{ value: number | null; label: string }> = [
  { value: 600, label: "600" },
  { value: 1000, label: "1.000" },
  { value: 1600, label: "1.600" },
  { value: null, label: "Tanpa batas" },
];

const yes = (b: boolean) => (b ? "ya" : "tidak");

/** Short spec facts shown in mono beside each option. Only fields that drive a rule or a fit. */
export function specLine<K extends CategoryId>(category: K, part: CatalogItemMap[K]): string[] {
  const p = part as AnyPart & Record<string, unknown>;
  switch (category) {
    case "case": {
      const c = part as CatalogItemMap["case"];
      return [
        c.formFactors.join(" / "),
        `PSU ${c.psuFormFactor}`,
        `VGA ≤ ${c.gpuMaxLengthCm} cm`,
        `cooler ≤ ${c.coolerMaxHeightCm} cm`,
        `${c.fanMounts.length} dudukan kipas`,
        `bay ${c.driveBays.filter((b) => b.kind === "2.5").length}× 2.5" · ${c.driveBays.filter((b) => b.kind === "3.5").length}× 3.5"`,
      ];
    }
    case "board": {
      const b = part as CatalogItemMap["board"];
      return [
        b.formFactor,
        b.socket,
        `${b.ramType} × ${b.ramSlots.length}`,
        `M.2 × ${b.m2Slots.length}`,
        `SATA × ${b.sataPorts.length}`,
        `header USB-C ${yes(b.headers.usbc > 0)}`,
      ];
    }
    case "cpu": {
      const c = part as CatalogItemMap["cpu"];
      return [c.socket, `grafis terintegrasi ${yes(c.integratedGraphics)}`, `${c.powerW} W`];
    }
    case "cooler": {
      const c = part as CatalogItemMap["cooler"];
      return [c.type, `tinggi ${c.heightCm} cm`, c.sockets.join(" / "), `kipas ${c.fanSizeMm} mm ${c.fanConnector}`, c.prePasted ? "pasta terpasang" : "pasta terpisah"];
    }
    case "ram": {
      const r = part as CatalogItemMap["ram"];
      return [r.type, `${r.sticks} × ${r.capacityGbPerStick} GB`, `tinggi ${r.heightCm} cm`];
    }
    case "gpu": {
      const g = part as CatalogItemMap["gpu"];
      const power = g.powerConnectors.length ? g.powerConnectors.map((c) => `${c.count}× ${c.kind}`).join(" + ") : "tanpa konektor daya";
      return [`${g.lengthCm} cm`, `${g.slots} slot`, power, `${g.powerW} W`];
    }
    case "storage": {
      const s = part as CatalogItemMap["storage"];
      return s.kind === "m2"
        ? [`M.2 ${s.m2Length}`, s.interface.toUpperCase(), `key ${s.m2Key}`]
        : [`${s.kind}"`, s.hybrid ? "SSHD" : s.interface.toUpperCase(), "SATA data + power"];
    }
    case "psu": {
      const s = part as CatalogItemMap["psu"];
      const o = s.outputs;
      return [
        s.formFactor,
        `${s.watt} W`,
        s.modular === "full" ? "modular" : s.modular === "semi" ? "semi-modular" : "non-modular",
        `EPS ${o.eps} · PCIe ${o.pcie8}${o["12v2x6"] ? ` · 12V-2x6 ${o["12v2x6"]}` : ""} · SATA ${o.sataPower}`,
      ];
    }
    case "fan": {
      const f = part as CatalogItemMap["fan"];
      return [`${f.sizeMm} mm`, f.connector];
    }
    default:
      return [String(p.name)];
  }
}
