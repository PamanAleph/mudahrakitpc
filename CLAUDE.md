# CLAUDE.md — Simulator Rakit PC 3D

Read this before changing anything. It keeps every next implementation on the same track.
Visual and UI rules live in `DESIGN.md`; read that before touching CSS, HUD, or materials.

## What this is

A browser simulator for learning to build a PC by hand. The user sits at a virtual bench and
does each physical step themselves: pick the right screwdriver bit, unscrew the side panel,
open the DIMM latch, line up the notch, press until it clicks, seat and screw down an M.2 SSD.
Every refusal explains **why**, in plain Indonesian.

Current scope (guided mode, 8 steps): side panel screws → lift panel → RAM latch → insert RAM →
press RAM → insert M.2 → press M.2 flat → M.2 screw. Next in line: CPU (socket lever + triangle),
then one 24-pin cable as the spline feasibility test.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc, strict
npm run build      # remix vite:build
npm start          # serve the production build
npm run check      # typecheck + build; run before you report work as done
```

Node ≥ 20. Stack: Remix 2 (Vite) + React 18 + TypeScript strict, Three.js via
`@react-three/fiber` 8 + `@react-three/drei` 9, `zustand` for state, `zod` for data validation,
`maath` for damping, `lucide-react` icons, IBM Plex via `@fontsource`. No Tailwind: CSS Modules + tokens.

## The one principle: visual may lie, data may not

| Layer | Lives in | Must be accurate? |
| --- | --- | --- |
| Shape, colour, texture, decoration | `models/`, `utils/proceduralTextures.ts` | No — generic is fine, **no brands/logos** |
| Slots, pins, notch, sizes, bit per screw, connector rules | `data/*.json` | Yes — official standard or manual, source recorded |
| Rules (what fits, what order) | `rules/*.ts` (pure functions) | Read data, never hard-code facts |
| Educational copy | `constants/messages.ts` | Explains why + what to do next |

Every JSON entry has `verified` and `source`. Unverified facts stay `"[BELUM DIKONFIRMASI]"` and
the HUD shows a notice while any entry is unverified. Never invent a fact to make something work.

## Architecture: feature-based (separation of concerns, not file types)

Follows the author's article *Separation of Files vs Separation of Concerns*. Things that change
together stay together. Deleting a feature = deleting one folder.

```
app/
├── routes/                 # navigation layer (Remix). Thin: import a feature's public API only.
├── root.tsx                # html shell, fonts, global CSS
├── styles/                 # tokens.css (design tokens), global.css
├── shared/                 # reused by ≥2 features. NEVER imports from features/.
│   ├── components/         # dumb UI: Button, SegmentedControl, Surface, Kbd
│   │   └── three/          # StageCanvas (canvas config only, knows nothing about PCs)
│   ├── hooks/              # useHydrated, useWebGLSupport, useCssTokens, useReducedMotion…
│   ├── utils/              # cn, spring
│   └── constants/          # motion (spring/damp presets)
└── features/
    └── assembly/           # the guided assembly session
        ├── index.ts        # PUBLIC API. Routes import only from here.
        ├── pages/          # AssemblyPage (composes smart components only)
        ├── components/
        │   ├── hud/        # smart HUD pieces (read the store)
        │   └── scene/      # smart 3D pieces: Interactive*, camera, lighting, controllers
        ├── models/         # pure 3D geometry, props in → meshes out. No store access.
        ├── data/           # hardware facts (JSON) — single source of truth
        ├── validation/     # zod schemas for data/
        ├── services/       # hardwareSpec.ts: parses + exposes data (HARDWARE)
        ├── rules/          # pure rule functions → RuleResult
        ├── store/          # zustand store + hold registry
        ├── hooks/          # useInteractive, useCurrentStep, useStepEffects, keyboard
        ├── constants/      # messages, steps, sceneLayout, views, timings
        ├── types/          # assemblyTypes, hardwareTypes (z.infer)
        └── utils/          # textures, geometry factory, pointer plane, runtime bridge
```

### Import rules (enforced by review)

1. `shared/` never imports from `features/`.
2. A feature never imports another feature's internals. Cross-feature data goes through the route
   (props) or a store promoted to `shared/`.
3. Routes import from `@features/<name>` (the `index.ts`), never deep paths.
4. Aliases: `@features/*`, `@shared/*`, `~/*` (= `app/*`). Inside a feature use relative paths.
5. Start new code inside the feature. Promote to `shared/` only when a second feature needs it
   (e.g. when a `troubleshooting` feature needs the part models, move `models/` out then — not before).
6. `models/` are dumb: no store, no rules. `components/scene/Interactive*` wrap a model, read the
   store, and own the animation.

## 3D conventions

- **Units: centimetres.** 1 three.js unit = 1 cm. mm values in data are converted in `sceneLayout.ts`.
- **Frame:** the case lies on its right side on the mat. `x+` = top of the tower, `z−` = rear (I/O),
  `y+` = up. Board-local coordinates go through `boardToWorld()`.
- All positions come from `constants/sceneLayout.ts`. No magic numbers for positions inside components.
- **Per-frame code reads state with `readAssembly()`** (non-reactive). Never `setState` in `useFrame`
  except via store actions that change rarely (`setSnap` dedupes). React re-renders only on real
  state changes.
- **Motion is derived from state**: each Interactive component computes a target pose from the store
  every frame and damps/springs toward it (`maath/easing`, `shared/utils/spring`). Any transition,
  including reversals, animates without extra code. Presets in `shared/constants/motion.ts` only.
- Meaningful colours (snap valid/invalid, accent) come from CSS tokens via `useCssTokens` so the scene
  follows light/dark. Finish colours (steel, PCB) live in `models/materials.ts`.
- Invisible hit areas: `<meshBasicMaterial visible={false} />` on a slightly larger box. Keep hit
  boxes from overlapping neighbours (the RAM latches are 0.9 cm apart).
- The 3D chunk is lazy (`React.lazy` → `AssemblySceneRoot`). Keep three/drei imports out of the HUD.

### Gesture model (`hooks/useInteractive.ts`)

- **Tap** = pick up / toggle / ask. **Hold** = press or turn (progress ring, resumable for screws).
  **Drag on empty space** = camera. While a part is in hand, a tap places it (snap target) first.
- `getHold()` returns a `HoldDefinition`, `null` (treat as tap), or `"handled"` (already answered,
  e.g. wrong bit). The store's `report(rule)` shows the message, counts mistakes, triggers a shake.

## How to add things

**A new rule**: pure function in `rules/` returning `RuleResult`, message key in `constants/messages.ts`
(title + body that says why and what next), call it from a store action via `report()`.

**A new step**: add to `constants/steps.ts` with `isDone(snapshot)` and a camera `view`.

**A new part** (e.g. CPU):
1. Facts → `data/cpu.json` + schema in `validation/hardwareSchema.ts` + export in `services/hardwareSpec.ts`.
2. Geometry → `models/Cpu.tsx` (pure). Positions → `sceneLayout.ts`.
3. Behaviour → state slice + actions in `store/assemblyStore.ts`, rules in `rules/cpuRules.ts`.
4. Interaction → `components/scene/InteractiveCpu.tsx` using `useInteractive`.
5. Steps + messages. Then run the browser check below.

**A new feature** (e.g. troubleshooting mode): new folder `features/troubleshooting/` with its own
`index.ts`, a route in `app/routes/`, and promote shared pieces only when actually shared.

## Verifying in a browser

In `npm run dev`, `window.__assemblyDev` exposes `store` (zustand) and `project(x, y, z)` (world → screen
px) for automation. Rendered by `components/scene/DevBridge.tsx`, development only.
Headless Chromium needs `--use-angle=swiftshader --enable-unsafe-swiftshader`; it renders slowly, so
wait on `store.getState().hold === null` instead of fixed timeouts when testing holds.

## Budgets (do not regress)

- Initial JS (excluding the lazy 3D chunk) < 200 KB gzip (currently ≈ 112 KB). 3D chunk ≈ 270 KB gzip.
- DPR capped at 1.75, render loop paused when the tab is hidden, WebGL context loss → text fallback.
- No WebGL → `SceneFallback` with the steps as text. The page must stay usable without 3D.
- `prefers-reduced-motion`: camera jumps, pulses off, tweens shortened.

## Known gaps / open items

- `[BELUM DIKONFIRMASI]`: bit sizes per screw, DDR5 notch offset, M.2 key position and insert angle,
  board feature positions and ATX mounting holes. Check against official manuals/JEDEC/ATX drawings,
  then set `verified: true` with `source.document` and `source.page`.
- 3D actions are pointer/touch only; there is no keyboard path for scene actions yet.
- Models are procedural (no GLTF yet). Swapping in a GLTF must keep the same origin conventions
  documented at the top of each model file.
- Free mode and troubleshooting mode are not built.

## Don'ts

- Don't put facts in models or components. Don't add brands, logos or real product names.
- Don't add libraries without a one-line justification here.
- Don't animate for decoration. Every motion confirms an action, guides attention, or explains depth.
- UI and educational copy are Indonesian. Code, comments, and docs for developers are English.
