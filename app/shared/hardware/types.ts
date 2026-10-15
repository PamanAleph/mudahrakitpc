import type { z } from "zod";
import type {
  bitIdSchema,
  boardSchema,
  caseSchema,
  connectorSchema,
  coolerSchema,
  cpuSchema,
  fanSchema,
  fastenerSchema,
  formFactorSchema,
  goalSchema,
  gpuSchema,
  psuSchema,
  ramSchema,
  ramTypeSchema,
  socketSchema,
  storageSchema,
} from "./schema";

export type Goal = z.infer<typeof goalSchema>;
export type Socket = z.infer<typeof socketSchema>;
export type RamType = z.infer<typeof ramTypeSchema>;
export type FormFactor = z.infer<typeof formFactorSchema>;
export type BitId = z.infer<typeof bitIdSchema>;
export type ConnectorSpec = z.infer<typeof connectorSchema>;
export type CaseSpec = z.infer<typeof caseSchema>;
export type BoardSpec = z.infer<typeof boardSchema>;
export type CpuSpec = z.infer<typeof cpuSchema>;
export type CoolerSpec = z.infer<typeof coolerSchema>;
export type RamSpec = z.infer<typeof ramSchema>;
export type GpuSpec = z.infer<typeof gpuSchema>;
export type StorageSpec = z.infer<typeof storageSchema>;
export type PsuSpec = z.infer<typeof psuSchema>;
export type FanSpec = z.infer<typeof fanSchema>;
export type FastenerSpec = z.infer<typeof fastenerSchema>;
export type ScrewSpec = FastenerSpec["screws"][number];
export type BitSpec = FastenerSpec["bits"][number];

export type CategoryId = "case" | "board" | "cpu" | "cooler" | "ram" | "gpu" | "storage" | "psu" | "fan";

export interface CatalogItemMap {
  case: CaseSpec;
  board: BoardSpec;
  cpu: CpuSpec;
  cooler: CoolerSpec;
  ram: RamSpec;
  gpu: GpuSpec;
  storage: StorageSpec;
  psu: PsuSpec;
  fan: FanSpec;
}

export type AnyPart = CatalogItemMap[CategoryId];

/** What the user bought. Ids point into the catalog. */
export interface Build {
  caseId: string | null;
  boardId: string | null;
  cpuId: string | null;
  coolerId: string | null;
  ramId: string | null;
  gpuId: string | null;
  storageIds: string[];
  psuId: string | null;
  fanId: string | null;
  fanCount: number;
}

/** A build with every required part chosen and resolved to its spec. */
export interface ResolvedBuild {
  case: CaseSpec;
  board: BoardSpec;
  cpu: CpuSpec;
  cooler: CoolerSpec;
  ram: RamSpec;
  gpu: GpuSpec | null;
  storage: StorageSpec[];
  psu: PsuSpec;
  fan: FanSpec | null;
  fanCount: number;
}
