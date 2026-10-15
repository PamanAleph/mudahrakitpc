import type { FrontPanelPlugId } from "../types/assemblyTypes";

/**
 * Intel front-panel header pinout (connectors.json, source: Intel support article 000008045).
 * Odd pins are one row, even pins the other; pin 10 is absent.
 */
export const FP_PINS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const FP_MISSING = [10];

export const FP_EXPECTED: Record<FrontPanelPlugId, number[]> = {
  "HDLED+": [1],
  "HDLED-": [3],
  "PLED+": [2],
  "PLED-": [4],
  RESET_SW: [5, 7],
  PWR_SW: [6, 8],
};

export const FP_PLUGS: Array<{ id: FrontPanelPlugId; label: string; width: 1 | 2; polarized: boolean }> = [
  { id: "PWR_SW", label: "POWER SW", width: 2, polarized: false },
  { id: "RESET_SW", label: "RESET SW", width: 2, polarized: false },
  { id: "PLED+", label: "POWER LED +", width: 1, polarized: true },
  { id: "PLED-", label: "POWER LED −", width: 1, polarized: true },
  { id: "HDLED+", label: "HDD LED +", width: 1, polarized: true },
  { id: "HDLED-", label: "HDD LED −", width: 1, polarized: true },
];

/** A 2-pin plug occupies the clicked pin and the next pin in the same row. */
export function pinsFor(plug: FrontPanelPlugId, first: number): number[] {
  const w = FP_PLUGS.find((p) => p.id === plug)?.width ?? 1;
  return w === 2 ? [first, first + 2] : [first];
}

export const sameSet = (a: number[] | undefined, b: number[]) =>
  !!a && a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);

export function fpCorrect(map: Partial<Record<FrontPanelPlugId, number[]>>, plug: FrontPanelPlugId): boolean {
  return sameSet(map[plug], FP_EXPECTED[plug]);
}

/** Polarity swap: + on the − pin and − on the + pin of the same LED. */
export function fpSwapped(map: Partial<Record<FrontPanelPlugId, number[]>>, led: "PLED" | "HDLED"): boolean {
  const plus = map[`${led}+` as FrontPanelPlugId];
  const minus = map[`${led}-` as FrontPanelPlugId];
  return sameSet(plus, FP_EXPECTED[`${led}-` as FrontPanelPlugId]) && sameSet(minus, FP_EXPECTED[`${led}+` as FrontPanelPlugId]);
}

export const FP_EFFECT: Record<FrontPanelPlugId, string> = {
  PWR_SW: "Tombol power di casing tidak akan bisa menyalakan PC.",
  RESET_SW: "Tombol reset tidak akan berfungsi.",
  "PLED+": "Lampu power di casing tidak akan menyala.",
  "PLED-": "Lampu power di casing tidak akan menyala.",
  "HDLED+": "Lampu aktivitas drive tidak akan menyala.",
  "HDLED-": "Lampu aktivitas drive tidak akan menyala.",
};
