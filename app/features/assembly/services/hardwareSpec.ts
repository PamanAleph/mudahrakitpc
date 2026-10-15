import type { z } from "zod";
import caseJson from "../data/case.json";
import fastenersJson from "../data/fasteners.json";
import motherboardJson from "../data/motherboard.json";
import ramJson from "../data/ram.json";
import ssdJson from "../data/ssd.json";
import {
  caseSpecSchema,
  fastenerSpecSchema,
  motherboardSpecSchema,
  ramSpecSchema,
  ssdSpecSchema,
} from "../validation/hardwareSchema";
import type { ScrewSpec } from "../types/hardwareTypes";

function parse<T extends z.ZodTypeAny>(schema: T, data: unknown, file: string): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Data hardware tidak valid di ${file}: ${result.error.message}`);
  }
  return result.data;
}

/** Single source of truth for hardware facts. Parsed once, at import. */
export const HARDWARE = {
  case: parse(caseSpecSchema, caseJson, "data/case.json"),
  motherboard: parse(motherboardSpecSchema, motherboardJson, "data/motherboard.json"),
  ram: parse(ramSpecSchema, ramJson, "data/ram.json"),
  ssd: parse(ssdSpecSchema, ssdJson, "data/ssd.json"),
  fasteners: parse(fastenerSpecSchema, fastenersJson, "data/fasteners.json"),
};

export function getScrew(id: string): ScrewSpec {
  const screw = HARDWARE.fasteners.screws.find((s) => s.id === id);
  if (!screw) throw new Error(`Baut "${id}" tidak ada di data/fasteners.json`);
  return screw;
}

export const PANEL_SCREW = getScrew(HARDWARE.case.sidePanel.screwId);
export const M2_SCREW = getScrew(HARDWARE.motherboard.m2Slots[0]?.screwId ?? "m2-screw");

/** True when any hardware entry still lacks a confirmed source. Surfaced in the HUD. */
export const HAS_UNVERIFIED_DATA = [
  HARDWARE.case,
  HARDWARE.motherboard,
  HARDWARE.ram,
  HARDWARE.ssd,
  HARDWARE.fasteners,
].some((entry) => !entry.verified);
