import type { Object3D, Quaternion, Vector3 } from "three";

/**
 * Mutable bridges between the store and the scene. Scene components register
 * the Object3D that marks each mount, port and named anchor; the store and the
 * per-frame controllers read world positions from here. Never React state.
 * No value imports from three here: the store (and so the HUD chunk) imports
 * this file, and three must stay in the lazy 3D chunk.
 */
interface ControlsLike {
  enabled: boolean;
}

export const runtime = {
  controls: null as ControlsLike | null,
  /** Last point the pointer touched on an interactive object (where the screwdriver goes). */
  hitPoint: { x: 0, y: 0, z: 0 },
  hitValid: false,
  mounts: new Map<string, Object3D>(),
  ports: new Map<string, Object3D>(),
  /** Named anchors: "cable:<partId>:<anchor>", "grommet:<id>", "fp-header"… */
  anchors: new Map<string, Object3D>(),
};

export function setCameraControlsEnabled(enabled: boolean): void {
  if (runtime.controls) runtime.controls.enabled = enabled;
}

export function worldOf(map: Map<string, Object3D>, id: string): [number, number, number] | null {
  const o = map.get(id);
  if (!o) return null;
  const v = o.getWorldPosition(o.position.clone());
  return [v.x, v.y, v.z];
}

/** World position and quaternion of a registered object, written into the given targets. */
export function worldPose(map: Map<string, Object3D>, id: string, pos: Vector3, quat: Quaternion): boolean {
  const o = map.get(id);
  if (!o) return false;
  o.updateWorldMatrix(true, false);
  o.getWorldPosition(pos);
  o.getWorldQuaternion(quat);
  return true;
}

export function register(map: Map<string, Object3D>, id: string, obj: Object3D | null): () => void {
  if (obj) map.set(id, obj);
  return () => {
    if (map.get(id) === obj) map.delete(id);
  };
}
