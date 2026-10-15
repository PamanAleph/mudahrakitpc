/** A press shorter than this counts as a tap, not an aborted hold. */
export const TAP_MAX_MS = 220;
/** Pointer travel (px) after which a press is treated as a camera drag. */
export const DRAG_THRESHOLD_PX = 6;
/** Hold time per screw when driving a set (ms); a 9-screw board takes ~4 s. */
export const MS_PER_SCREW = 480;
/** Hold time to press a part home (ms). */
export const PRESS_MS = { ram: 900, m2: 700 } as const;
