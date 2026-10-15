import type { Object3D } from "three";
import type { BitId, ResolvedBuild } from "@shared/hardware";
import type { MessageKey } from "../constants/messages";

export type { BitId };

/* ---------- Tools and modes ---------- */
export type ToolId = "hand" | BitId | "paste";
export type Mode = "guided" | "free";
export type PasteAmount = "none" | "sedikit" | "pas" | "banyak";
export type PhaseId = "prep" | "bench" | "case" | "major" | "cables" | "power";

/* ---------- Parts ---------- */
export type PartKind = "board" | "cpu" | "cooler" | "ram" | "m2" | "drive" | "gpu" | "psu" | "fan" | "panel";
export type PartLocation = "tray" | "held" | "mounted";

/** A physical thing on the bench, derived from the build (one per RAM stick, drive, fan…). */
export interface PartInstance {
  id: string;
  kind: PartKind;
  /** Catalog id of the spec (null for the side panel). */
  specId: string | null;
  label: string;
  /** Index among parts of the same kind (ram-0, ram-1…). */
  index: number;
}

export interface PartState {
  location: PartLocation;
  mount: string | null;
  /** Number of 180° turns applied before placing (notch, triangle, airflow…). */
  flips: number;
  /** Screws on this part: 0..1 progress of the whole set. */
  fastened: number;
  /** Sub-state while mounted: RAM inserted→seated, M.2 angled→flat. */
  stage: "inserted" | "seated" | "angled" | "flat" | null;
}

/* ---------- Cables ---------- */
export type EndId = "a" | "b";

export interface CableEndSpec {
  /** Fixed to a part (PSU, cooler fan, case front panel…) or free for the user to plug. */
  fixedTo?: { partId: string; anchor: string };
  /** For free ends: which port kinds this plug is (connector dictionary id). */
  plugKind: string;
}

export interface CableSpec {
  id: string;
  label: string;
  /** Visual thickness class. */
  gauge: "bundle" | "thick" | "thin" | "ribbon" | "hair";
  color: "black" | "red" | "grey";
  ends: Record<EndId, CableEndSpec>;
  /** Where each free end must be plugged. A portId ending in "*" matches any port with that prefix. */
  targets: Array<{ end: EndId; portId: string; portKind: string }>;
  /** Optional cables don't block completion (e.g. USB-C when the board has no header). */
  required: boolean;
  /** Only usable once this part is mounted (modular PSU cables, fan cables…). */
  availableWhen?: string;
}

export interface CableEndState {
  state: "loose" | "held" | "plugged";
  portId: string | null;
  flips: number;
}

export interface CableState {
  ends: Record<EndId, CableEndState>;
  via: string[];
}

/* ---------- Front panel ---------- */
export type FrontPanelPlugId = "PWR_SW" | "RESET_SW" | "PLED+" | "PLED-" | "HDLED+" | "HDLED-";

/* ---------- Feedback ---------- */
export type FeedbackTone = "info" | "success" | "danger";

export interface Feedback {
  id: number;
  tone: FeedbackTone;
  title: string;
  body: string;
}

export interface Anchor {
  object: Object3D;
  offset: [number, number, number];
}

export interface HoverInfo {
  id: string;
  label: string;
  anchor: Anchor | null;
}

export interface SnapTarget {
  /** Mount id for parts, port id for cables. */
  id: string;
  valid: boolean;
  /** Why not, when invalid. */
  reason: RuleResult | null;
}

export interface HoldDefinition {
  id: string;
  durationMs: number;
  initialProgress?: number;
  anchor?: Anchor;
  onProgress?: (progress: number) => void;
  onComplete: () => void;
  onCancel?: (progress: number) => void;
}

export interface ActiveHold {
  id: string;
  progress: number;
  durationMs: number;
  anchor: Anchor | null;
}

export interface Pulse {
  id: number;
  tone: FeedbackTone;
  position: [number, number, number];
  createdAt: number;
}

export type RuleResult = { ok: true } | { ok: false; key: MessageKey; params?: Record<string, string | number> };

/* ---------- Power-on ---------- */
export type DebugLed = "CPU" | "DRAM" | "VGA" | "BOOT";

export interface PostFinding {
  severity: "fatal" | "warn" | "note";
  key: MessageKey;
  params?: Record<string, string | number>;
}

export interface PostResult {
  /** Did the PSU start (fans spin)? */
  powered: boolean;
  /** Reached the firmware screen. */
  booted: boolean;
  led: DebugLed | null;
  findings: PostFinding[];
  at: number;
}

/* ---------- Tasks ---------- */
export interface TaskDefinition {
  id: string;
  phase: PhaseId;
  title: string;
  hint: string;
  view: ViewId;
  isDone: (s: AssemblySnapshot) => boolean;
}

export type ViewId = "overview" | "bench" | "socket" | "caseInside" | "caseLower" | "rear" | "frontPanel" | "power" | "monitor";

/** The physical state of the bench: everything rules, tasks and power-on read. */
export interface AssemblySnapshot {
  build: ResolvedBuild;
  parts: Record<string, PartState>;
  cables: Record<string, CableState>;
  tool: ToolId;
  held: { kind: "part"; id: string } | { kind: "cable"; id: string; end: EndId } | null;
  strap: boolean;
  lever: "closed" | "open";
  paste: PasteAmount;
  plasticPeeled: boolean;
  latches: Record<string, boolean>;
  slotCovers: Record<number, boolean>;
  standoffs: Record<string, boolean>;
  frontPanel: Partial<Record<FrontPanelPlugId, number[]>>;
  psuSwitch: boolean;
  post: PostResult | null;
  mistakes: number;
  startedAt: number;
}
