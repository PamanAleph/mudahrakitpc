import type { z } from "zod";
import connectorsJson from "./data/connectors.json";
import fastenersJson from "./data/fasteners.json";
import boardsJson from "./data/catalog/boards.json";
import casesJson from "./data/catalog/cases.json";
import coolersJson from "./data/catalog/coolers.json";
import cpusJson from "./data/catalog/cpus.json";
import fansJson from "./data/catalog/fans.json";
import gpusJson from "./data/catalog/gpus.json";
import psusJson from "./data/catalog/psus.json";
import ramsJson from "./data/catalog/rams.json";
import storageJson from "./data/catalog/storage.json";
import {
  boardSchema,
  caseSchema,
  connectorSchema,
  coolerSchema,
  cpuSchema,
  fanSchema,
  fastenerSchema,
  gpuSchema,
  listOf,
  psuSchema,
  ramSchema,
  storageSchema,
} from "./schema";
import type { CatalogItemMap, CategoryId, ConnectorSpec, ScrewSpec } from "./types";

function parse<T extends z.ZodTypeAny>(schema: T, data: unknown, file: string): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw new Error(`Data hardware tidak valid di ${file}: ${result.error.message}`);
  return result.data;
}

/** Single source of truth for hardware facts, parsed once at import. */
export const CATALOG: { [K in CategoryId]: CatalogItemMap[K][] } = {
  case: parse(listOf(caseSchema), casesJson, "catalog/cases.json").items,
  board: parse(listOf(boardSchema), boardsJson, "catalog/boards.json").items,
  cpu: parse(listOf(cpuSchema), cpusJson, "catalog/cpus.json").items,
  cooler: parse(listOf(coolerSchema), coolersJson, "catalog/coolers.json").items,
  ram: parse(listOf(ramSchema), ramsJson, "catalog/rams.json").items,
  gpu: parse(listOf(gpuSchema), gpusJson, "catalog/gpus.json").items,
  storage: parse(listOf(storageSchema), storageJson, "catalog/storage.json").items,
  psu: parse(listOf(psuSchema), psusJson, "catalog/psus.json").items,
  fan: parse(listOf(fanSchema), fansJson, "catalog/fans.json").items,
};

export const CONNECTORS: ConnectorSpec[] = parse(
  connectorSchema.array(),
  (connectorsJson as { connectors: unknown }).connectors,
  "connectors.json",
);
export const FASTENERS = parse(fastenerSchema, fastenersJson, "fasteners.json");

export function getPart<K extends CategoryId>(category: K, id: string | null | undefined): CatalogItemMap[K] | null {
  if (!id) return null;
  return (CATALOG[category] as CatalogItemMap[K][]).find((p) => p.id === id) ?? null;
}

export function getConnector(id: string): ConnectorSpec {
  const c = CONNECTORS.find((x) => x.id === id);
  if (!c) throw new Error(`Konektor "${id}" tidak ada di connectors.json`);
  return c;
}

export function getScrew(id: string): ScrewSpec {
  const s = FASTENERS.screws.find((x) => x.id === id);
  if (!s) throw new Error(`Baut "${id}" tidak ada di fasteners.json`);
  return s;
}

/** Can a plug of `plugKind` mate with a port of `portKind`? Read from the connector dictionary. */
export function connectorAccepts(portKind: string, plugKind: string): boolean {
  return getConnector(portKind).accepts.includes(plugKind);
}

/** Integrity checks that zod can't express (cross-references). Throws in dev on bad data. */
function checkReferences() {
  const ids = new Set(CONNECTORS.map((c) => c.id));
  for (const c of CONNECTORS) {
    for (const a of c.accepts) if (!ids.has(a)) throw new Error(`connectors.json: ${c.id} menerima "${a}" yang tidak terdaftar`);
    const slots = c.layout.rows * c.layout.cols;
    if (c.pins + c.missingPins.length > slots) throw new Error(`connectors.json: ${c.id} punya lebih banyak pin dari susunannya`);
  }
  for (const k of ["fan-3pin", "fan-4pin", "pcie-8", "12v-2x6", "eps-8", "atx-24", "sata-power", "sata-data"]) {
    if (!ids.has(k)) throw new Error(`connectors.json: konektor wajib "${k}" belum ada`);
  }
  for (const c of CATALOG.case) getScrew(c.panelScrewId);
}
checkReferences();

export const HAS_UNVERIFIED_DATA =
  CONNECTORS.some((c) => !c.verified) ||
  !FASTENERS.verified ||
  (Object.values(CATALOG) as Array<Array<{ verified: boolean }>>).some((list) => list.some((p) => !p.verified));
