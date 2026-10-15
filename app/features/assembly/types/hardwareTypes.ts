import type { z } from "zod";
import type {
  bitIdSchema,
  caseSpecSchema,
  fastenerSpecSchema,
  motherboardSpecSchema,
  ramSpecSchema,
  slotIdSchema,
  ssdSpecSchema,
} from "../validation/hardwareSchema";

export type BitId = z.infer<typeof bitIdSchema>;
export type SlotId = z.infer<typeof slotIdSchema>;
export type CaseSpec = z.infer<typeof caseSpecSchema>;
export type MotherboardSpec = z.infer<typeof motherboardSpecSchema>;
export type RamSpec = z.infer<typeof ramSpecSchema>;
export type SsdSpec = z.infer<typeof ssdSpecSchema>;
export type FastenerSpec = z.infer<typeof fastenerSpecSchema>;
export type ScrewSpec = FastenerSpec["screws"][number];
export type BitSpec = FastenerSpec["bits"][number];
