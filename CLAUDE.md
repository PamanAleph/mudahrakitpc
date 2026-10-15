# CLAUDE.md — Simulator Rakit PC 3D

Read this before changing anything. It keeps every next implementation on the same track.
Visual and UI rules live in `DESIGN.md`; read that before touching CSS, HUD, or materials.

## What this is

A browser simulator for learning to build a PC end to end, in four acts:

1. **Plan** (`/`, `features/planner`): pick a goal and a fictional budget, then shop every category
   (CPU, board, RAM, cooler, VGA, storage SSD/HDD/SSHD/M.2, case, case fans, PSU). Every pick is
   checked against the others (socket, RAM type, form factor, clearances, PSU watts and connectors…).
2. **Assemble on the bench** (`/rakit`, `features/assembly`): wrist strap, socket lever, CPU triangle,
   thermal paste, cooler film + screws, RAM latches + notch + press, M.2 angle + press + screw.
3. **Assemble in the case**: side panel screws, standoffs for the board's form factor, fans with
   airflow direction, PSU, board, drives in the right bay, slot covers, VGA, **every cable**
   (24-pin, EPS, PCIe/12V-2x6, SATA power/data, CPU_FAN, SYS_FAN, USB 3, USB-C, HD audio,
   front panel pins).
4. **Power on**: PSU switch, power button, a simplified POST with debug LEDs, monitor output, summary.

Every refusal explains **why**, in plain Indonesian. Guided mode refuses mistakes; free mode lets
some through (wrong RAM slots, non-primary PCIe slot, wrong front-panel pins, too much paste) and
the power-on result shows the consequence.

## Commands

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # tsc, strict
npm run test:engine  # headless full build of both preset builds through the store (no 3D)
npm run build        # remix vite:build
npm start            # serve the production build
npm run check        # typecheck + test:engine + build; run before you report work as done
```

Node ≥ 20. Stack: Remix 2 (Vite) + React 18 + TypeScript strict, Three.js via
`@react-three/fiber` 8 + `@react-three/drei` 9, `zustand` for state, `zod` for data validation,
`maath` for damping, `lucide-react` icons, IBM Plex via `@fontsource`. No Tailwind: CSS Modules + tokens.
Dev only: `tsx` (runs `scripts/engine-smoke.ts`).

## The one principle: visual may lie, data may not

| Layer | Lives in | Must be accurate? |
| --- | --- | --- |
| Shape, colour, texture, decoration | `features/assembly/models/`, `utils/proceduralTextures.ts` | No — generic is fine, **no brands/logos** |
| Pins, keying, connector families, slots, sizes, watts, bit per screw | `shared/hardware/data/*.json` | Yes — standard or manual, source recorded |
| Where features sit on a board/case | `features/assembly/constants/layouts.ts` | Layout choice, marked `[BELUM DIKONFIRMASI]` |
| Rules (what fits, what order) | `planner/rules`, `assembly/rules`, `assembly/engine` (pure) | Read data, never hard-code facts |
| Educational copy | `assembly/constants/messages.ts`, planner rule texts | Explains why + what to do next |

Every JSON entry has `verified` and `source`. Unverified facts stay unverified and the UI shows a
notice. Never invent a fact to make something work. `checkReferences()` in `shared/hardware/catalog.ts`
validates cross-references (connector ids, pin counts vs layout) at import.

## Architecture: feature-based (separation of concerns, not file types)

Follows the author's article *Separation of Files vs Separation of Concerns*. Things that change
together stay together. Deleting a feature = deleting one folder.

```
app/
├── routes/              # Remix routes. Thin: import a feature's public API only.
│   ├── _index.tsx       # → PlannerPage
│   └── rakit.tsx        # → AssemblyEntryPage (reads the saved build)
├── shared/              # used by ≥2 features. NEVER imports from features/.
│   ├── hardware/        # THE hardware facts: data/*.json, zod schema, catalog, build (save/load/resolve), power
│   ├── components/      # dumb UI: Button, SegmentedControl, Surface, Kbd; three/StageCanvas
│   ├── hooks/ utils/ constants/
└── features/
    ├── planner/         # Act 1–2: shopping + compatibility
    │   ├── rules/compatibility.ts   # evaluateBuild(): block/warn issues, pure
    │   ├── store/ components/ pages/ constants/
    └── assembly/        # Act 3–4: the 3D bench
        ├── engine/      # pure, no three: parts, ports, cables, tasks, selectors, frontPanel, post
        ├── rules/       # pure: placementRules, cableRules, fastenerRules → RuleResult
        ├── store/       # zustand store (all actions) + hold registry
        ├── constants/   # layouts (board/case geometry), deskLayout (rest poses), messages, timings
        ├── models/      # pure 3D geometry, props in → meshes out. No store access.
        ├── components/
        │   ├── scene/   # smart 3D: PartRig, BoardContent, CaseRig, DeskRig, CableLayer,
        │   │            #   SnapController, CameraDirector, Marker, ScrewSet…
        │   └── hud/     # smart DOM: TaskCard, TaskList, ToolDock, Overlays, toast, tips
        ├── hooks/ utils/ types/ pages/
        └── index.ts     # PUBLIC API
```

The build travels from planner to assembly through `shared/hardware/build.ts` (`saveBuild` /
`loadBuild`, localStorage key `rakit-pc:build:v2`), not through an import between features.

### Import rules (enforced by review)

1. `shared/` never imports from `features/`.
2. A feature never imports another feature's internals.
3. Routes import from `@features/<name>` (the `index.ts`), never deep paths.
4. Aliases: `@features/*`, `@shared/*`, `~/*` (= `app/*`). Inside a feature use relative paths.
5. **No value imports from `three` in anything the HUD reaches** (store, engine, rules, runtime).
   Type-only imports are fine. This keeps three in the lazy 3D chunk.
6. `models/` are dumb. Scene components wrap them, read the store, and own the animation.

## How the assembly works

**State** (`store/assemblyStore.ts`): an `AssemblySnapshot` (parts, cables, tool, held, strap, lever,
paste, latches, standoffs, slot covers, front panel, PSU switch, post result, mistakes) plus UI state
(snap, hold, hover, feedback, view, overlay). Everything else is derived:

- `engine/parts.ts` — one `PartInstance` per physical thing (ram-0, drive-1, fan-2…) + screws per part.
- `engine/ports.ts` — every socket a cable can go into (`board:eps-0`, `gpu:pwr-0`, `drive-1:data`…).
- `engine/cables.ts` — every cable: fixed end (PSU outlet, cooler fan, case front I/O) + free end(s),
  plug kind, allowed target ports (wildcards like `board:sata-*`).
- `engine/tasks.ts` — the guided script for this build, in real-world order, each with `isDone(snapshot)`
  and a camera view. Physical prerequisites are enforced by rules, not by the list.
- `engine/post.ts` — what pressing power does: PSU → 24-pin → power switch pins → EPS/CPU → cooling →
  RAM → display → boot drive, with debug LED and findings.

**Rules** return `RuleResult` (`{ ok: true }` or a message key + params). Store actions call them and
`report()` the result (message, mistake count, shake).

**Scene** (`components/scene`):
- `Marker` registers named Object3Ds in `utils/runtime.ts` maps: `mounts` (where a part can go:
  `socket`, `cooler`, `ram:A2`, `m2:M2_1`, `pcie:PCIE1`, `case-board`, `psu-bay`, `bay:bay25-1`,
  `fan:front-1`, `panel`, `bench`), `ports` (cable sockets), `anchors` (cable fixed ends, grommets,
  `fp-header`). Board-hosted markers are children of the board, so they move with it.
- `PartRig` renders every part. Each frame it derives a target pose from the store
  (tray rest pose → follows the pointer while held, or hovers over the snap target → mount pose with
  stage offsets) and damps towards it. Flips: Ry(π) for CPU/RAM, Rx(π) for fans (airflow).
- `SnapController` finds the nearest candidate mount/port **in screen space** (70 px) and asks the
  rules; `SnapIndicator` draws the green/red ring. Held cables thread through grommets they pass over.
- `CableLayer` draws each cable as a Catmull-Rom tube from fixed anchor → grommets → plug, rebuilt
  only when an end moves. Plugs carry the connector footprint (`models/Connector.tsx`).
- `CameraDirector` (drei CameraControls) glides to the current task's view.

### Frames and units

- **1 unit = 1 cm.** The case lies on its right side on the mat at the origin:
  `x+` = top of the tower, `z−` = rear (I/O), `y+` = up (towards the glass).
- Board-local: origin at the top-rear corner on the top surface; `u` = cm down from the top edge
  (world −x), `v` = cm forward from the rear edge (world +z). `uv(p, y)` converts.
- Model origins are documented at the top of each model file (e.g. CPU = package bottom centre,
  GPU = rear bracket plane at the finger bottom, drive = bottom centre with SATA facing −z).
  A GLTF replacement must keep the same origin.
- Per-frame code reads the store with `readAssembly()` (non-reactive). Only `setSnap`/`tickHold`
  write from `useFrame`, and both dedupe.

### Gesture model (`hooks/useInteractive.ts`)

- **Tap** = pick up / toggle / ask. **Hold** = press or turn (progress ring, resumable for screws).
  **Drag on empty space** = camera.
- While something is in hand, a tap anywhere means "place it here" (uses the snap target), except on
  `priority` controls (lever, latches, PSU switch, power button, front panel header, strap).
- `getHold()` returns a `HoldDefinition`, `null` (tap), or `"handled"` (already answered).

## How to add things

**A catalog item**: add to `shared/hardware/data/catalog/*.json` with `verified` + `source`. If it
introduces a new fact type, extend `schema.ts` first. Run `npm run test:engine`.

**A planner rule**: `features/planner/rules/compatibility.ts`, returns an `Issue` with block/warn.

**An assembly rule**: pure function in `assembly/rules/`, message key in `constants/messages.ts`
(title + body: what's wrong, why, what next), call it from a store action via `report()`.

**A new part kind**: data + schema → `engine/parts.ts` (instance, screws) → mount ids in
`rules/placementRules.ts` (`mountAccepts`, `canPlace`) → markers in a rig → model in `models/` →
content in `PartContent.tsx` → tasks → extend `scripts/engine-smoke.ts`.

**A new cable**: `engine/cables.ts` (fixed end anchor + targets) and, if needed, a port in
`engine/ports.ts` + a marker where it sits. Footprint in `models/Connector.tsx`.

## Verifying in a browser

In `npm run dev`, `window.__assemblyDev` exposes `store`, `runtime`, `where(kind, id)` (world position
of a mount/port/anchor) and `project(x, y, z)` (world → screen px). Development only.
Headless Chromium needs `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`; it
renders at 1–2 fps, so wait until projected positions are stable and check `store.hover.label` before
clicking. Holds take longer there (HoldController caps dt at 0.1 s).

## Budgets (do not regress)

- Initial JS on `/rakit` (excluding the lazy 3D chunk) < 200 KB gzip (currently ≈ 140 KB).
  3D chunk ≈ 280 KB gzip. `/` (planner) ships no three.
- DPR capped at 1.75, render loop paused when the tab is hidden, WebGL context loss → text fallback.
- No WebGL → `SceneFallback` lists this build's tasks as text. The page stays usable without 3D.
- `prefers-reduced-motion`: camera jumps, parts snap instead of gliding, pulses off.

## Known gaps / open items

- `[BELUM DIKONFIRMASI]`: board feature positions, ATX hole grid, slot pitch, DDR4/DDR5 notch offsets,
  M.2 key positions, bit size per screw, PSU headroom threshold, fictional prices/watts. Check against
  official manuals (ATX spec, JEDEC, board manuals), then set `verified: true` with `source`.
- Deferred by decision: AIO coolers, ARGB headers, Molex devices, modular cable attach at the PSU side,
  rear I/O shield as a separate part, cable management behind the tray.
- Scene actions are pointer/touch only (tools, rotate, drop, camera, overlays have keyboard paths).
- Models are procedural (no GLTF yet).

## Don'ts

- Don't put facts in models or components. Don't add brands, logos or real product names.
- Don't add libraries without a one-line justification here.
- Don't animate for decoration. Every motion confirms an action, guides attention, or explains depth.
- UI and educational copy are Indonesian. Code, comments, and docs for developers are English.
