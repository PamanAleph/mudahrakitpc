import type { Object3D } from "three";
import type { BitId, SlotId } from "./hardwareTypes";
import type { MessageKey } from "../constants/messages";

export type { BitId, SlotId };

export type ToolId = "hand" | BitId;
export type PanelScrewId = "tl" | "tr" | "bl" | "br";
export type HeldItem = "ram" | "ssd";
export type ViewId = "overview" | "bench" | "ram" | "m2";

export type PanelState = "attached" | "removed";
export type RamState = "tray" | "held" | "inserted" | "seated";
export type SsdState = "tray" | "held" | "angled" | "flat" | "secured";
export type M2ScrewState = "bowl" | "onBit" | "installed";

export interface PanelScrewState {
  /** 0..1 progress of unscrewing; kept when the hold is released early. */
  progress: number;
  removed: boolean;
  /** World position at the moment it came loose, for the fly-to-bowl arc. */
  releasedFrom: [number, number, number] | null;
  removedAt: number;
}

export type FeedbackTone = "info" | "success" | "danger";

export interface Feedback {
  id: number;
  tone: FeedbackTone;
  title: string;
  body: string;
}

/** A point the screwdriver tip can lock onto. */
export interface Anchor {
  object: Object3D;
  offset: [number, number, number];
}

export interface HoverInfo {
  id: string;
  label: string;
  anchor: Anchor | null;
}

export type SnapTarget = { kind: "ram"; slot: SlotId; valid: boolean } | { kind: "m2"; valid: boolean };

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
