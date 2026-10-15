import { z } from "zod";

/** Every data entry says where its facts come from, or admits it doesn't know yet. */
const sourceSchema = z.object({
  document: z.string().min(1),
  page: z.string().optional(),
  note: z.string().optional(),
});

const entryMeta = { verified: z.boolean(), source: sourceSchema };

export const bitIdSchema = z.enum(["PH0", "PH1", "PH2"]);
export const slotIdSchema = z.enum(["A1", "A2", "B1", "B2"]);

export const caseSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  supportedFormFactors: z.array(z.string()).min(1),
  dimensionsCm: z.object({ length: z.number().positive(), depth: z.number().positive(), width: z.number().positive() }),
  sidePanel: z.object({
    material: z.enum(["tempered-glass", "steel"]),
    screwCount: z.number().int().positive(),
    screwId: z.string(),
  }),
  ...entryMeta,
});

export const motherboardSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  formFactor: z.string(),
  sizeCm: z.object({ length: z.number().positive(), width: z.number().positive() }),
  cpuSocket: z.string(),
  ramType: z.enum(["DDR4", "DDR5"]),
  ramSlots: z.array(z.object({ id: slotIdSchema, channel: z.enum(["A", "B"]) })).length(4),
  ramSlotLatch: z.enum(["single-side", "double-side"]),
  recommendedSingleDimmSlot: slotIdSchema,
  m2Slots: z.array(
    z.object({
      id: z.string(),
      key: z.enum(["M", "B", "B+M"]),
      supportedLengths: z.array(z.number().int()),
      screwId: z.string(),
    }),
  ),
  ...entryMeta,
});

export const ramSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["DDR4", "DDR5"]),
  formFactor: z.literal("DIMM"),
  pins: z.number().int().positive(),
  sizeMm: z.object({ length: z.number().positive(), height: z.number().positive() }),
  notchOffsetMm: z.number(),
  ...entryMeta,
});

export const ssdSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  formFactor: z.string(),
  key: z.enum(["M", "B", "B+M"]),
  sizeMm: z.object({ width: z.number().positive(), length: z.number().positive() }),
  insertAngleDeg: z.number().positive().max(45),
  ...entryMeta,
});

export const fastenerSpecSchema = z.object({
  bits: z.array(z.object({ id: bitIdSchema, label: z.string(), order: z.number().int() })).min(1),
  screws: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      thread: z.string(),
      head: z.enum(["thumbscrew-phillips", "pan-phillips"]),
      bit: bitIdSchema,
      turnsToRemove: z.number().positive(),
    }),
  ),
  ...entryMeta,
});
