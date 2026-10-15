import {
  PSU_HEADROOM_WARN,
  estimatePowerW,
  getPart,
  type Build,
  type CategoryId,
  type StorageSpec,
} from "@shared/hardware";

export type Severity = "block" | "warn";

export interface Issue {
  id: string;
  severity: Severity;
  categories: CategoryId[];
  title: string;
  body: string;
}

/**
 * The 14 compatibility rules from the breakdown doc. Pure: build in, issues out.
 * "block" stops the build from going to the bench; "warn" explains a consequence.
 */
export function evaluateBuild(build: Build, budget: number | null = null): Issue[] {
  const issues: Issue[] = [];
  const add = (i: Issue) => issues.push(i);
  const pc = getPart("case", build.caseId);
  const board = getPart("board", build.boardId);
  const cpu = getPart("cpu", build.cpuId);
  const cooler = getPart("cooler", build.coolerId);
  const ram = getPart("ram", build.ramId);
  const gpu = getPart("gpu", build.gpuId);
  const psu = getPart("psu", build.psuId);
  const fan = getPart("fan", build.fanId);
  const storage = build.storageIds.map((id) => getPart("storage", id)).filter((s): s is StorageSpec => !!s);

  // 1. Socket
  if (cpu && board && cpu.socket !== board.socket) {
    add({
      id: "socket",
      severity: "block",
      categories: ["cpu", "board"],
      title: "Socket CPU tidak cocok",
      body: `CPU ini memakai ${cpu.socket}, board memakai ${board.socket}. Bentuk dan jumlah kontaknya berbeda, jadi CPU tidak bisa dipasang.`,
    });
  }

  // 2. RAM type and count
  if (ram && board) {
    if (ram.type !== board.ramType) {
      add({
        id: "ram-type",
        severity: "block",
        categories: ["ram", "board"],
        title: "Tipe RAM tidak cocok",
        body: `Board ini memakai slot ${board.ramType}, RAM ini ${ram.type}. Posisi takiknya berbeda, jadi keping tidak akan masuk.`,
      });
    }
    if (ram.sticks > board.ramSlots.length) {
      add({
        id: "ram-count",
        severity: "block",
        categories: ["ram", "board"],
        title: "Keping RAM lebih banyak dari slot",
        body: `Kit ini berisi ${ram.sticks} keping, board hanya punya ${board.ramSlots.length} slot.`,
      });
    }
  }

  // 3. Form factor
  if (board && pc && !pc.formFactors.includes(board.formFactor)) {
    add({
      id: "form-factor",
      severity: "block",
      categories: ["board", "case"],
      title: "Board tidak muat di casing",
      body: `Casing ini menerima ${pc.formFactors.join(", ")}. Board ${board.formFactor} butuh posisi standoff dan ruang yang tidak ada di casing ini.`,
    });
  }

  // 4. GPU length and thickness
  if (gpu && pc) {
    if (gpu.lengthCm > pc.gpuMaxLengthCm) {
      add({
        id: "gpu-length",
        severity: "block",
        categories: ["gpu", "case"],
        title: "VGA terlalu panjang",
        body: `VGA ini ${gpu.lengthCm} cm, casing hanya muat sampai ${pc.gpuMaxLengthCm} cm.`,
      });
    }
    if (gpu.slots > pc.expansionSlots) {
      add({
        id: "gpu-slots",
        severity: "block",
        categories: ["gpu", "case"],
        title: "VGA terlalu tebal",
        body: `VGA ini memakan ${gpu.slots} slot belakang, casing hanya punya ${pc.expansionSlots}.`,
      });
    }
  }

  // 5. Cooler socket and height
  if (cooler) {
    const socket = board?.socket ?? cpu?.socket;
    if (socket && !cooler.sockets.includes(socket)) {
      add({
        id: "cooler-socket",
        severity: "block",
        categories: ["cooler", board ? "board" : "cpu"],
        title: "Cooler tidak mendukung socket ini",
        body: `Bracket cooler ini untuk ${cooler.sockets.join(", ")}. Lubang dudukan ${socket} tidak cocok.`,
      });
    }
    if (pc && cooler.heightCm > pc.coolerMaxHeightCm) {
      add({
        id: "cooler-height",
        severity: "block",
        categories: ["cooler", "case"],
        title: "Cooler terlalu tinggi",
        body: `Cooler ini ${cooler.heightCm} cm, panel samping casing hanya muat ${pc.coolerMaxHeightCm} cm.`,
      });
    }
  }

  // 6. Tower cooler vs tall RAM
  if (cooler && ram && cooler.type === "tower" && ram.heightCm > cooler.ramClearanceCm) {
    add({
      id: "cooler-ram",
      severity: "warn",
      categories: ["cooler", "ram"],
      title: "RAM bisa terhalang cooler",
      body: `Heat spreader RAM ${ram.heightCm} cm, ruang di bawah sirip cooler ${cooler.ramClearanceCm} cm. Kipas cooler mungkin perlu digeser ke atas.`,
    });
  }

  // 7. Storage fit
  if (board && storage.length) {
    const m2 = storage.filter((s) => s.kind === "m2");
    const slots = [...board.m2Slots];
    for (const drive of m2) {
      const i = slots.findIndex(
        (s) =>
          s.interfaces.includes(drive.interface === "sata" ? "sata" : "pcie") &&
          (drive.m2Length ? s.lengths.includes(drive.m2Length) : true),
      );
      if (i === -1) {
        add({
          id: `m2-${drive.id}`,
          severity: "block",
          categories: ["storage", "board"],
          title: drive.interface === "sata" ? "Tidak ada slot M.2 yang mendukung SATA" : "Slot M.2 tidak cukup",
          body:
            drive.interface === "sata"
              ? `${drive.name} memakai jalur SATA. Slot M.2 board ini yang tersisa hanya PCIe, jadi drive tidak akan terbaca meskipun key-nya pas.`
              : `Board ini punya ${board.m2Slots.length} slot M.2, sudah terpakai semua.`,
        });
      } else {
        slots.splice(i, 1);
      }
    }
    const sata = storage.filter((s) => s.kind !== "m2");
    if (sata.length > board.sataPorts.length) {
      add({
        id: "sata-ports",
        severity: "block",
        categories: ["storage", "board"],
        title: "Port SATA tidak cukup",
        body: `Ada ${sata.length} drive SATA, board punya ${board.sataPorts.length} port.`,
      });
    }
    if (pc) {
      for (const kind of ["2.5", "3.5"] as const) {
        const need = sata.filter((s) => s.kind === kind).length;
        const have = pc.driveBays.filter((b) => b.kind === kind).length;
        if (need > have) {
          add({
            id: `bay-${kind}`,
            severity: "block",
            categories: ["storage", "case"],
            title: `Bay ${kind}" tidak cukup`,
            body: `Ada ${need} drive ${kind}", casing punya ${have} bay ${kind}".`,
          });
        }
      }
    }
  }

  // 8 + 9 + 10. PSU size, wattage, connectors
  if (psu) {
    if (pc && psu.formFactor !== pc.psuFormFactor) {
      add({
        id: "psu-ff",
        severity: "block",
        categories: ["psu", "case"],
        title: "Ukuran PSU tidak cocok",
        body: `Ruang PSU casing ini untuk ${pc.psuFormFactor}, PSU ini ${psu.formFactor}. Lubang baut dan ukurannya berbeda.`,
      });
    }
    const draw = estimatePowerW(build);
    if (draw > psu.watt) {
      add({
        id: "psu-watt",
        severity: "block",
        categories: ["psu"],
        title: "Daya PSU kurang",
        body: `Perkiraan kebutuhan ${draw} W, PSU ini ${psu.watt} W.`,
      });
    } else if (draw > psu.watt * PSU_HEADROOM_WARN) {
      add({
        id: "psu-headroom",
        severity: "warn",
        categories: ["psu"],
        title: "Daya PSU mepet",
        body: `Perkiraan kebutuhan ${draw} W dari ${psu.watt} W. Sisa daya kecil untuk lonjakan beban.`,
      });
    }
    if (board && board.headers.eps > psu.outputs.eps) {
      add({
        id: "psu-eps",
        severity: "block",
        categories: ["psu", "board"],
        title: "Kabel EPS kurang",
        body: `Board butuh ${board.headers.eps} kabel EPS 8-pin untuk CPU, PSU hanya punya ${psu.outputs.eps}.`,
      });
    }
    if (gpu) {
      const need8 = gpu.powerConnectors.filter((c) => c.kind !== "12v-2x6").reduce((s, c) => s + c.count, 0);
      const need12 = gpu.powerConnectors.filter((c) => c.kind === "12v-2x6").reduce((s, c) => s + c.count, 0);
      if (need8 > psu.outputs.pcie8) {
        add({
          id: "psu-pcie",
          severity: "block",
          categories: ["psu", "gpu"],
          title: "Kabel PCIe kurang",
          body: `VGA butuh ${need8} kabel PCIe, PSU punya ${psu.outputs.pcie8}.`,
        });
      }
      if (need12 > psu.outputs["12v2x6"]) {
        add({
          id: "psu-12v2x6",
          severity: "block",
          categories: ["psu", "gpu"],
          title: "PSU tidak punya kabel 12V-2x6",
          body: "VGA ini memakai konektor 12V-2x6. Pilih PSU yang punya output 12V-2x6. Adaptor dari beberapa kabel 8-pin ada, tetapi belum dimodelkan di simulator ini.",
        });
      }
    }
    const sataDrives = storage.filter((s) => s.kind !== "m2").length;
    if (sataDrives > psu.outputs.sataPower) {
      add({
        id: "psu-sata",
        severity: "block",
        categories: ["psu", "storage"],
        title: "Konektor SATA power kurang",
        body: `Ada ${sataDrives} drive SATA, PSU punya ${psu.outputs.sataPower} konektor SATA power.`,
      });
    }
  }

  // 11. Fans
  if (fan && pc && build.fanCount > 0) {
    const mounts = pc.fanMounts.filter((m) => (m.sizes as number[]).includes(fan.sizeMm)).length;
    if (build.fanCount > mounts) {
      add({
        id: "fan-mounts",
        severity: "block",
        categories: ["fan", "case"],
        title: "Dudukan kipas tidak cukup",
        body: `Casing ini punya ${mounts} dudukan untuk kipas ${fan.sizeMm} mm.`,
      });
    }
    if (board && build.fanCount > board.headers.sysFan) {
      add({
        id: "fan-headers",
        severity: "block",
        categories: ["fan", "board"],
        title: "Header kipas kurang",
        body: `Board punya ${board.headers.sysFan} header SYS_FAN untuk ${build.fanCount} kipas. Kipas sisanya butuh splitter atau hub, yang belum dimodelkan di simulator ini.`,
      });
    }
  }

  // 12. Front USB-C
  if (pc && board && pc.frontIO.usbc && board.headers.usbc === 0) {
    add({
      id: "usbc",
      severity: "warn",
      categories: ["case", "board"],
      title: "Port USB-C depan tidak akan berfungsi",
      body: "Casing punya USB-C di depan, tetapi board tidak punya header USB-C (Key-A). Kabelnya tidak bisa dicolok ke mana pun.",
    });
  }

  // 13. Integrated graphics
  if (cpu && !cpu.integratedGraphics && !gpu) {
    add({
      id: "no-display",
      severity: "warn",
      categories: ["cpu", "gpu"],
      title: "Tidak ada keluaran gambar",
      body: "CPU ini tidak punya grafis terintegrasi dan tidak ada VGA. PC bisa menyala, tetapi monitor tidak menampilkan apa pun.",
    });
  }

  // 14. M.2 lane sharing
  if (board) {
    const m2Count = storage.filter((s) => s.kind === "m2").length;
    board.m2Slots.slice(0, m2Count).forEach((slot) => {
      if (slot.disablesSata.length) {
        add({
          id: `share-${slot.id}`,
          severity: "warn",
          categories: ["storage", "board"],
          title: `${slot.id} berbagi jalur dengan SATA`,
          body: `Saat ${slot.id} terisi, port ${slot.disablesSata.join(", ")} mati. Jangan colok drive SATA ke port itu.`,
        });
      }
    });
  }

  if (budget !== null) {
    const total = priceOf(build);
    if (total > budget) {
      add({
        id: "budget",
        severity: "warn",
        categories: [],
        title: "Melebihi anggaran",
        body: `Total ${total} kredit dari anggaran ${budget} kredit.`,
      });
    }
  }

  return issues;
}

function priceOf(build: Build): number {
  const ids: Array<[CategoryId, string | null]> = [
    ["case", build.caseId],
    ["board", build.boardId],
    ["cpu", build.cpuId],
    ["cooler", build.coolerId],
    ["ram", build.ramId],
    ["gpu", build.gpuId],
    ["psu", build.psuId],
  ];
  const fan = getPart("fan", build.fanId);
  return (
    ids.reduce((s, [c, id]) => s + (getPart(c, id)?.price ?? 0), 0) +
    build.storageIds.reduce((s, id) => s + (getPart("storage", id)?.price ?? 0), 0) +
    (fan ? fan.price * build.fanCount : 0)
  );
}

/** What would go wrong if this option were chosen? First blocking issue that involves its category. */
export function optionProblem(build: Build, category: CategoryId, optionId: string): Issue | null {
  const next = withOption(build, category, optionId);
  const before = new Set(evaluateBuild(build).map((i) => i.id));
  const after = evaluateBuild(next).filter((i) => i.severity === "block" && i.categories.includes(category));
  return after.find((i) => !before.has(i.id)) ?? after[0] ?? null;
}

export function withOption(build: Build, category: CategoryId, optionId: string): Build {
  switch (category) {
    case "storage":
      return build.storageIds.includes(optionId) ? build : { ...build, storageIds: [...build.storageIds, optionId] };
    case "fan":
      return { ...build, fanId: optionId, fanCount: Math.max(1, build.fanCount) };
    default:
      return { ...build, [`${category}Id`]: optionId } as Build;
  }
}

export const REQUIRED: CategoryId[] = ["case", "board", "cpu", "cooler", "ram", "storage", "psu"];

export function missingRequired(build: Build): CategoryId[] {
  return REQUIRED.filter((c) => (c === "storage" ? build.storageIds.length === 0 : !(build as unknown as Record<string, unknown>)[`${c}Id`]));
}
