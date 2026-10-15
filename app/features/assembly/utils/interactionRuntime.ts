import { Vector3 } from "three";

/**
 * Mutable, per-frame bridges between scene objects. Not React state on
 * purpose: these change every frame and nothing should re-render for them.
 */
interface ControlsLike {
  enabled: boolean;
}

export const runtime = {
  controls: null as ControlsLike | null,
  /** World position of the screwdriver tip, written by ScrewdriverRig each frame. */
  toolTip: new Vector3(),
};

export function setCameraControlsEnabled(enabled: boolean): void {
  if (runtime.controls) runtime.controls.enabled = enabled;
}
