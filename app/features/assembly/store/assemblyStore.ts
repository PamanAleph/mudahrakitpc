import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { FASTENERS, getScrew, type ResolvedBuild } from "@shared/hardware";
import { formatMessage, type MessageKey } from "../constants/messages";
import { caseGeometry, type CaseGeometry } from "../constants/layouts";
import { deriveCables, initialCableStates } from "../engine/cables";
import { FP_EXPECTED, FP_MISSING, FP_PLUGS, FP_EFFECT, pinsFor, sameSet } from "../engine/frontPanel";
import { derivePartInstances, fastenersFor, initialPartStates } from "../engine/parts";
import { derivePorts, type PortDef } from "../engine/ports";
import { evaluatePost } from "../engine/post";
import { boardInCase, cableAvailable, isMounted, panelOff, recommendedRamSlots } from "../engine/selectors";
import { currentTask, deriveTasks } from "../engine/tasks";
import { canPlug } from "../rules/cableRules";
import { checkBitFits } from "../rules/fastenerRules";
import { canPlace } from "../rules/placementRules";
import type {
  ActiveHold,
  AssemblySnapshot,
  CableSpec,
  EndId,
  Feedback,
  FeedbackTone,
  FrontPanelPlugId,
  HoldDefinition,
  HoverInfo,
  Mode,
  PartInstance,
  PasteAmount,
  Pulse,
  RuleResult,
  SnapTarget,
  TaskDefinition,
  ToolId,
  ViewId,
} from "../types/assemblyTypes";
import { runtime, worldOf } from "../utils/runtime";
import { holdRegistry } from "./holdRegistry";

type Vec3 = [number, number, number];
export type Overlay = "frontPanel" | "manual" | "result" | "paste" | null;

interface AssemblyState extends AssemblySnapshot {
  ready: boolean;
  mode: Mode;
  instances: PartInstance[];
  cableSpecs: CableSpec[];
  ports: PortDef[];
  tasks: TaskDefinition[];
  geometry: CaseGeometry;
  panelRemovedOnce: boolean;
  snap: SnapTarget | null;
  hold: ActiveHold | null;
  hover: HoverInfo | null;
  feedback: Feedback | null;
  pulses: Pulse[];
  shakes: Record<string, number>;
  view: ViewId;
  viewNonce: number;
  overlay: Overlay;
  fpSelected: FrontPanelPlugId | null;
  /** The animated "show me how" for the current task is playing. */
  demo: boolean;

  setDemo: (on: boolean) => void;
  init: (build: ResolvedBuild) => void;
  reset: () => void;
  setMode: (mode: Mode) => void;
  setOverlay: (o: Overlay) => void;
  selectTool: (tool: ToolId) => void;
  notify: (key: MessageKey, params?: Record<string, string | number>) => void;
  report: (result: RuleResult, shakeId?: string) => boolean;
  pulse: (tone: FeedbackTone, position: Vec3 | null) => void;
  removePulse: (id: number) => void;
  setHover: (hover: HoverInfo | null) => void;
  setSnap: (snap: SnapTarget | null) => void;
  setView: (view: ViewId) => void;

  startHold: (def: HoldDefinition) => void;
  tickHold: (dtSeconds: number) => void;
  releaseHold: () => { id: string; progress: number } | null;

  toggleStrap: () => void;
  toggleLever: () => void;
  applyPaste: (amount: Exclude<PasteAmount, "none">) => void;
  wipePaste: () => void;
  peelPlastic: () => void;
  toggleLatch: (slot: string) => void;
  toggleStandoff: (key: string) => void;
  toggleCover: (index: number) => void;
  togglePsuSwitch: () => void;

  pickPart: (partId: string) => void;
  dropHeld: () => void;
  rotateHeld: () => void;
  placeHeld: () => boolean;
  evaluatePlacement: (partId: string, mountId: string) => SnapTarget;
  completeRamPress: (partId: string) => void;
  completeM2Press: (partId: string) => void;
  fastenCheck: (partId: string) => RuleResult;
  fastenDirection: (partId: string) => 1 | -1;
  setFastenProgress: (partId: string, p: number) => void;
  completeFasten: (partId: string) => void;

  pickCableEnd: (cableId: string, end: EndId) => void;
  evaluatePlug: (portId: string) => SnapTarget | null;
  plugHeld: () => boolean;
  routeVia: (grommetId: string) => void;

  selectFpPlug: (plug: FrontPanelPlugId | null) => void;
  placeFrontPanel: (plug: FrontPanelPlugId, firstPin: number) => void;
  removeFrontPanel: (plug: FrontPanelPlugId) => void;

  pressPower: () => void;
}

let feedbackSeq = 0;
let pulseSeq = 0;
const ELECTRONIC: PartInstance["kind"][] = ["board", "cpu", "ram", "m2", "drive", "gpu", "cooler", "fan", "psu"];

const placeholderGeometry = {} as CaseGeometry;

export const useAssemblyStore = create<AssemblyState>()((set, get) => {
  const snap = (): AssemblySnapshot => get();
  const part = (id: string) => get().instances.find((p) => p.id === id);
  const patchPart = (id: string, patch: Partial<AssemblySnapshot["parts"][string]>) =>
    set((s) => ({ parts: { ...s.parts, [id]: { ...s.parts[id]!, ...patch } } }));
  const patchCableEnd = (cableId: string, end: EndId, patch: Partial<AssemblySnapshot["cables"][string]["ends"][EndId]>) =>
    set((s) => {
      const c = s.cables[cableId]!;
      return { cables: { ...s.cables, [cableId]: { ...c, ends: { ...c.ends, [end]: { ...c.ends[end], ...patch } } } } };
    });

  return {
    ready: false,
    mode: "guided",
    build: null as unknown as ResolvedBuild,
    instances: [],
    cableSpecs: [],
    ports: [],
    tasks: [],
    geometry: placeholderGeometry,
    parts: {},
    cables: {},
    tool: "hand",
    held: null,
    strap: false,
    lever: "closed",
    paste: "none",
    plasticPeeled: false,
    latches: {},
    slotCovers: {},
    standoffs: {},
    frontPanel: {},
    psuSwitch: false,
    post: null,
    mistakes: 0,
    startedAt: 0,
    panelRemovedOnce: false,
    snap: null,
    hold: null,
    hover: null,
    feedback: null,
    pulses: [],
    shakes: {},
    view: "overview",
    viewNonce: 0,
    overlay: null,
    fpSelected: null,
    demo: false,

    setDemo: (demo) => set({ demo }),
    init: (build) => {
      holdRegistry.clear();
      const instances = derivePartInstances(build);
      const geometry = caseGeometry(build.case);
      const cableSpecs = deriveCables(build);
      const ports = derivePorts(build);
      set({
        ready: true,
        build,
        instances,
        cableSpecs,
        ports,
        geometry,
        tasks: deriveTasks(build, instances, cableSpecs, geometry),
        parts: initialPartStates(instances),
        cables: initialCableStates(cableSpecs),
        tool: "hand",
        held: null,
        strap: false,
        lever: "closed",
        paste: "none",
        plasticPeeled: false,
        latches: Object.fromEntries(build.board.ramSlots.map((r) => [r.id, false])),
        slotCovers: {},
        standoffs: Object.fromEntries(geometry.preinstalled.map((k) => [k, true])),
        frontPanel: {},
        psuSwitch: false,
        post: null,
        mistakes: 0,
        startedAt: Date.now(),
        panelRemovedOnce: false,
        snap: null,
        hold: null,
        hover: null,
        feedback: null,
        pulses: [],
        shakes: {},
        overlay: null,
        fpSelected: null,
        demo: false,
      });
      set((s) => ({ view: "overview", viewNonce: s.viewNonce + 1 }));
    },
    reset: () => {
      const b = get().build;
      if (b) get().init(b);
    },
    setMode: (mode) => set({ mode }),
    setOverlay: (overlay) => set({ overlay }),

    selectTool: (tool) => {
      const s = get();
      if (s.tool === tool) return;
      if (s.held && tool !== "hand") s.dropHeld();
      set({ tool });
      if (tool === "paste") s.notify("tool.paste");
    },

    notify: (key, params) => {
      const msg = formatMessage(key, params);
      set((s) => ({ feedback: { id: ++feedbackSeq, ...msg }, mistakes: msg.tone === "danger" ? s.mistakes + 1 : s.mistakes }));
    },
    report: (result, shakeId) => {
      if (result.ok) return true;
      get().notify(result.key, result.params);
      if (shakeId) set((s) => ({ shakes: { ...s.shakes, [shakeId]: performance.now() } }));
      return false;
    },
    pulse: (tone, position) => {
      if (!position) return;
      set((s) => ({ pulses: [...s.pulses, { id: ++pulseSeq, tone, position, createdAt: performance.now() }] }));
    },
    removePulse: (id) => set((s) => ({ pulses: s.pulses.filter((p) => p.id !== id) })),
    setHover: (hover) => set({ hover }),
    setSnap: (next) => {
      const cur = get().snap;
      if (cur === next) return;
      if (cur && next && cur.id === next.id && cur.valid === next.valid) return;
      set({ snap: next });
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

    /* ---------- Simple toggles ---------- */
    toggleStrap: () => {
      const on = !get().strap;
      set({ strap: on });
      get().notify(on ? "strap.on" : "strap.off");
    },
    toggleLever: () => {
      const s = get();
      if (isMounted(s, "cooler")) return s.notify("paste.needsCpu");
      if (s.lever === "closed") {
        set({ lever: "open" });
        s.notify(isMounted(s, "cpu") ? "lever.cpuInside" : "lever.opened");
      } else {
        set({ lever: "closed" });
        if (isMounted(s, "cpu")) {
          s.notify("lever.closed");
          s.pulse("success", worldOf(runtime.mounts, "socket"));
        } else s.notify("lever.closedEmpty");
      }
    },
    applyPaste: (amount) => {
      const s = get();
      if (!isMounted(s, "cpu") || s.lever !== "closed" || isMounted(s, "cooler")) return s.notify("paste.needsCpu");
      set({ paste: amount, overlay: null });
      if (s.build.cooler.prePasted) {
        s.report({ ok: false, key: "paste.prePasted" }, "cpu");
        return;
      }
      s.notify(`paste.${amount}` as MessageKey);
      if (amount === "pas") s.pulse("success", worldOf(runtime.mounts, "socket"));
    },
    wipePaste: () => {
      set({ paste: "none", overlay: null });
      get().notify("paste.wiped");
    },
    peelPlastic: () => {
      if (get().plasticPeeled) return;
      set({ plasticPeeled: true });
      get().notify("plastic.peeled");
    },
    toggleLatch: (slot) => {
      const s = get();
      const open = s.latches[slot];
      const occupant = Object.entries(s.parts).find(([, p]) => p.location === "mounted" && p.mount === `ram:${slot}`);
      if (!open) {
        set({ latches: { ...s.latches, [slot]: true } });
        if (occupant && occupant[1].stage === "seated") {
          patchPart(occupant[0], { stage: "inserted" });
          s.notify("latch.openedEject", { slot });
        } else s.notify("latch.opened", { slot });
        return;
      }
      if (occupant && occupant[1].stage === "inserted") return s.notify("ram.pressNotLatch");
      set({ latches: { ...s.latches, [slot]: false } });
      s.notify("latch.closed", { slot });
    },
    toggleStandoff: (key) => {
      const s = get();
      if (!panelOff(s)) return void s.report({ ok: false, key: "panel.mustBeOff" });
      if (boardInCase(s)) return s.notify("board.locked");
      const ff = s.build.board.formFactor;
      const needed = s.geometry.holes.find((h) => h.key === key)?.formFactors.includes(ff) ?? false;
      const on = !s.standoffs[key];
      set({ standoffs: { ...s.standoffs, [key]: on } });
      if (on) {
        if (needed) s.notify("standoff.added", { ff });
        else s.report({ ok: false, key: "standoff.addedWrong", params: { ff } });
      } else {
        if (needed) s.report({ ok: false, key: "standoff.removedNeeded", params: { ff } });
        else s.notify("standoff.removed", { ff });
      }
    },
    toggleCover: (index) => {
      const s = get();
      if (!panelOff(s)) return void s.report({ ok: false, key: "panel.mustBeOff" });
      if (isMounted(s, "gpu")) return;
      const removed = !s.slotCovers[index];
      set({ slotCovers: { ...s.slotCovers, [index]: removed } });
      s.notify(removed ? "cover.removed" : "cover.restored", { n: index + 1 });
    },
    togglePsuSwitch: () => {
      const s = get();
      if (!isMounted(s, "psu")) return;
      const on = !s.psuSwitch;
      set({ psuSwitch: on });
      s.notify(on ? "psuSwitch.on" : "psuSwitch.off");
    },

    /* ---------- Parts ---------- */
    pickPart: (partId) => {
      const s = get();
      const p = part(partId);
      const st = s.parts[partId];
      if (!p || !st) return;
      if (s.tool !== "hand") return s.notify("hands.toolInUse");
      if (s.held) return s.notify("hands.full");
      if (!s.strap && ELECTRONIC.includes(p.kind)) return void s.report({ ok: false, key: "strap.needed" }, partId);

      if (p.kind === "panel") {
        if (st.location === "mounted" && st.fastened > 0) return void s.report({ ok: false, key: "panel.stillScrewed" }, "panel");
        set({ held: { kind: "part", id: partId }, panelRemovedOnce: true });
        patchPart(partId, { location: "held", mount: null });
        return s.notify("panel.removed");
      }
      if (p.kind === "cooler" && st.location === "tray" && !s.plasticPeeled) return s.peelPlastic();
      if (st.location === "mounted") {
        if (p.kind === "board") {
          if (st.mount === "case-board") return s.notify("board.locked");
          // Stray clicks on the board (aiming at its socket, latches or lever) must not lift it.
          if (s.mode === "guided" && !panelOff(s)) return s.notify("board.notYet");
        } else if (p.kind === "ram") {
          if (st.stage === "seated") return s.notify("ram.alreadySeated");
        } else if (p.kind === "m2") {
          if (st.stage !== "angled") return s.notify("m2.needsFlat");
        } else if (p.kind === "cpu") {
          if (s.lever !== "open") return s.notify("cpu.leverClosed");
          if (isMounted(s, "cooler")) return;
        } else if (st.fastened > 0) {
          return;
        }
      }
      set({ held: { kind: "part", id: partId }, hover: null });
      patchPart(partId, { location: "held", mount: null, stage: null, fastened: p.kind === "board" ? 0 : st.fastened });
      const b = s.build;
      if (p.kind === "cpu") s.notify("cpu.picked", { name: b.cpu.name, socket: b.cpu.socket });
      else if (p.kind === "ram") s.notify("ram.picked", { name: b.ram.name, type: b.ram.type });
      else if (p.kind === "m2") {
        const d = b.storage[p.index];
        s.notify("m2.picked", { name: d?.name ?? "", size: String(d?.m2Length ?? ""), key: d?.m2Key ?? "", iface: d?.interface === "sata" ? "SATA" : "PCIe NVMe" });
      } else if (p.kind === "board") s.notify("board.picked");
      else s.notify("cable.picked", { name: p.label });
    },
    dropHeld: () => {
      const s = get();
      const h = s.held;
      if (!h) return;
      if (h.kind === "part") {
        const p = part(h.id);
        if (p?.kind === "board") patchPart(h.id, { location: "mounted", mount: "bench" });
        else patchPart(h.id, { location: "tray", mount: null, stage: null });
        s.notify("hands.dropped", { name: p?.label ?? "" });
      } else {
        patchCableEnd(h.id, h.end, { state: "loose", portId: null });
      }
      set({ held: null, snap: null });
    },
    rotateHeld: () => {
      const s = get();
      const h = s.held;
      if (!h) return;
      if (h.kind === "part") patchPart(h.id, { flips: (s.parts[h.id]?.flips ?? 0) + 1 });
      else patchCableEnd(h.id, h.end, { flips: (s.cables[h.id]?.ends[h.end].flips ?? 0) + 1 });
      // The answer for the spot under the pointer may have just changed.
      const target = get().snap;
      if (target) set({ snap: h.kind === "part" ? get().evaluatePlacement(h.id, target.id) : get().evaluatePlug(target.id) });
    },
    evaluatePlacement: (partId, mountId) => {
      const s = get();
      const p = part(partId);
      if (!p) return { id: mountId, valid: false, reason: null };
      const r = canPlace(snap(), p, mountId, s.mode, s.geometry);
      return { id: mountId, valid: r.ok, reason: r.ok ? null : r };
    },
    placeHeld: () => {
      const s = get();
      const h = s.held;
      if (!h) return false;
      if (h.kind === "cable") return s.plugHeld();
      if (!s.snap) {
        s.notify("hands.aim");
        return false;
      }
      const result = s.evaluatePlacement(h.id, s.snap.id);
      if (!result.valid) {
        if (result.reason) s.report(result.reason, h.id);
        return false;
      }
      const p = part(h.id)!;
      const mountId = s.snap.id;
      const stage = p.kind === "ram" ? "inserted" : p.kind === "m2" ? "angled" : null;
      patchPart(h.id, { location: "mounted", mount: mountId, stage, fastened: 0 });
      set({ held: null, snap: null, hover: null });
      const where = worldOf(runtime.mounts, mountId);
      switch (p.kind) {
        case "ram": {
          s.notify("ram.inserted");
          const slot = mountId.split(":")[1] ?? "";
          const rec = recommendedRamSlots(snap());
          if (s.mode === "free" && !rec.includes(slot)) s.notify("ram.notRecommendedFree", { slots: rec.join(", "), count: s.build.ram.sticks });
          break;
        }
        case "m2":
          s.notify("m2.angled");
          break;
        case "cpu":
          s.notify("cpu.placed");
          break;
        case "cooler":
          s.notify("cooler.placed");
          break;
        case "board":
          s.notify(s.build.board.integratedIoShield ? "board.placed" : "board.ioShield");
          s.pulse("success", where);
          break;
        case "fan":
          s.notify("fan.placed");
          break;
        case "psu":
          s.notify("psu.placed");
          break;
        case "drive": {
          const scr = fastenersFor(s.build, p);
          s.notify("drive.placed", { screw: scr ? getScrew(scr.screwId).name : "" });
          break;
        }
        case "gpu":
          s.notify("gpu.placed");
          s.pulse("success", where);
          break;
        case "panel":
          s.notify("panel.placed");
          break;
      }
      return true;
    },
    completeRamPress: (partId) => {
      const s = get();
      const slot = s.parts[partId]?.mount?.split(":")[1];
      if (!slot) return;
      patchPart(partId, { stage: "seated" });
      set((x) => ({ latches: { ...x.latches, [slot]: false } }));
      s.pulse("success", worldOf(runtime.mounts, `ram:${slot}`));
      s.notify("ram.seated");
    },
    completeM2Press: (partId) => {
      patchPart(partId, { stage: "flat" });
      get().notify("m2.flat");
    },
    fastenDirection: (partId) => {
      const s = get();
      if (partId === "panel" && (s.parts.panel?.fastened ?? 0) >= 1 && !s.panelRemovedOnce) return -1;
      return 1;
    },
    fastenCheck: (partId) => {
      const s = get();
      const p = part(partId);
      const st = s.parts[partId];
      if (!p || !st || st.location !== "mounted") return { ok: false, key: "screw.notYet", params: { reason: "Komponen belum terpasang." } };
      const f = fastenersFor(s.build, p);
      if (!f) return { ok: false, key: "screw.notYet", params: { reason: "Komponen ini tidak memakai baut." } };
      if (p.kind === "board" && st.mount !== "case-board") return { ok: false, key: "screw.notYet", params: { reason: "Board dibaut setelah berada di atas standoff di casing." } };
      if (p.kind === "m2" && st.stage !== "flat") return { ok: false, key: "m2.needsFlat" };
      const dir = s.fastenDirection(partId);
      if (dir === 1 && st.fastened >= 1) return { ok: false, key: "screw.notYet", params: { reason: "Semua bautnya sudah terpasang." } };
      return checkBitFits(getScrew(f.screwId), s.tool, FASTENERS.bits);
    },
    setFastenProgress: (partId, p) => {
      const dir = get().fastenDirection(partId);
      patchPart(partId, { fastened: dir === 1 ? p : 1 - p });
    },
    completeFasten: (partId) => {
      const s = get();
      const p = part(partId);
      if (!p) return;
      const dir = s.fastenDirection(partId);
      patchPart(partId, { fastened: dir === 1 ? 1 : 0 });
      if (dir === -1) return s.notify("panel.unscrewed");
      const f = fastenersFor(s.build, p);
      s.pulse("success", worldOf(runtime.mounts, s.parts[partId]?.mount ?? ""));
      s.notify("screw.done", { part: p.label, count: f?.count ?? 0, screw: f ? getScrew(f.screwId).name.toLowerCase() : "" });
    },

    /* ---------- Cables ---------- */
    pickCableEnd: (cableId, end) => {
      const s = get();
      const spec = s.cableSpecs.find((c) => c.id === cableId);
      const st = s.cables[cableId];
      if (!spec || !st) return;
      if (spec.ends[end].fixedTo) return;
      if (s.tool !== "hand") return s.notify("hands.toolInUse");
      if (s.held) return s.notify("hands.full");
      if (!s.report(cableAvailable(snap(), spec))) return;
      const was = st.ends[end].state;
      patchCableEnd(cableId, end, { state: "held", portId: null });
      set({ held: { kind: "cable", id: cableId, end }, hover: null });
      s.notify(was === "plugged" ? "cable.unplugged" : "cable.picked", { name: spec.label });
    },
    evaluatePlug: (portId) => {
      const s = get();
      const h = s.held;
      if (!h || h.kind !== "cable") return null;
      const spec = s.cableSpecs.find((c) => c.id === h.id);
      const port = s.ports.find((p) => p.id === portId);
      if (!spec || !port) return null;
      const r = canPlug(snap(), spec, h.end, port, s.mode);
      return { id: portId, valid: r.ok, reason: r.ok ? null : r };
    },
    plugHeld: () => {
      const s = get();
      const h = s.held;
      if (!h || h.kind !== "cable") return false;
      if (!s.snap) {
        s.notify("cable.aim");
        return false;
      }
      const res = s.evaluatePlug(s.snap.id);
      if (!res || !res.valid) {
        if (res?.reason) s.report(res.reason, `cable:${h.id}`);
        return false;
      }
      const spec = s.cableSpecs.find((c) => c.id === h.id)!;
      patchCableEnd(h.id, h.end, { state: "plugged", portId: res.id });
      set({ held: null, snap: null });
      s.pulse("success", worldOf(runtime.ports, res.id));
      s.notify("cable.plugged", { name: spec.label });
      return true;
    },
    routeVia: (grommetId) => {
      const s = get();
      const h = s.held;
      if (!h || h.kind !== "cable") return;
      const c = s.cables[h.id]!;
      if (c.via.includes(grommetId)) return;
      set({ cables: { ...s.cables, [h.id]: { ...c, via: [...c.via, grommetId] } } });
      s.notify("cable.routed");
    },

    /* ---------- Front panel ---------- */
    selectFpPlug: (plug) => set({ fpSelected: plug }),
    placeFrontPanel: (plug, first) => {
      const s = get();
      if (!boardInCase(s)) return void s.report({ ok: false, key: "cable.portUnavailable", params: { reason: "Pasang board di casing dulu." } });
      const pins = pinsFor(plug, first);
      const miss = pins.find((p) => FP_MISSING.includes(p) || p > 10);
      if (miss) return void s.report({ ok: false, key: "fp.missingPin", params: { pin: Math.min(miss, 10) } });
      const others = Object.entries(s.frontPanel).filter(([k]) => k !== plug);
      if (others.some(([, ps]) => ps?.some((p) => pins.includes(p)))) return void s.report({ ok: false, key: "fp.busy" });
      const label = FP_PLUGS.find((p) => p.id === plug)?.label ?? plug;
      const correct = sameSet(pins, FP_EXPECTED[plug]);
      if (!correct && s.mode === "guided") {
        const led = plug.startsWith("PLED") ? "PLED" : plug.startsWith("HDLED") ? "HDLED" : null;
        const polarity = led && sameSet(pins, FP_EXPECTED[(plug.endsWith("+") ? `${led}-` : `${led}+`) as FrontPanelPlugId]);
        if (polarity) s.report({ ok: false, key: "fp.wrongPolarity", params: { plug: label, pins: FP_EXPECTED[plug].join(", ") } });
        else s.report({ ok: false, key: "fp.wrong", params: { plug: label, effect: FP_EFFECT[plug] } });
        return;
      }
      set({ frontPanel: { ...s.frontPanel, [plug]: pins }, fpSelected: null });
      s.notify("fp.placed", { plug: label, pins: pins.join(" dan ") });
    },
    removeFrontPanel: (plug) => {
      const s = get();
      const next = { ...s.frontPanel };
      delete next[plug];
      set({ frontPanel: next });
      s.notify("fp.removed", { plug: FP_PLUGS.find((p) => p.id === plug)?.label ?? plug });
    },

    /* ---------- Power ---------- */
    pressPower: () => {
      const s = get();
      const result = evaluatePost(snap(), s.cableSpecs);
      set({ post: result, overlay: "result" });
      // Show the monitor: that's where a successful start shows up.
      if (result.powered) get().setView("monitor");
      if (result.booted) {
        s.notify("post.ok", { mistakes: s.mistakes });
      } else {
        const first = result.findings.find((f) => f.severity === "fatal");
        if (first) s.notify(first.key, first.params);
        else s.notify("post.fail");
      }
    },
  };
});

/** Non-reactive read for per-frame code (useFrame). */
export const readAssembly = () => useAssemblyStore.getState();

export function useCurrentTask() {
  return useAssemblyStore((s) => (s.ready ? currentTask(s.tasks, s) : null));
}

/** The next physical action of the current task. Flat primitives, so shallow equality holds. */
export function useCurrentGuide() {
  return useAssemblyStore(
    useShallow((s) => {
      const g = s.ready ? currentTask(s.tasks, s)?.guide?.(s) : null;
      return { gesture: g?.gesture ?? null, tool: g?.tool ?? null, how: g?.how ?? "" };
    }),
  );
}
