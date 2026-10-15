import { create } from "zustand";
import { formatMessage, type MessageKey } from "../constants/messages";
import { M2_STANDOFF, ramSlotWorld } from "../constants/sceneLayout";
import { canDriveM2Screw } from "../rules/m2Rules";
import { checkBitFits } from "../rules/fastenerRules";
import { canRemovePanel } from "../rules/panelRules";
import { canInsertRam } from "../rules/ramRules";
import { HARDWARE, M2_SCREW, PANEL_SCREW } from "../services/hardwareSpec";
import type {
  ActiveHold,
  Feedback,
  FeedbackTone,
  HeldItem,
  HoldDefinition,
  HoverInfo,
  M2ScrewState,
  PanelScrewId,
  PanelScrewState,
  PanelState,
  Pulse,
  RamState,
  RuleResult,
  SlotId,
  SnapTarget,
  SsdState,
  ToolId,
  ViewId,
} from "../types/assemblyTypes";
import { holdRegistry } from "./holdRegistry";

type Vec3 = [number, number, number];

/** The physical state of the bench: everything the rules and steps look at. */
export interface AssemblySnapshot {
  tool: ToolId;
  held: HeldItem | null;
  panel: PanelState;
  panelRemovedAt: number;
  panelScrews: Record<PanelScrewId, PanelScrewState>;
  latches: Record<SlotId, boolean>;
  ram: { state: RamState; slot: SlotId | null; flips: number };
  ssd: SsdState;
  m2Screw: M2ScrewState;
  mistakes: number;
}

interface AssemblyState extends AssemblySnapshot {
  snap: SnapTarget | null;
  hold: ActiveHold | null;
  hover: HoverInfo | null;
  feedback: Feedback | null;
  pulses: Pulse[];
  shakes: Record<string, number>;
  view: ViewId;
  /** Bumped to re-apply the same view (e.g. "Fokus" pressed twice). */
  viewNonce: number;

  selectTool: (tool: ToolId) => void;
  notify: (key: MessageKey, params?: Record<string, string | number>) => void;
  report: (result: RuleResult, shakeId?: string) => boolean;
  pulse: (tone: FeedbackTone, position: Vec3) => void;
  removePulse: (id: number) => void;
  setHover: (hover: HoverInfo | null) => void;
  setSnap: (snap: SnapTarget | null) => void;
  setView: (view: ViewId) => void;

  startHold: (def: HoldDefinition) => void;
  tickHold: (dtSeconds: number) => void;
  releaseHold: () => { id: string; progress: number } | null;

  beginPanelScrew: () => boolean;
  setPanelScrewProgress: (id: PanelScrewId, progress: number) => void;
  completePanelScrew: (id: PanelScrewId, from: Vec3) => void;
  removePanel: () => void;

  pickRam: () => void;
  pickSsd: () => void;
  dropHeld: () => void;
  rotateHeld: () => void;
  placeHeld: () => boolean;

  toggleLatch: (slot: SlotId) => void;
  completeRamPress: () => void;
  completeSsdPress: () => void;

  pickM2Screw: () => void;
  beginM2Screw: () => boolean;
  completeM2Screw: () => void;

  reset: () => void;
}

const freshScrew = (): PanelScrewState => ({ progress: 0, removed: false, releasedFrom: null, removedAt: 0 });

const initialSnapshot = (): AssemblySnapshot => ({
  tool: "hand",
  held: null,
  panel: "attached",
  panelRemovedAt: 0,
  panelScrews: { tr: freshScrew(), tl: freshScrew(), br: freshScrew(), bl: freshScrew() },
  latches: { A1: false, A2: false, B1: false, B2: false },
  // Starts rotated 180° on purpose: lining up the notch is part of the lesson.
  ram: { state: "tray", slot: null, flips: 1 },
  ssd: "tray",
  m2Screw: "bowl",
  mistakes: 0,
});

let feedbackSeq = 0;
let pulseSeq = 0;

export const isRamFlipped = (flips: number) => flips % 2 === 1;

export const useAssemblyStore = create<AssemblyState>()((set, get) => ({
  ...initialSnapshot(),
  snap: null,
  hold: null,
  hover: null,
  feedback: null,
  pulses: [],
  shakes: {},
  view: "overview",
  viewNonce: 0,

  selectTool: (tool) => {
    const s = get();
    if (s.tool === tool) return;
    if (s.held) s.dropHeld();
    if (s.m2Screw === "onBit") {
      set({ m2Screw: "bowl" });
      s.notify("m2screw.dropped");
    }
    set({ tool });
  },

  notify: (key, params) => {
    const msg = formatMessage(key, params);
    set((s) => ({
      feedback: { id: ++feedbackSeq, ...msg },
      mistakes: msg.tone === "danger" ? s.mistakes + 1 : s.mistakes,
    }));
  },

  report: (result, shakeId) => {
    if (result.ok) return true;
    get().notify(result.key, result.params);
    if (shakeId) set((s) => ({ shakes: { ...s.shakes, [shakeId]: performance.now() } }));
    return false;
  },

  pulse: (tone, position) =>
    set((s) => ({ pulses: [...s.pulses, { id: ++pulseSeq, tone, position, createdAt: performance.now() }] })),
  removePulse: (id) => set((s) => ({ pulses: s.pulses.filter((p) => p.id !== id) })),
  setHover: (hover) => set({ hover }),
  setSnap: (snap) => {
    const cur = get().snap;
    const same =
      cur === snap ||
      (cur && snap && cur.kind === snap.kind && cur.valid === snap.valid && (cur.kind !== "ram" || (snap.kind === "ram" && cur.slot === snap.slot)));
    if (!same) set({ snap });
  },
  setView: (view) => set((s) => ({ view, viewNonce: s.viewNonce + 1 })),

  startHold: (def) => {
    holdRegistry.set(def.id, def);
    set({ hold: { id: def.id, progress: def.initialProgress ?? 0, durationMs: def.durationMs, anchor: def.anchor ?? null } });
  },
  tickHold: (dt) => {
    const hold = get().hold;
    if (!hold) return;
    const def = holdRegistry.get(hold.id);
    if (!def) {
      set({ hold: null });
      return;
    }
    const progress = Math.min(1, hold.progress + (dt * 1000) / hold.durationMs);
    def.onProgress?.(progress);
    if (progress >= 1) {
      holdRegistry.delete(hold.id);
      set({ hold: null });
      def.onComplete();
    } else {
      set({ hold: { ...hold, progress } });
    }
  },
  releaseHold: () => {
    const hold = get().hold;
    if (!hold) return null;
    const def = holdRegistry.get(hold.id);
    holdRegistry.delete(hold.id);
    set({ hold: null });
    def?.onCancel?.(hold.progress);
    return { id: hold.id, progress: hold.progress };
  },

  /* ---------- Side panel ---------- */
  beginPanelScrew: () => get().report(checkBitFits(PANEL_SCREW, get().tool, HARDWARE.fasteners.bits), "screwdriver"),
  setPanelScrewProgress: (id, progress) =>
    set((s) => ({ panelScrews: { ...s.panelScrews, [id]: { ...s.panelScrews[id], progress } } })),
  completePanelScrew: (id, from) => {
    set((s) => ({
      panelScrews: { ...s.panelScrews, [id]: { progress: 1, removed: true, releasedFrom: from, removedAt: performance.now() } },
    }));
    const left = Object.values(get().panelScrews).filter((p) => !p.removed).length;
    get().pulse("success", from);
    if (left === 0) get().notify("screw.allRemoved");
    else get().notify("screw.removed", { left });
  },
  removePanel: () => {
    const s = get();
    const left = Object.values(s.panelScrews).filter((p) => !p.removed).length;
    if (!s.report(canRemovePanel(left), "panel")) return;
    if (s.tool !== "hand") {
      s.notify("hands.toolInUse");
      return;
    }
    set({ panel: "removed", panelRemovedAt: performance.now() });
    s.notify("panel.removed");
  },

  /* ---------- Carrying parts ---------- */
  pickRam: () => {
    const s = get();
    if (s.tool !== "hand") return s.notify("hands.toolInUse");
    if (s.held) return s.notify("hands.full");
    if (s.ram.state === "seated") return s.notify("ram.alreadySeated");
    set({ held: "ram", hover: null, ram: { ...s.ram, state: "held", slot: null } });
    s.notify("ram.picked", { name: HARDWARE.ram.name, type: HARDWARE.ram.type, pins: HARDWARE.ram.pins });
  },
  pickSsd: () => {
    const s = get();
    if (s.tool !== "hand") return s.notify("hands.toolInUse");
    if (s.held) return s.notify("hands.full");
    set({ held: "ssd", hover: null, ssd: "held" });
    s.notify("ssd.picked", {
      name: HARDWARE.ssd.name,
      size: HARDWARE.ssd.formFactor,
      width: HARDWARE.ssd.sizeMm.width,
      length: HARDWARE.ssd.sizeMm.length,
      key: HARDWARE.ssd.key,
    });
  },
  dropHeld: () => {
    const s = get();
    if (s.held === "ram") set({ ram: { ...s.ram, state: "tray", slot: null } });
    if (s.held === "ssd") set({ ssd: "tray" });
    set({ held: null, snap: null });
  },
  rotateHeld: () => {
    const s = get();
    if (s.held !== "ram") return;
    set({ ram: { ...s.ram, flips: s.ram.flips + 1 } });
  },
  placeHeld: () => {
    const s = get();
    if (s.held === "ram") {
      if (!s.snap || s.snap.kind !== "ram") {
        s.notify("ram.aimAtSlot");
        return false;
      }
      const slot = s.snap.slot;
      const ok = s.report(
        canInsertRam({
          slot,
          latchOpen: s.latches[slot],
          flipped: isRamFlipped(s.ram.flips),
          ramType: HARDWARE.ram.type,
          slotType: HARDWARE.motherboard.ramType,
        }),
        "ram",
      );
      if (!ok) return false;
      const recommended = HARDWARE.motherboard.recommendedSingleDimmSlot;
      set({ held: null, snap: null, hover: null, ram: { ...s.ram, state: "inserted", slot } });
      s.notify("ram.inserted", {
        advice: slot === recommended ? "" : formatMessage("ram.slotAdvice", { recommended }).body,
      });
      return true;
    }
    if (s.held === "ssd") {
      if (!s.snap || s.snap.kind !== "m2") {
        s.notify("ssd.aimAtSlot");
        return false;
      }
      set({ held: null, snap: null, hover: null, ssd: "angled" });
      s.notify("ssd.angled", { angle: HARDWARE.ssd.insertAngleDeg });
      return true;
    }
    return false;
  },

  /* ---------- RAM ---------- */
  toggleLatch: (slot) => {
    const s = get();
    const open = s.latches[slot];
    if (!open) {
      if (s.ram.state === "seated" && s.ram.slot === slot) {
        set({ latches: { ...s.latches, [slot]: true }, ram: { ...s.ram, state: "inserted" } });
        s.notify("latch.openedEject", { slot });
      } else {
        set({ latches: { ...s.latches, [slot]: true } });
        s.notify("latch.opened", { slot });
      }
      return;
    }
    if (s.ram.state === "inserted" && s.ram.slot === slot) {
      s.notify("ram.pressNotLatch");
      return;
    }
    set({ latches: { ...s.latches, [slot]: false } });
    s.notify("latch.closed", { slot });
  },
  completeRamPress: () => {
    const s = get();
    const slot = s.ram.slot;
    if (!slot) return;
    set({ ram: { ...s.ram, state: "seated" }, latches: { ...s.latches, [slot]: false } });
    s.pulse("success", ramSlotWorld(slot));
    s.notify("ram.seated");
  },

  /* ---------- SSD ---------- */
  completeSsdPress: () => {
    set({ ssd: "flat" });
    get().pulse("success", [M2_STANDOFF[0], M2_STANDOFF[1] + 0.3, M2_STANDOFF[2]]);
    get().notify("ssd.flat");
  },
  pickM2Screw: () => {
    const s = get();
    if (s.tool === "hand") return s.notify("m2screw.tooSmall");
    if (!s.report(checkBitFits(M2_SCREW, s.tool, HARDWARE.fasteners.bits), "screwdriver")) return;
    set({ m2Screw: "onBit" });
    s.notify("m2screw.onBit", { screw: M2_SCREW.name, thread: M2_SCREW.thread });
  },
  beginM2Screw: () => {
    const s = get();
    if (!s.report(canDriveM2Screw(s.ssd, s.m2Screw))) return false;
    return s.report(checkBitFits(M2_SCREW, s.tool, HARDWARE.fasteners.bits), "screwdriver");
  },
  completeM2Screw: () => {
    set({ m2Screw: "installed", ssd: "secured" });
    get().pulse("success", [M2_STANDOFF[0], M2_STANDOFF[1] + 0.4, M2_STANDOFF[2]]);
    get().notify("ssd.secured");
  },

  reset: () => {
    holdRegistry.clear();
    set({ ...initialSnapshot(), snap: null, hold: null, hover: null, feedback: null, pulses: [], shakes: {}, view: "overview" });
    set((s) => ({ viewNonce: s.viewNonce + 1 }));
  },
}));

/** Non-reactive read for per-frame code (useFrame). */
export const readAssembly = () => useAssemblyStore.getState();

