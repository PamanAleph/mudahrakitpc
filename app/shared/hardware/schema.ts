import { z } from "zod";

/** Every entry says where its facts come from, or admits it doesn't know yet. */
export const sourceSchema = z.object({
  document: z.string().min(1),
  url: z.string().url().optional(),
  page: z.string().optional(),
  note: z.string().optional(),
});

const meta = {
  verified: z.boolean(),
  source: sourceSchema,
};

export const goalSchema = z.enum(["office", "gaming", "editing"]);
export const socketSchema = z.enum(["LGA1700", "LGA1851", "AM4", "AM5"]);
export const ramTypeSchema = z.enum(["DDR4", "DDR5"]);
export const formFactorSchema = z.enum(["ATX", "Micro-ATX", "Mini-ITX"]);
export const bitIdSchema = z.enum(["PH0", "PH1", "PH2"]);
export const fanConnectorSchema = z.enum(["fan-3pin", "fan-4pin"]);

export const connectorSchema = z.object({
  id: z.string(),
  name: z.string(),
  pins: z.number().int().positive(),
  layout: z.object({ rows: z.number().int().positive(), cols: z.number().int().positive() }),
  missingPins: z.array(z.number().int().positive()),
  role: z.enum(["power", "data", "slot", "header"]),
  function: z.string(),
  powerW: z.number().positive().optional(),
  accepts: z.array(z.string()).min(1),
  ...meta,
});

const item = {
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  powerW: z.number().nonnegative(),
  goals: z.array(goalSchema),
  ...meta,
};

export const caseSchema = z.object({
  ...item,
  formFactors: z.array(formFactorSchema).min(1),
  dimensionsCm: z.object({ length: z.number().positive(), depth: z.number().positive(), width: z.number().positive() }),
  psuFormFactor: z.enum(["ATX", "SFX"]),
  expansionSlots: z.number().int().positive(),
  gpuMaxLengthCm: z.number().positive(),
  coolerMaxHeightCm: z.number().positive(),
  fanMounts: z.array(
    z.object({
      id: z.string(),
      side: z.enum(["front", "rear", "top"]),
      sizes: z.array(z.union([z.literal(120), z.literal(140)])).min(1),
      u: z.number(),
      v: z.number(),
    }),
  ),
  driveBays: z.array(z.object({ id: z.string(), kind: z.enum(["2.5", "3.5"]), x: z.number(), z: z.number() })),
  boardAnchor: z.object({ x: z.number(), z: z.number() }),
  grommets: z.array(z.object({ id: z.string(), x: z.number(), z: z.number() })),
  frontIO: z.object({ usb3: z.boolean(), usbc: z.boolean(), audio: z.boolean() }),
  panelScrewId: z.string(),
});

export const boardSchema = z.object({
  ...item,
  formFactor: formFactorSchema,
  socket: socketSchema,
  ramType: ramTypeSchema,
  ramSlots: z.array(z.object({ id: z.string(), channel: z.enum(["A", "B"]) })).min(1),
  recommendedRamSlots: z.record(z.string(), z.array(z.string())),
  pcieSlots: z.array(z.object({ id: z.string(), kind: z.enum(["pcie-x16", "pcie-x1"]), lanes: z.number().int().positive() })).min(1),
  m2Slots: z.array(
    z.object({
      id: z.string(),
      key: z.enum(["M", "B"]),
      interfaces: z.array(z.enum(["pcie", "sata"])).min(1),
      lengths: z.array(z.number().int()),
      disablesSata: z.array(z.string()),
    }),
  ),
  sataPorts: z.array(z.string()),
  headers: z.object({
    eps: z.number().int().min(1),
    cpuFan: z.number().int().min(1),
    sysFan: z.number().int().min(0),
    frontPanel: z.literal("fp-intel"),
    usb3: z.number().int().min(0),
    usbc: z.number().int().min(0),
    usb2: z.number().int().min(0),
    audio: z.number().int().min(0),
  }),
  integratedIoShield: z.boolean(),
  debugLeds: z.boolean(),
});

export const cpuSchema = z.object({
  ...item,
  socket: socketSchema,
  packageMm: z.object({ width: z.number().positive(), length: z.number().positive() }),
  contacts: z.enum(["socket", "cpu"]),
  integratedGraphics: z.boolean(),
});

export const coolerSchema = z.object({
  ...item,
  type: z.enum(["tower", "low-profile", "stock"]),
  heightCm: z.number().positive(),
  sockets: z.array(socketSchema).min(1),
  fanSizeMm: z.number().int().positive(),
  fanConnector: fanConnectorSchema,
  prePasted: z.boolean(),
  ramClearanceCm: z.number().positive(),
});

export const ramSchema = z.object({
  ...item,
  type: ramTypeSchema,
  sticks: z.number().int().min(1).max(4),
  capacityGbPerStick: z.number().int().positive(),
  heightCm: z.number().positive(),
});

export const gpuSchema = z.object({
  ...item,
  lengthCm: z.number().positive(),
  slots: z.number().int().min(1).max(4),
  powerConnectors: z.array(z.object({ kind: z.enum(["pcie-6", "pcie-8", "12v-2x6"]), count: z.number().int().min(1) })),
});

export const storageSchema = z.object({
  ...item,
  kind: z.enum(["m2", "2.5", "3.5"]),
  interface: z.enum(["nvme", "sata"]),
  m2Key: z.enum(["M", "B+M"]).optional(),
  m2Length: z.number().int().optional(),
  hybrid: z.boolean(),
});

export const psuSchema = z.object({
  ...item,
  formFactor: z.enum(["ATX", "SFX"]),
  watt: z.number().int().positive(),
  modular: z.enum(["none", "semi", "full"]),
  atxVersion: z.string(),
  outputs: z.object({
    atx24: z.number().int().min(1),
    eps: z.number().int().min(0),
    pcie8: z.number().int().min(0),
    "12v2x6": z.number().int().min(0),
    sataPower: z.number().int().min(0),
    molex: z.number().int().min(0),
  }),
});

export const fanSchema = z.object({
  ...item,
  sizeMm: z.union([z.literal(120), z.literal(140)]),
  connector: fanConnectorSchema,
});

export const fastenerSchema = z.object({
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
  ...meta,
});

export const listOf = <T extends z.ZodTypeAny>(schema: T) => z.object({ note: z.string().optional(), items: z.array(schema).min(1) });
