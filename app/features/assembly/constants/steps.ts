import type { AssemblySnapshot } from "../store/assemblyStore";
import type { ViewId } from "../types/assemblyTypes";
import { HARDWARE, M2_SCREW, PANEL_SCREW } from "../services/hardwareSpec";

export interface StepDefinition {
  id: string;
  title: string;
  hint: string;
  view: ViewId;
  isDone: (s: AssemblySnapshot) => boolean;
}

const screwsLeft = (s: AssemblySnapshot) => Object.values(s.panelScrews).filter((p) => !p.removed).length;

/** Guided-mode script. Order is the real-world assembly order for this scenario. */
export const STEPS: StepDefinition[] = [
  {
    id: "panel-screws",
    title: "Lepas 4 baut panel samping",
    hint: `Pilih mata obeng di bilah bawah, lalu tahan klik pada tiap baut sampai lepas. Baut panel memakai mata ${PANEL_SCREW.bit}.`,
    view: "overview",
    isDone: (s) => screwsLeft(s) === 0,
  },
  {
    id: "panel-lift",
    title: "Angkat panel samping",
    hint: "Pilih alat Tangan, lalu klik panel kaca untuk mengangkatnya.",
    view: "overview",
    isDone: (s) => s.panel === "removed",
  },
  {
    id: "ram-latch",
    title: "Buka klip slot RAM",
    hint: `Klik tuas abu-abu di ujung slot ${HARDWARE.motherboard.recommendedSingleDimmSlot} (slot kedua dari socket CPU) untuk membukanya.`,
    view: "ram",
    isDone: (s) => Object.values(s.latches).some(Boolean) || s.ram.state === "inserted" || s.ram.state === "seated",
  },
  {
    id: "ram-insert",
    title: "Masukkan RAM, takik sejajar",
    hint: "Ambil keping RAM di baki. Celah di bawah keping harus jatuh di atas sekat slot; kalau tidak, putar 180°. Lalu klik slot yang klipnya terbuka.",
    view: "bench",
    isDone: (s) => s.ram.state === "inserted" || s.ram.state === "seated",
  },
  {
    id: "ram-press",
    title: "Tekan RAM sampai klip menutup",
    hint: "Tahan klik pada keping. Klip menutup sendiri saat keping masuk penuh.",
    view: "ram",
    isDone: (s) => s.ram.state === "seated",
  },
  {
    id: "ssd-insert",
    title: "Masukkan SSD M.2 ke slot",
    hint: "Ambil SSD di baki dan arahkan ke slot M.2 di bawah socket CPU, lalu klik. SSD masuk dengan posisi miring.",
    view: "bench",
    isDone: (s) => s.ssd === "angled" || s.ssd === "flat" || s.ssd === "secured",
  },
  {
    id: "ssd-press",
    title: "Tekan SSD rata",
    hint: "Tahan klik pada SSD sampai ujungnya rata menyentuh standoff.",
    view: "m2",
    isDone: (s) => s.ssd === "flat" || s.ssd === "secured",
  },
  {
    id: "m2-screw",
    title: "Pasang baut M.2",
    hint: `Pilih mata ${M2_SCREW.bit}, klik baut kecil di mangkuk supaya menempel di ujung obeng, lalu tahan klik pada standoff di ujung SSD.`,
    view: "bench",
    isDone: (s) => s.ssd === "secured",
  },
];

export function currentStepIndex(s: AssemblySnapshot): number {
  const i = STEPS.findIndex((step) => !step.isDone(s));
  return i === -1 ? STEPS.length : i;
}

export function panelScrewsLeft(s: AssemblySnapshot): number {
  return screwsLeft(s);
}
