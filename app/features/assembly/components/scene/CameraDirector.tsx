import { CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { prefersReducedMotion } from "@shared/hooks/useReducedMotion";
import { MONITOR_POSE } from "../../constants/deskLayout";
import { benchCenter, BENCH_TOP, MAT_T, powerButtonPoint } from "../../constants/layouts";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { ViewId } from "../../types/assemblyTypes";
import { runtime } from "../../utils/runtime";

type Vec3 = [number, number, number];
const tmp = new Vector3();

/** Camera framing per view, computed from where things actually are right now. */
function framing(view: ViewId): { target: Vec3; offset: Vec3 } {
  const s = readAssembly();
  const g = s.geometry;
  const at = (map: Map<string, { getWorldPosition: (v: Vector3) => Vector3 }>, id: string, fallback: Vec3): Vec3 => {
    const o = map.get(id);
    return o ? (o.getWorldPosition(tmp).toArray() as Vec3) : fallback;
  };
  switch (view) {
    case "bench": {
      const c = benchCenter(g.L);
      return { target: [c[0] + 4, BENCH_TOP - 2, c[2] + 14], offset: [6, 50, 46] };
    }
    case "socket": {
      const p = at(runtime.mounts, "socket", benchCenter(g.L));
      return { target: [p[0], p[1], p[2] + 3], offset: [5, 26, 24] };
    }
    case "caseInside":
      return { target: [0, MAT_T + 4, 2], offset: [0, 78, 34] };
    case "caseLower":
      return { target: [-g.L / 4, MAT_T + 6, 4], offset: [-8, 46, 40] };
    case "rear":
      return { target: [0, MAT_T + g.H / 2, -g.D / 2], offset: [10, 34, -62] };
    case "frontPanel": {
      const p = at(runtime.anchors, "fp-header", [0, MAT_T, 0]);
      return { target: p, offset: [-6, 26, 22] };
    }
    case "power": {
      const p = powerButtonPoint(g);
      return { target: [p[0] - 6, p[1] - 4, p[2] - 4], offset: [44, 26, 34] };
    }
    case "monitor": {
      const m = MONITOR_POSE.position;
      return { target: [m[0] + 18, 22, m[2] + 30], offset: [18, 26, 92] };
    }
    case "overview":
    default:
      return { target: [-2, 4, -6], offset: [0, 140, 124] };
  }
}

/**
 * Orbit camera (drag to rotate, wheel/pinch to zoom) that glides to the
 * framing of the current task's view whenever it changes.
 */
export function CameraDirector() {
  const ref = useRef<CameraControls>(null);
  const view = useAssemblyStore((s) => s.view);
  const nonce = useAssemblyStore((s) => s.viewNonce);

  useEffect(() => {
    runtime.controls = ref.current;
    return () => {
      runtime.controls = null;
    };
  }, []);

  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    // Narrow (portrait) screens see less sideways: back the camera off so the framing still fits.
    const k = Math.pow(Math.max(1, 1.6 / aspect), 0.75);
    // Wait a frame so newly mounted markers (socket, header) have world matrices.
    const id = requestAnimationFrame(() => {
      const { target, offset } = framing(view);
      const [ox, oy, oz] = offset.map((v) => v * k) as Vec3;
      void c.setLookAt(target[0] + ox, target[1] + oy, target[2] + oz, target[0], target[1], target[2], !prefersReducedMotion());
    });
    return () => cancelAnimationFrame(id);
  }, [view, nonce, aspect]);

  return <CameraControls ref={ref} makeDefault minDistance={14} maxDistance={440} maxPolarAngle={Math.PI * 0.47} smoothTime={0.45} draggingSmoothTime={0.12} />;
}
