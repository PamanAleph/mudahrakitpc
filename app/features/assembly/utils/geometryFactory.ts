import {
  BufferGeometry,
  Curve,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";

/** Geometry builders shared by the part models. Cached: geometry is immutable once built. */
const cache = new Map<string, BufferGeometry>();
function memo<T extends BufferGeometry>(key: string, make: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const g = make();
  cache.set(key, g);
  return g;
}

class HelixCurve extends Curve<Vector3> {
  constructor(
    private radius: number,
    private length: number,
    private turns: number,
  ) {
    super();
  }
  override getPoint(t: number, target = new Vector3()): Vector3 {
    const a = t * this.turns * Math.PI * 2;
    return target.set(Math.cos(a) * this.radius, -t * this.length, Math.sin(a) * this.radius);
  }
}

/** Screw thread as a helical ridge, hanging down from y = 0. */
export function threadGeometry(radius: number, length: number, pitch: number): TubeGeometry {
  return memo(`thread:${radius}:${length}:${pitch}`, () => {
    const turns = length / pitch;
    return new TubeGeometry(new HelixCurve(radius, length, turns), Math.ceil(turns * 18), radius * 0.16, 5, false);
  });
}

/** Domed pan head profile, revolved. Sits on y = 0. */
export function panHeadGeometry(radius: number, height: number): LatheGeometry {
  return memo(`pan:${radius}:${height}`, () => {
    const pts = [
      new Vector2(0, height),
      new Vector2(radius * 0.55, height * 0.97),
      new Vector2(radius * 0.85, height * 0.8),
      new Vector2(radius, height * 0.45),
      new Vector2(radius, 0),
      new Vector2(0.001, 0),
    ];
    return new LatheGeometry(pts, 28);
  });
}

/** Ergonomic screwdriver grip, revolved around y, from y = 0 (ferrule end) up. */
export function gripGeometry(): LatheGeometry {
  return memo("grip", () => {
    const pts = [
      new Vector2(0.001, 0),
      new Vector2(0.42, 0),
      new Vector2(0.5, 0.25),
      new Vector2(0.7, 0.9),
      new Vector2(0.88, 2.2),
      new Vector2(0.92, 3.6),
      new Vector2(0.85, 5.0),
      new Vector2(0.9, 6.2),
      new Vector2(0.82, 6.9),
      new Vector2(0.55, 7.25),
      new Vector2(0.001, 7.3),
    ];
    return new LatheGeometry(pts, 12);
  });
}


/**
 * DIMM printed circuit board outline: key notch on the contact edge and the
 * two side notches the slot latches grab. Extruded along z (thickness).
 * Origin: bottom edge centre.
 */
export function dimmBoardGeometry(length: number, height: number, thickness: number, notchX: number): ExtrudeGeometry {
  return memo(`dimm:${length}:${height}:${notchX}`, () => {
    const L = length / 2;
    const notchW = 0.11;
    const notchH = 0.32;
    const sideY = 1.1;
    const sideD = 0.14;
    const s = new Shape();
    s.moveTo(-L, 0);
    s.lineTo(notchX - notchW, 0);
    s.lineTo(notchX - notchW, notchH);
    s.absarc(notchX, notchH, notchW, Math.PI, 0, true);
    s.lineTo(notchX + notchW, 0);
    s.lineTo(L, 0);
    s.lineTo(L, sideY - 0.12);
    s.lineTo(L - sideD, sideY);
    s.lineTo(L - sideD, sideY + 0.24);
    s.lineTo(L, sideY + 0.36);
    s.lineTo(L, height);
    s.lineTo(-L, height);
    s.lineTo(-L, sideY + 0.36);
    s.lineTo(-L + sideD, sideY + 0.24);
    s.lineTo(-L + sideD, sideY);
    s.lineTo(-L, sideY - 0.12);
    s.lineTo(-L, 0);
    const g = new ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false });
    g.translate(0, 0, -thickness / 2);
    return g;
  });
}

/**
 * M.2 card outline: M-key notch in the contact edge, half-moon screw notch at
 * the far end. Built in the XY plane, then laid flat so it extends along +z.
 * Origin: centre of the contact edge, bottom face at y = 0.
 */
export function m2BoardGeometry(width: number, length: number, thickness: number, keyX: number): ExtrudeGeometry {
  return memo(`m2:${width}:${length}:${keyX}`, () => {
    const W = width / 2;
    const s = new Shape();
    s.moveTo(-W, 0);
    s.lineTo(keyX - 0.06, 0);
    s.lineTo(keyX - 0.06, 0.42);
    s.absarc(keyX, 0.42, 0.06, Math.PI, 0, true);
    s.lineTo(keyX + 0.06, 0);
    s.lineTo(W, 0);
    s.lineTo(W, length);
    s.lineTo(0.18, length);
    s.absarc(0, length, 0.18, 0, Math.PI, false);
    s.lineTo(-W, length);
    s.lineTo(-W, 0);
    const g = new ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false });
    // XY plane -> lie flat: rotateX(+90°) maps y (length) to +z and the extrusion to -y.
    g.rotateX(Math.PI / 2);
    g.translate(0, thickness, 0);
    return g;
  });
}
