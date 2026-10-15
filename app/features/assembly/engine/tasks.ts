import type { ResolvedBuild } from "@shared/hardware";
import type { CaseGeometry } from "../constants/layouts";
import type { AssemblySnapshot, CableSpec, PartInstance, PhaseId, TaskDefinition } from "../types/assemblyTypes";
import { FP_EXPECTED, fpCorrect } from "./frontPanel";
import { cableSatisfied, isMounted, panelOff, recommendedRamSlots, requiredCovers, standoffDiff } from "./selectors";

export const PHASES: Array<{ id: PhaseId; label: string }> = [
  { id: "prep", label: "Persiapan" },
  { id: "bench", label: "Di luar casing" },
  { id: "case", label: "Siapkan casing" },
  { id: "major", label: "Komponen besar" },
  { id: "cables", label: "Kabel" },
  { id: "power", label: "Tutup dan nyalakan" },
];

const fastened = (s: AssemblySnapshot, id: string) => isMounted(s, id) && (s.parts[id]?.fastened ?? 0) >= 1;

/**
 * The guided script, derived from the build. Order is the real-world order;
 * physical prerequisites are enforced by the rules, not by this list.
 */
export function deriveTasks(b: ResolvedBuild, parts: PartInstance[], cables: CableSpec[], geometry: CaseGeometry): TaskDefinition[] {
  const t: TaskDefinition[] = [];
  const add = (phase: PhaseId, id: string, title: string, hint: string, view: TaskDefinition["view"], isDone: TaskDefinition["isDone"]) =>
    t.push({ id, phase, title, hint, view, isDone });

  add("prep", "strap", "Pakai gelang antistatis", "Klik gelang di sudut kanan depan alas antistatis untuk memakainya.", "overview", (s) => s.strap);

  add("bench", "lever-open", "Buka tuas socket CPU", "Board ada di atas kotaknya. Klik tuas di samping socket untuk membukanya.", "socket", (s) => s.lever === "open" || isMounted(s, "cpu"));
  add("bench", "cpu", "Pasang CPU", "Ambil CPU, sejajarkan segitiga emasnya dengan penanda di socket (putar bila perlu), lalu letakkan.", "bench", (s) => isMounted(s, "cpu"));
  add("bench", "lever-close", "Kunci tuas socket", "Klik tuas lagi untuk menurunkan pelat dan menguncinya.", "socket", (s) => isMounted(s, "cpu") && s.lever === "closed");
  if (!b.cooler.prePasted) {
    add("bench", "paste", "Oles pasta termal", "Pilih alat Pasta, klik CPU, lalu pilih jumlah sebesar butir kacang polong.", "socket", (s) => s.paste === "pas" || isMounted(s, "cooler"));
  }
  add("bench", "plastic", "Kupas plastik pelindung cooler", "Klik cooler di meja untuk mengupas plastik di dasarnya.", "bench", (s) => s.plasticPeeled);
  add("bench", "cooler", "Pasang cooler", "Ambil cooler dan letakkan tepat di atas CPU.", "bench", (s) => isMounted(s, "cooler"));
  add("bench", "cooler-screws", "Kencangkan baut cooler", "Pilih mata obeng yang pas, lalu tahan klik pada cooler.", "socket", (s) => fastened(s, "cooler"));
  parts
    .filter((p) => p.kind === "ram")
    .forEach((p, i) =>
      add(
        "bench",
        p.id,
        `Pasang RAM keping ${i + 1}`,
        `Buka klip slot anjuran, cocokkan takik, tekan sampai klip menutup. Slot anjuran: ${recommendedRamSlotsFor(b)}.`,
        "bench",
        (s) => s.parts[p.id]?.location === "mounted" && s.parts[p.id]?.stage === "seated",
      ),
    );
  parts
    .filter((p) => p.kind === "m2")
    .forEach((p) =>
      add("bench", p.id, `Pasang ${p.label}`, "Masukkan miring ke slot M.2, tekan rata, lalu pasang baut M.2.", "bench", (s) => fastened(s, p.id)),
    );

  add("case", "panel-off", "Lepas panel samping", "Pilih mata obeng, tahan klik pada panel untuk melepas bautnya, lalu klik panel dengan tangan untuk mengangkatnya.", "caseInside", (s) => panelOff(s) || s.parts.board?.mount === "case-board");
  add("case", "standoffs", `Sesuaikan standoff untuk board ${b.board.formFactor}`, "Klik lubang di tray untuk memasang atau melepas standoff. Hanya lubang yang cocok dengan board yang boleh punya standoff.", "caseInside", (s) => {
    const d = standoffDiff(s, geometry);
    return d.missing.length === 0 && d.extra.length === 0;
  });
  parts
    .filter((p) => p.kind === "fan")
    .forEach((p, i) => add("case", p.id, `Pasang kipas ${i + 1}`, "Depan menyedot udara masuk; belakang dan atas membuang keluar. Perhatikan panah di rangka kipas.", "caseInside", (s) => fastened(s, p.id)));

  add("major", "psu", "Pasang PSU", "Masukkan PSU ke ruangnya di bawah, lalu kencangkan bautnya.", "caseLower", (s) => fastened(s, "psu"));
  add("major", "board", "Pindahkan board ke casing", "Angkat board dari kotaknya dan turunkan ke atas standoff.", "caseInside", (s) => s.parts.board?.mount === "case-board");
  add("major", "board-screws", "Kencangkan baut board", "Tahan klik pada board dengan mata obeng yang pas.", "caseInside", (s) => s.parts.board?.mount === "case-board" && (s.parts.board?.fastened ?? 0) >= 1);
  parts
    .filter((p) => p.kind === "drive")
    .forEach((p) => add("major", p.id, `Pasang ${p.label}`, "Letakkan di bay yang ukurannya cocok, lalu kencangkan bautnya.", "caseLower", (s) => fastened(s, p.id)));
  if (b.gpu) {
    add("major", "covers", `Lepas ${b.gpu.slots} penutup slot belakang`, "Klik penutup slot di panel belakang yang sejajar dengan slot PCIe pertama.", "caseInside", (s) => requiredCovers(s).every((i) => s.slotCovers[i]));
    add("major", "gpu", "Pasang VGA", "Masukkan VGA ke slot PCIe x16 paling atas sampai klipnya mengunci.", "caseInside", (s) => isMounted(s, "gpu"));
    add("major", "gpu-screws", "Kencangkan baut bracket VGA", "Tahan klik pada VGA dengan mata obeng yang pas.", "caseInside", (s) => fastened(s, "gpu"));
  }

  for (const c of cables.filter((x) => x.required)) {
    add("cables", `cable-${c.id}`, `Colok ${c.label.charAt(0).toLowerCase()}${c.label.slice(1)}`, cableHint(c), c.id.startsWith("satad") || c.id.startsWith("satap") ? "caseLower" : "caseInside", (s) => cableSatisfied(s, c));
  }
  add("cables", "front-panel", "Colok kabel front panel", "Klik header front panel di pojok bawah board, lalu colok tiap kabel ke pinnya. Buka manual board bila perlu.", "frontPanel", (s) =>
    (Object.keys(FP_EXPECTED) as Array<keyof typeof FP_EXPECTED>).every((k) => fpCorrect(s.frontPanel, k)),
  );

  add("power", "panel-on", "Pasang kembali panel samping", "Letakkan panel di atas casing, lalu kencangkan bautnya.", "caseInside", (s) => s.parts.panel?.location === "mounted" && (s.parts.panel?.fastened ?? 0) >= 1 && s.parts.board?.mount === "case-board");
  add("power", "psu-switch", "Nyalakan saklar PSU", "Putar kamera ke belakang casing dan klik saklar PSU ke posisi I.", "rear", (s) => s.psuSwitch);
  add("power", "power", "Tekan tombol power", "Tombol power ada di sisi atas casing, dekat bagian depan (casing sedang rebah, jadi sisi atasnya menghadap ke kanan).", "power", (s) => !!s.post?.booted);
  return t;
}

function recommendedRamSlotsFor(b: ResolvedBuild): string {
  return (b.board.recommendedRamSlots[String(b.ram.sticks)] ?? []).join(", ");
}

function cableHint(c: CableSpec): string {
  if (c.id === "atx24") return "Ambil ujung kabel 24-pin dari PSU, lewatkan grommet bila mau, lalu colok ke header 24-pin di tepi depan board. Kaitnya menghadap ke luar.";
  if (c.id.startsWith("eps")) return "Colok ke header CPU_PWR di pojok atas board, dekat panel belakang. Jangan tertukar dengan kabel PCIe.";
  if (c.id.startsWith("gpu")) return "Colok ke konektor daya di sisi atas VGA sampai masuk penuh.";
  if (c.id.startsWith("satap")) return "Colok konektor SATA power (bentuk L, lebar) ke drive.";
  if (c.id.startsWith("satad")) return "Colok satu ujung ke drive, ujung lain ke port SATA di tepi depan board.";
  if (c.id === "cpu-fan") return "Colok kabel kipas cooler ke header CPU_FAN.";
  if (c.id.startsWith("fan")) return "Colok kabel kipas ke header SYS_FAN yang kosong.";
  return "Colok ke header yang cocok di tepi bawah board.";
}

/** First not-done task in order: the guided "do this now". */
export function currentTask(tasks: TaskDefinition[], s: AssemblySnapshot): TaskDefinition | null {
  return tasks.find((x) => !x.isDone(s)) ?? null;
}

export { recommendedRamSlots };
