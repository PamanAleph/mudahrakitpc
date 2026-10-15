import { getPart } from "./catalog";
import type { Build } from "./types";

/**
 * Estimated draw in watts: the sum of each part's demo powerW.
 * [BELUM DIKONFIRMASI] The headroom threshold below is a placeholder until it is
 * taken from an official PSU maker guide.
 */
export const PSU_HEADROOM_WARN = 0.8;

export function estimatePowerW(build: Build): number {
  const ram = getPart("ram", build.ramId);
  const fan = getPart("fan", build.fanId);
  const single = [
    getPart("board", build.boardId),
    getPart("cpu", build.cpuId),
    getPart("cooler", build.coolerId),
    getPart("gpu", build.gpuId),
    ...build.storageIds.map((id) => getPart("storage", id)),
  ];
  return (
    single.reduce((s, p) => s + (p?.powerW ?? 0), 0) + (ram ? ram.powerW : 0) + (fan ? fan.powerW * build.fanCount : 0)
  );
}
