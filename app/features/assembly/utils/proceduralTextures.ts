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

export interface BoardLabel {
  text: string;
  /** Board-local u (down from the top edge) and v (forward from the rear edge), cm. */
  u: number;
  v: number;
  size?: number;
  rotate?: number;
}

/**
 * Motherboard top face for a plane laid flat over the board (rotation −90° about x):
 * canvas x runs from u = length (left) to u = 0 (right), canvas y from v = 0 (top) to v = width.
 */
export function boardTexture(key: string, lengthCm: number, widthCm: number, labels: BoardLabel[]): Texture {
  return memo(`board:${key}`, () => {
    const s = 40;
    const W = Math.round(lengthCm * s);
    const H = Math.round(widthCm * s);
    const { c, ctx } = canvas(W, H);
    const rand = rng(11);
    ctx.fillStyle = "#1b2120";
    ctx.fillRect(0, 0, W, H);
    ctx.lineCap = "round";
    for (let i = 0; i < 260; i++) {
      ctx.strokeStyle = rand() > 0.5 ? "rgba(48, 64, 58, 0.9)" : "rgba(38, 51, 47, 0.9)";
      ctx.lineWidth = 1 + rand() * 1.6;
      let x = rand() * W;
      let y = rand() * H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 3; k++) {
        const len = 20 + rand() * 140;
        const d = Math.floor(rand() * 4);
        if (d === 0) x += len;
        else if (d === 1) y += len;
        else if (d === 2) (x += len * 0.7), (y += len * 0.7);
        else (x += len * 0.7), (y -= len * 0.7);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(150, 160, 150, 0.3)";
    for (let i = 0; i < 1100; i++) {
      ctx.beginPath();
      ctx.arc(rand() * W, rand() * H, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(226, 230, 226, 0.82)";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (const l of labels) {
      ctx.save();
      ctx.translate((lengthCm - l.u) * s, l.v * s);
      ctx.rotate(l.rotate ?? 0);
      ctx.font = `600 ${l.size ?? 13}px "IBM Plex Mono", monospace`;
      ctx.fillText(l.text, 0, 0);
      ctx.restore();
    }
    ctx.strokeStyle = "rgba(226, 230, 226, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** Small embossed-looking text tag for plugs and housings ("CPU", "PCIe", arrows). */
export function tagTexture(text: string, opts: { dark?: boolean } = {}): Texture {
  return memo(`tag:${text}:${opts.dark ? 1 : 0}`, () => {
    const { c, ctx } = canvas(128, 48);
    ctx.fillStyle = opts.dark ? "#151618" : "#d9d6cd";
    ctx.fillRect(0, 0, 128, 48);
    ctx.fillStyle = opts.dark ? "rgba(230, 232, 235, 0.9)" : "#1c1d20";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '600 30px "IBM Plex Mono", monospace';
    ctx.fillText(text, 64, 26);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  });
}

/** Airflow arrow printed on a fan frame or a PSU. */
export function arrowTexture(): Texture {
  return memo("arrow", () => {
    const { c, ctx } = canvas(64, 64);
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = "rgba(235, 237, 240, 0.95)";
    ctx.beginPath();
    ctx.moveTo(32, 6);
    ctx.lineTo(54, 32);
    ctx.lineTo(40, 32);
    ctx.lineTo(40, 58);
    ctx.lineTo(24, 58);
    ctx.lineTo(24, 32);
    ctx.lineTo(10, 32);
    ctx.closePath();
    ctx.fill();
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  });
}
