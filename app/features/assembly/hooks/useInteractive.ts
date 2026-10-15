import type { ThreeEvent } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { useCallback, useRef, useState } from "react";
import { DRAG_THRESHOLD_PX, TAP_MAX_MS } from "../constants/timings";
import { readAssembly } from "../store/assemblyStore";
import type { Anchor, HoldDefinition } from "../types/assemblyTypes";
import { setCameraControlsEnabled } from "../utils/interactionRuntime";

interface InteractiveOptions {
  id: string;
  label: () => string;
  enabled?: boolean;
  /** Where the screwdriver tip should lock on while hovering. */
  anchor?: () => Anchor | null;
  /**
   * Return a hold definition to start a hold, null to treat the press as a tap,
   * or "handled" when the press was answered already (e.g. a wrong-bit message).
   */
  getHold?: () => HoldDefinition | null | "handled";
  onTap?: () => void;
}

/**
 * One gesture model for every interactive object in the scene:
 * tap = pick / toggle, hold = press / turn, drag on empty space = camera.
 * While a part is in hand, any tap tries to place it first.
 */
export function useInteractive({ id, label, enabled = true, anchor, getHold, onTap }: InteractiveOptions) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && enabled, "pointer", "auto");
  const press = useRef<{ x: number; y: number; t: number; moved: boolean; holding: boolean; consumed: boolean } | null>(
    null,
  );

  const finish = useCallback(
    (_e: PointerEvent, cancelled: boolean) => {
      const p = press.current;
      press.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      setCameraControlsEnabled(true);
      if (!p || cancelled) {
        readAssembly().releaseHold();
        return;
      }
      const quick = performance.now() - p.t < TAP_MAX_MS && !p.moved;
      if (p.holding) {
        const released = readAssembly().releaseHold();
        // A quick press on a holdable thing still means "tap" (e.g. pick the RAM back up).
        if (released && quick) onTap?.();
        return;
      }
      if (p.moved || p.consumed) return;
      const s = readAssembly();
      if (s.held && s.snap) {
        s.placeHeld();
        return;
      }
      onTap?.();
    },
    [onTap],
  );

  // Window listeners need stable identities that read the latest `finish`.
  const finishRef = useRef(finish);
  finishRef.current = finish;
  const onMove = useRef((e: PointerEvent) => {
    const p = press.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > DRAG_THRESHOLD_PX * 3) p.moved = true;
  }).current;
  const onUp = useRef((e: PointerEvent) => finishRef.current(e, false)).current;
  const onCancel = useRef((e: PointerEvent) => finishRef.current(e, true)).current;

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (!enabled) return;
      e.stopPropagation();
      setHovered(true);
      readAssembly().setHover({ id, label: label(), anchor: anchor?.() ?? null });
    },
    onPointerOut: () => {
      setHovered(false);
      const s = readAssembly();
      if (s.hover?.id === id) s.setHover(null);
    },
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      if (!enabled || !e.nativeEvent.isPrimary) return;
      if (e.nativeEvent.pointerType === "mouse" && e.nativeEvent.button !== 0) return;
      e.stopPropagation();
      setCameraControlsEnabled(false);
      // Touch has no hover, so refresh the label/anchor on press.
      readAssembly().setHover({ id, label: label(), anchor: anchor?.() ?? null });
      press.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, t: performance.now(), moved: false, holding: false, consumed: false };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      const s = readAssembly();
      if (s.held && s.snap) return; // a placement tap, handled on release
      const def = getHold?.();
      if (def === "handled") {
        press.current.consumed = true;
      } else if (def) {
        press.current.holding = true;
        s.startHold(def);
      }
    },
  };

  // No handlers at all while disabled, so the object stops catching rays
  // (lets taps fall through to whatever is behind it, or to onPointerMissed).
  return { hovered: hovered && enabled, handlers: enabled ? handlers : {} };
}
