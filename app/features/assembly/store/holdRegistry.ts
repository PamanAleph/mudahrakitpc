import type { HoldDefinition } from "../types/assemblyTypes";

/**
 * Callbacks for the active hold gesture. Kept outside the store because
 * functions and Three.js objects don't belong in serialisable state.
 */
export const holdRegistry = new Map<string, HoldDefinition>();
