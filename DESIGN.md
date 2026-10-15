# DESIGN.md — Simulator Rakit PC 3D

The design system for this project. Tokens are defined once in `app/styles/tokens.css`;
this document explains what they mean and how to use them. If code and this file disagree,
fix one of them in the same change.

## Direction

**A calm workbench.** Neutral, warm-grey surfaces; a slate anti-static mat; real-looking hardware.
The hardware is the hero, the HUD stays quiet at the edges. One accent colour (a deep blue) marks
"what you can act on". Green and red appear **only** as semantic feedback (fits / doesn't fit).

Not: dark "gamer" neon, gradients, glassmorphism, glowing orbs, emoji, fake metrics.

## Tokens: three layers

1. **Primitive** (`--prim-*`) — raw hex values. Components never use these directly.
2. **Semantic** (`--color-*`, `--space-*`, `--radius-*`, `--font-*`, `--motion-*`, `--layer-*`) —
   what a value *means*. Components use only these.
3. **Scene** (`--scene-*`) — semantic colours for the 3D layer, read in JS via `useCssTokens()`.

Dark theme redefines semantic and scene tokens only (via `prefers-color-scheme` and `[data-theme]`).

### Colour (semantic)

| Token | Use |
| --- | --- |
| `--color-bg-app` | page background behind the canvas |
| `--color-surface-default` | the HUD surfaces (cards, dock, toast) |
| `--color-surface-sunken` | hover fills, tracks, inset areas |
| `--color-surface-inverse` / `--color-text-inverse` | hover tooltip |
| `--color-text-primary` / `-secondary` | body text / supporting text (both ≥ 4.5:1) |
| `--color-text-accent` | step counter, small accent labels |
| `--color-border-subtle` / `-strong` | separators / hover borders |
| `--color-action-primary-bg/-fg/-bg-hover` | primary action, progress fill, hold ring |
| `--color-action-selected-bg/-fg` | the pressed segment (selected tool) |
| `--color-focus-ring` | keyboard focus outline |
| `--color-feedback-info/-success/-danger` | toast icons, step check marks |

### Colour (scene)

| Token | Use |
| --- | --- |
| `--scene-backdrop` | canvas clear colour |
| `--scene-desk`, `--scene-mat` | desk top, anti-static mat (mat texture is greyscale, tinted by this) |
| `--scene-snap-valid` / `--scene-snap-invalid` | slot outline + part glow when aiming |
| `--scene-accent` | screwdriver grip, latch hover glow, info pulses |

Hardware finishes (steel, PCB green, gold fingers, brass) are **visual-layer** values in
`features/assembly/models/materials.ts`. They are believable, never brand colours.

### Type

- Families: **IBM Plex Sans** (UI) + **IBM Plex Mono** (data: specs, step counter, bit names, shortcuts).
  Mono is the signal "this is a technical fact".
- Sizes: `--font-size-caption` 12 · `--font-size-body` 14 · `--font-size-title` 16 · `--font-size-display` 22.
  Don't add sizes.
- Weights: 400 / 500 / 600. Headings use `text-wrap: balance`. Hints are capped at ~62ch.

### Space, shape, layering

- 4 px base: `--space-1` (4) … `--space-12` (48). Use flex/grid `gap`, not margins between siblings.
- Side gutters are `--space-gutter-inline-start/end` (safe-area aware). Use them for anything at a screen edge.
- **One radius**: `--radius-control` (8 px). `--radius-inner` (6 px) only for an element nested
  inside an 8 px container with 2 px padding (segmented control).
- Touch targets ≥ `--size-touch-min` (44 px) on coarse pointers; controls are `--size-control` (40 px).
- One elevated style: `Surface` (border + `--shadow-raised`). Use it only for things floating over the 3D.
- Layers: `--layer-hud` < `--layer-tooltip` < `--layer-overlay`.

### Motion

- **Two CSS curves only**: `--motion-ease-standard` (UI) and `--motion-ease-emphasized` (small
  overshoot for confirmations: step check, progress fill, toast entry).
- Durations: fast 160 · base 240 · slow 480 ms.
- **3D motion** uses two spring presets and four damp times in `shared/constants/motion.ts`:
  `SPRING.click` (latches, SSD spring-back, bit pop), `SPRING.settle` (RAM seating bounce);
  `DAMP.follow/place/rotate/camera`.
- Every animation has a job:
  - Held parts follow the pointer with damping and lean into travel → "you are holding something".
  - Snap glow pulses green/red → "will it fit?" before the click.
  - Latch springs shut with overshoot, RAM bounces when seated, ring pulse → "it clicked".
  - Screws rise by thread pitch while spinning, then hop into the dish → "it's out, and kept safe".
  - SSD springs back up if the press is released early → teaches why it needs a screw.
  - Wrong action: part/driver shakes + toast nudges → "no, and here is why".
  - Camera glides to the next work area on step change.
- `prefers-reduced-motion`: camera cuts, pulses off, flights/tweens shortened.

### Icons

Lucide only, `strokeWidth={1.6}`, 16–18 px in controls, 22 px in the toast. No emoji anywhere.

## HUD layout

The canvas is full-bleed. HUD regions hug the edges so the centre stays the work area:

| Region | Content | Notes |
| --- | --- | --- |
| Top-left | Brand + mode | |
| Top-centre | **StepCard**: counter, title, hint, progress bar | The single primary instruction |
| Top-right | "Langkah" (toggle list), "Ulang" | Icon-only under 640 px |
| Left (toggle) | StepList: all steps, mistakes, shortcuts, data notice | Open by default ≥ 1360 px |
| Right, under the top bar | FeedbackToast | Moves above the dock on phones |
| Bottom-centre | ToolDock: Tangan / PH0 / PH1 / PH2 · Putar · Taruh · camera | One bar |
| Pointer | HoverTip (mouse), HoldRing (during holds) | |

One primary action per moment: the step card says what it is; the scene highlights where.

## Copy

- Indonesian, plain, second person implied. Short sentences.
- A refusal always has: what's wrong (title) + why it matters + what to do (body).
  Example: **Mata PH1 terlalu kecil** — "Ujungnya tidak mengisi alur kepala baut, jadi akan selip dan
  membuat alurnya dol. Baut panel samping butuh mata PH2."
- Name things the way a builder would: *klip slot*, *takik*, *standoff*, *mata obeng*.
- No filler ("Selamat datang!", "Mudah dan cepat"), no marketing.

## 3D visual rules

- Generic parts, believable finishes, **no brands, logos, or real model names**. Stickers carry
  specs only (e.g. `DDR5 · 288-PIN`).
- Geometry that carries a fact (notch position, slot pitch, M.2 length) must come from data/layout
  constants, so the picture and the rule can't disagree.
- Lighting: light-formers + one key light + contact shadows. No HDR downloads, no realtime shadow maps.
- Meaningful highlight colours come from scene tokens; never hard-code green/red in a component.

## Accessibility

- Text contrast ≥ 4.5:1 in both themes (check when adding tokens).
- All HUD controls are real `<button>`s with visible focus (`:focus-visible` ring).
- Icon-only buttons have `aria-label`. The canvas has a descriptive `aria-label`.
- Step card and toast are `aria-live="polite"`.
- Known gap: scene actions have no keyboard path yet (tools, rotate, drop and camera do).

## Anti-slop checklist (run before shipping UI)

- [ ] No gradients, glows, blobs, glassmorphism, emoji, generic badges.
- [ ] One accent, one radius, one elevated surface style, two font families, four type sizes.
- [ ] Every section/region has one job; nothing animates without a reason.
- [ ] No invented facts; unknowns marked `[BELUM DIKONFIRMASI]`.
- [ ] Works at 360, 768, 1280, 1920 px; light and dark; reduced motion.
