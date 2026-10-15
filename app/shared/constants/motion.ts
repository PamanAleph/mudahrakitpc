import type { SpringConfig } from "@shared/utils/spring";

/**
 * Motion constants for the 3D layer. CSS motion lives in tokens.css
 * (--motion-*); these are the per-frame equivalents. Keep the set small.
 */
export const SPRING = {
  /** Snappy with a visible overshoot: latches, clicks, pressed parts. */
  click: { stiffness: 520, damping: 18 } satisfies SpringConfig,
  /** Soft settle with a light bounce: parts landing in place. */
  settle: { stiffness: 180, damping: 17 } satisfies SpringConfig,
} as const;

/** Smooth times (seconds) for maath damping. Smaller = tighter. */
export const DAMP = {
  follow: 0.07,
  place: 0.14,
  rotate: 0.12,
  camera: 0.35,
} as const;

/** Durations in ms, mirrored from --motion-duration-* for JS timers. */
export const DURATION = {
  fast: 160,
  base: 240,
  slow: 480,
} as const;
