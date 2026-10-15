import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";

/**
 * Procedural textures, drawn once on a 2D canvas. They carry visual detail
 * (traces, perforation, silkscreen, stickers) without shipping image files.
 * Visual layer only: nothing here is a spec.
 */

const cache = new Map<string, Texture>();

function memo<T extends Texture>(key: string, make: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const tex = make();
  cache.set(key, tex);
  return tex;
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak tersedia");
  return { c, ctx };
}

/** Deterministic PRNG so the board looks the same on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export interface SilkLabel {
  text: string;
  /** Board-local x (cm) and z (cm). */
  x: number;
  z: number;
  rotate?: number;
  size?: number;
}

/** Solder mask with copper traces and silkscreen labels, mapped to the board's top face. */
export function pcbTexture(lengthCm: number, widthCm: number, labels: SilkLabel[]): Texture {
  return memo(`pcb:${lengthCm}:${widthCm}:${labels.length}`, () => {
    const pxPerCm = 48;
    const W = Math.round(lengthCm * pxPerCm);
    const H = Math.round(widthCm * pxPerCm);
    const { c, ctx } = canvas(W, H);
    const rand = rng(7);

    ctx.fillStyle = "#1c2421";
    ctx.fillRect(0, 0, W, H);

    // Copper traces under solder mask: 45° routed bundles.
    ctx.lineCap = "round";
    for (let i = 0; i < 220; i++) {
      ctx.strokeStyle = rand() > 0.5 ? "rgba(52, 72, 63, 0.9)" : "rgba(40, 56, 49, 0.9)";
      ctx.lineWidth = 1 + rand() * 2;
      let x = rand() * W;
      let y = rand() * H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segs = 2 + Math.floor(rand() * 3);
      for (let k = 0; k < segs; k++) {
        const len = 20 + rand() * 160;
        const dir = Math.floor(rand() * 4);
        if (dir === 0) x += len;
        else if (dir === 1) y += len;
        else if (dir === 2) {
          x += len * 0.7;
          y += len * 0.7;
        } else {
          x += len * 0.7;
          y -= len * 0.7;
        }
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Vias.
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = "rgba(150, 160, 150, 0.35)";
      ctx.beginPath();
      ctx.arc(rand() * W, rand() * H, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Silkscreen.
    const toPx = (x: number, z: number) => [((x + lengthCm / 2) / lengthCm) * W, ((z + widthCm / 2) / widthCm) * H] as const;
    ctx.fillStyle = "rgba(225, 230, 226, 0.78)";
    ctx.textBaseline = "middle";
    for (const label of labels) {
      const [px, py] = toPx(label.x, label.z);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(label.rotate ?? 0);
      ctx.font = `500 ${label.size ?? 15}px "IBM Plex Mono", monospace`;
      ctx.fillText(label.text, 0, 0);
      ctx.restore();
    }
    // Board outline marks in each corner.
    ctx.strokeStyle = "rgba(225, 230, 226, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/**
 * Hex-pattern perforation as an alpha map (white = metal, black = hole).
 * Returned per call so each surface can set its own repeat.
 */
export function perforationAlpha(repeatX: number, repeatY: number, holeRatio = 0.34): Texture {
  const base = memo(`perf:${holeRatio}`, () => {
    const size = 64;
    const { c, ctx } = canvas(size, size);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    const r = size * holeRatio * 0.5;
    const pts: Array<[number, number]> = [
      [size * 0.25, size * 0.25],
      [size * 0.75, size * 0.75],
      [size * 0.75, size * 0.25 - size * 0.5],
      [size * 0.25, size * 0.75 + size * 0.5],
      [size * 0.75, size * 0.25 + size * 0.5],
      [size * 0.25, size * 0.75 - size * 0.5],
    ];
    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new CanvasTexture(c);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    return tex;
  });
  const tex = base.clone();
  tex.needsUpdate = true;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex;
}

/** Gold contact fingers: bright pads separated by dark gaps. */
export function goldFingerTexture(pads: number): Texture {
  return memo(`gold:${pads}`, () => {
    const W = pads * 8;
    const { c, ctx } = canvas(W, 16);
    ctx.fillStyle = "#6b5a2a";
    ctx.fillRect(0, 0, W, 16);
    for (let i = 0; i < pads; i++) {
      const g = ctx.createLinearGradient(0, 0, 0, 16);
      g.addColorStop(0, "#f2d27a");
      g.addColorStop(1, "#c79a3c");
      ctx.fillStyle = g;
      ctx.fillRect(i * 8 + 1.5, 1, 5, 15);
    }
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  });
}

/** Generic product sticker. No brands: specs only, as the brief requires. */
export function stickerTexture(key: string, lines: string[], opts: { width: number; height: number; dark?: boolean }): Texture {
  return memo(`sticker:${key}`, () => {
    const { width: W, height: H } = opts;
    const { c, ctx } = canvas(W, H);
    ctx.fillStyle = opts.dark ? "#2a2d33" : "#e9e8e3";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = opts.dark ? "rgba(220, 224, 230, 0.9)" : "#25272b";
    ctx.textBaseline = "middle";
    const lineH = H / (lines.length + 1);
    lines.forEach((line, i) => {
      const size = i === 0 ? Math.round(lineH * 0.62) : Math.round(lineH * 0.42);
      ctx.font = `${i === 0 ? 600 : 400} ${size}px "IBM Plex Mono", monospace`;
      ctx.fillText(line, W * 0.06, lineH * (i + 1));
    });
    // A fake barcode strip on the right edge: reads as a real label at a glance.
    const rand = rng(lines.join("").length);
    let x = W * 0.78;
    while (x < W * 0.95) {
      const w = 1 + Math.floor(rand() * 3);
      ctx.fillRect(x, H * 0.2, w, H * 0.6);
      x += w + 1 + Math.floor(rand() * 2);
    }
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** Anti-static mat print: a cm grid with ruler ticks. Greyscale, so the mat colour token tints it. */
export function matTexture(widthCm: number, depthCm: number): Texture {
  return memo(`mat:${widthCm}:${depthCm}`, () => {
    const px = 12;
    const W = widthCm * px;
    const H = depthCm * px;
    const { c, ctx } = canvas(W, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x <= widthCm; x++) {
      ctx.fillStyle = x % 10 === 0 ? "rgba(0,0,0,0.22)" : x % 5 === 0 ? "rgba(0,0,0,0.13)" : "rgba(0,0,0,0.06)";
      ctx.fillRect(x * px, 0, 1, H);
    }
    for (let y = 0; y <= depthCm; y++) {
      ctx.fillStyle = y % 10 === 0 ? "rgba(0,0,0,0.22)" : y % 5 === 0 ? "rgba(0,0,0,0.13)" : "rgba(0,0,0,0.06)";
      ctx.fillRect(0, y * px, W, 1);
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.font = '500 16px "IBM Plex Mono", monospace';
    for (let x = 10; x < widthCm; x += 10) ctx.fillText(String(x), x * px + 4, 18);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}
