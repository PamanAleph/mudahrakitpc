import type { ResolvedBuild } from "@shared/hardware";
import type { PartInstance } from "../types/assemblyTypes";
import { BENCH_BOX, BENCH_TOP, BOARD_SIZE, BOARD_T, MAT, MAT_T, benchCenter, type CaseGeometry } from "./layouts";

/**
 * Where everything rests on the desk before it is installed (world frame).
 * Case at the origin; the board box (bench) to its left; small parts in front;
 * big parts to the right; the glass panel set aside behind the case.
 */
type Vec3 = [number, number, number];
export interface Pose {
  position: Vec3;
  rotation: Vec3;
}

const MAT_FRONT = MAT.center[2] + MAT.depth / 2;
const MAT_RIGHT = MAT.center[0] + MAT.width / 2;

export const STRAP_POINT: Vec3 = [MAT_RIGHT - 5, MAT_T, MAT_FRONT - 5];
export const SCREWDRIVER_REST: Pose = { position: [-30, MAT_T + 0.9, MAT_FRONT - 7], rotation: [0, 0, Math.PI / 2] };
export const SYRINGE_REST: Pose = { position: [-14, MAT_T + 0.9, MAT_FRONT - 7], rotation: [0, 0, Math.PI / 2] };
export const MONITOR_POSE: Pose = { position: [-44, 0, -64], rotation: [0, 0.35, 0] };

export function benchBoardPose(b: ResolvedBuild, g: CaseGeometry): Pose {
  const c = benchCenter(g.L);
  const s = BOARD_SIZE[b.board.formFactor];
  return { position: [c[0] + s.length / 2, BENCH_TOP + 0.05 + BOARD_T, c[2] - s.width / 2], rotation: [0, 0, 0] };
}

export function restPose(p: PartInstance, b: ResolvedBuild, g: CaseGeometry): Pose {
  const right = g.L / 2;
  const front = g.D / 2;
  const bench = benchCenter(g.L);
  switch (p.kind) {
    case "board":
      return benchBoardPose(b, g);
    // Small parts sit in front of the bench, within one camera framing of the socket.
    case "cpu":
      return { position: [bench[0] + 6, MAT_T, bench[2] + BENCH_BOX.size[2] / 2 + 7], rotation: [0, 0, 0] };
    case "cooler":
      return { position: [bench[0] - 10, MAT_T, bench[2] + BENCH_BOX.size[2] / 2 + 10], rotation: [0, 0, 0] };
    case "ram":
      return { position: [bench[0] + 21, MAT_T + 0.3, bench[2] + BENCH_BOX.size[2] / 2 + 8 + p.index * 5], rotation: [-Math.PI / 2, 0, 0] };
    case "m2":
      return { position: [bench[0] + 4 + p.index * 4, MAT_T, bench[2] + BENCH_BOX.size[2] / 2 + 14], rotation: [0, 0, 0] };
    case "drive": {
      const big = b.storage[p.index]?.kind === "3.5";
      return { position: [6 + p.index * 13, MAT_T, front + (big ? 19 : 16)], rotation: [0, 0, 0] };
    }
    case "gpu": {
      const slots = b.gpu?.slots ?? 2;
      return { position: [right + 45, MAT_T + slots * 2.03 - 0.3, -26], rotation: [0, 0, Math.PI / 2] };
    }
    case "psu": {
      const h = b.psu.formFactor === "SFX" ? 12.5 : 15;
      return { position: [right + 15, MAT_T + h / 2, -16], rotation: [0, 0, 0] };
    }
    case "fan":
      return { position: [right + 14 + (p.index % 3) * 15, MAT_T + 1.25, front + 8 + Math.floor(p.index / 3) * 15], rotation: [-Math.PI / 2, 0, 0] };
    case "panel":
      return { position: [right + 2, 0, -g.D / 2 - 30], rotation: [0, 0, 0] };
    default:
      return { position: [0, MAT_T, front + 20], rotation: [0, 0, 0] };
  }
}

/** Height of the plane a held part follows the pointer on. */
export function heldHeight(kind: PartInstance["kind"], boardOnBench: boolean): number {
  if ((kind === "cpu" || kind === "cooler" || kind === "ram" || kind === "m2") && boardOnBench) return BENCH_TOP + 9;
  if (kind === "panel") return MAT_T + 30;
  return MAT_T + 26;
}

