type Vec3 = [number, number, number];

export interface ScrewPoint {
  p: Vec3;
  /** Direction the head faces (the screw goes in along −n). */
  n: Vec3;
}

/** Screws whose heads face up (+y). */
export const up = (points: Vec3[]): ScrewPoint[] => points.map((p) => ({ p, n: [0, 1, 0] }));
