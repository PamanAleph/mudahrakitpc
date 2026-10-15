/** How long each hold-to-act gesture takes (ms). Tuned for touch as well as mouse. */
export const HOLD_MS = {
  panelScrew: 1400,
  ramPress: 900,
  ssdPress: 700,
  m2Screw: 1200,
} as const;

/** A press shorter than this counts as a tap, not an aborted hold. */
export const TAP_MAX_MS = 220;
/** Pointer travel (px) after which a press is treated as a camera drag. */
export const DRAG_THRESHOLD_PX = 6;
/** Total time of the panel lift-and-set-aside animation (ms). */
export const PANEL_REMOVE_MS = 1500;
/** Screw flight from the case to the bowl (ms). */
export const SCREW_FLIGHT_MS = 700;
