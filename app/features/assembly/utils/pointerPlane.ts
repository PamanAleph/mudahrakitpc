import type { RootState } from "@react-three/fiber";
import { Plane, Vector3 } from "three";

const plane = new Plane(new Vector3(0, 1, 0), 0);

/** Where the pointer ray meets the horizontal plane at height y. */
export function pointerOnPlane(state: RootState, y: number, target = new Vector3()): Vector3 | null {
  state.raycaster.setFromCamera(state.pointer, state.camera);
  plane.constant = -y;
  return state.raycaster.ray.intersectPlane(plane, target);
}

/** 0..1 decaying wobble for "that didn't fit" feedback. */
export function shakeOffset(startedAt: number | undefined, now: number, amplitude = 0.22, durationMs = 420): number {
  if (!startedAt) return 0;
  const t = now - startedAt;
  if (t < 0 || t > durationMs) return 0;
  const k = 1 - t / durationMs;
  return Math.sin(t * 0.07) * amplitude * k * k;
}
