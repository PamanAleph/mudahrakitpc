/**
 * Headless smoke test of the assembly engine: performs a full build through the
 * store actions (no 3D) and checks that every task completes and the PC boots.
 * Run: npx tsx scripts/engine-smoke.ts
 */
import { PRESET_BUILDS, resolveBuild } from "../app/shared/hardware";
import { useAssemblyStore } from "../app/features/assembly/store/assemblyStore";
import { currentTask } from "../app/features/assembly/engine/tasks";
import { BOARD_TEMPLATES, holeKey } from "../app/features/assembly/constants/layouts";
import { FP_EXPECTED } from "../app/features/assembly/engine/frontPanel";
import type { FrontPanelPlugId } from "../app/features/assembly/types/assemblyTypes";

const S = () => useAssemblyStore.getState();
let failures = 0;
const check = (cond: boolean, msg: string) => {
  if (!cond) {
    failures++;
    console.log("  FAIL:", msg, "| feedback:", S().feedback?.title, "-", S().feedback?.body);
  }
};
const place = (partId: string, mountId: string) => {
  S().pickPart(partId);
  check(S().held?.kind === "part" && S().held?.id === partId, `pick ${partId}`);
  S().setSnap(S().evaluatePlacement(partId, mountId));
  check(S().placeHeld(), `place ${partId} -> ${mountId}`);
};
const fasten = (partId: string, bit: "PH0" | "PH1" | "PH2") => {
  S().selectTool(bit);
  const r = S().fastenCheck(partId);
  check(r.ok, `fasten check ${partId}`);
  if (r.ok) S().completeFasten(partId);
  S().selectTool("hand");
};
const plug = (cableId: string, end: "a" | "b", portId: string) => {
  S().pickCableEnd(cableId, end);
  const st = S().cables[cableId]!.ends[end];
  while ((st.flips ?? 0) % 2 !== 0 && S().cables[cableId]!.ends[end].flips % 2 !== 0) S().rotateHeld();
  S().setSnap(S().evaluatePlug(portId));
  check(S().plugHeld(), `plug ${cableId}.${end} -> ${portId}`);
};

for (const preset of PRESET_BUILDS) {
  console.log(`\n== ${preset.label}`);
  const build = resolveBuild(preset.build)!;
  S().init(build);
  const b = build;
  S().toggleStrap();
  // Bench
  S().toggleLever();
  S().pickPart("cpu");
  S().rotateHeld();
  S().setSnap(S().evaluatePlacement("cpu", "socket"));
  check(S().placeHeld(), "place cpu");
  S().toggleLever();
  if (!b.cooler.prePasted) S().applyPaste("pas");
  S().pickPart("cooler"); // peels
  place("cooler", "cooler");
  fasten("cooler", "PH2");
  const rec = b.board.recommendedRamSlots[String(b.ram.sticks)]!;
  for (let i = 0; i < b.ram.sticks; i++) {
    const slot = rec[i]!;
    S().toggleLatch(slot);
    S().pickPart(`ram-${i}`);
    S().rotateHeld();
    S().setSnap(S().evaluatePlacement(`ram-${i}`, `ram:${slot}`));
    check(S().placeHeld(), `place ram-${i}`);
    S().completeRamPress(`ram-${i}`);
  }
  const m2s = S().instances.filter((p) => p.kind === "m2");
  m2s.forEach((p, k) => {
    place(p.id, `m2:${b.board.m2Slots[k]!.id}`);
    S().completeM2Press(p.id);
    fasten(p.id, "PH1");
  });
  // Case
  S().selectTool("PH2");
  check(S().fastenDirection("panel") === -1, "panel unscrew direction");
  S().completeFasten("panel");
  S().selectTool("hand");
  S().pickPart("panel");
  S().dropHeld();
  const required = new Set(BOARD_TEMPLATES[b.board.formFactor].holes.map((h) => holeKey(h.u, h.v)));
  for (const h of S().geometry.holes) {
    const on = !!S().standoffs[h.key];
    if (on !== required.has(h.key)) S().toggleStandoff(h.key);
  }
  const fanMounts = b.case.fanMounts.filter((m) => (m.sizes as number[]).includes(b.fan?.sizeMm ?? 120));
  S().instances.filter((p) => p.kind === "fan").forEach((p, k) => {
    const m = fanMounts[k]!;
    S().pickPart(p.id);
    if (m.side !== "front") S().rotateHeld();
    S().setSnap(S().evaluatePlacement(p.id, `fan:${m.id}`));
    check(S().placeHeld(), `place ${p.id}`);
    fasten(p.id, "PH2");
  });
  // Major
  place("psu", "psu-bay");
  fasten("psu", "PH2");
  place("board", "case-board");
  fasten("board", "PH2");
  const bays = [...b.case.driveBays];
  S().instances.filter((p) => p.kind === "drive").forEach((p) => {
    const d = b.storage[p.index]!;
    const i = bays.findIndex((x) => x.kind === d.kind);
    const bay = bays.splice(i, 1)[0]!;
    place(p.id, `bay:${bay.id}`);
    fasten(p.id, d.kind === "3.5" ? "PH2" : "PH1");
  });
  if (b.gpu) {
    for (let i = 0; i < b.gpu.slots; i++) S().toggleCover(i);
    place("gpu", `pcie:${b.board.pcieSlots[0]!.id}`);
    fasten("gpu", "PH2");
  }
  // Cables
  let sysFan = 0;
  let sata = 0;
  for (const c of S().cableSpecs) {
    if (!c.required) continue;
    for (const t of c.targets) {
      let port = t.portId;
      if (port === "board:sys_fan-*") port = `board:sys_fan-${sysFan++}`;
      if (port === "board:sata-*") port = `board:sata-${sata++}`;
      plug(c.id, t.end, port);
    }
  }
  for (const [plugId, pins] of Object.entries(FP_EXPECTED)) S().placeFrontPanel(plugId as FrontPanelPlugId, pins[0]!);
  // Close and power
  place("panel", "panel");
  fasten("panel", "PH2");
  S().togglePsuSwitch();
  S().pressPower();
  const s = S();
  const open = s.tasks.filter((t) => !t.isDone(s));
  check(open.length === 0, `open tasks: ${open.map((t) => t.id).join(", ")}`);
  check(!!s.post?.booted, `booted (findings: ${s.post?.findings.map((f) => f.key).join(", ")})`);
  console.log(`  tasks ${s.tasks.length}, mistakes ${s.mistakes}, post booted=${s.post?.booted} led=${s.post?.led}`);
  console.log(`  findings: ${s.post?.findings.map((f) => `${f.severity}:${f.key}`).join(", ") || "-"}`);
  void currentTask;
}

// A few refusals that must happen
const build = resolveBuild(PRESET_BUILDS[0]!.build)!;
S().init(build);
S().pickPart("cpu");
check(S().feedback?.title.includes("gelang") ?? false, "strap required before touching parts");
S().toggleStrap();
S().pickPart("cpu");
S().setSnap(S().evaluatePlacement("cpu", "socket"));
check(!S().placeHeld() && S().feedback?.title === "Tuas socket masih tertutup", "cpu refused with lever closed");
S().dropHeld();
S().selectTool("PH1");
S().fastenCheck("panel").ok === false ? S().report(S().fastenCheck("panel")) : null;
check(S().feedback?.title === "Mata PH1 terlalu kecil", "wrong bit refused");
S().pressPower();
check(S().post?.powered === false, "no power with PSU absent");

// The board is not a handle for the socket lever: guided mode refuses to lift it before the panel is off
S().init(build);
S().toggleStrap();
S().pickPart("board");
check(S().held === null && S().feedback?.title === "Board tetap di kotaknya dulu", "board stays in its box while working on the bench");
// Every task says how to do its next step, and the first one points at the lever
check(S().tasks.every((t) => typeof t.guide === "function"), "every task has a guide");
S().toggleStrap();
check(S().tasks.find((t) => t.id === "lever-open")?.guide?.(S())?.target === "lever", "lever task points at the lever");
check(S().tasks.find((t) => t.id === "cpu")?.guide?.(S())?.spot === "socket", "cpu task points at the socket");

console.log(failures ? `\n${failures} failure(s)` : "\nALL OK");
process.exit(failures ? 1 : 0);
