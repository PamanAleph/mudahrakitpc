import type { ViewId } from "../types/assemblyTypes";

type Vec3 = [number, number, number];

/** Camera presets: where the builder's eyes go for each part of the job. */
export const VIEWS: Record<ViewId, { target: Vec3; offset: Vec3; label: string }> = {
  overview: { target: [2, 0, -1.5], offset: [0, 122, 54], label: "Lihat semua" },
  bench: { target: [12, 0, 5], offset: [0, 80, 36], label: "Meja kerja" },
  ram: { target: [9, 2, -5.2], offset: [9, 25, 13], label: "Slot RAM" },
  m2: { target: [5.5, 1.5, -12.5], offset: [-2, 24, 13], label: "Slot M.2" },
};

/** Pull the camera back on tall, narrow screens so the case still fits. */
export function viewFitScale(aspect: number): number {
  return Math.min(1.9, Math.max(1, 0.95 / aspect));
}
