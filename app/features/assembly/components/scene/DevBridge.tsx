import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Vector3 } from "three";
import { useAssemblyStore } from "../../store/assemblyStore";

/**
 * Development-only hooks for browser automation and debugging:
 * window.__assemblyDev.store (zustand store) and .project(x, y, z) → screen px.
 * Not rendered in production builds.
 */
export function DevBridge() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__assemblyDev = {
      store: useAssemblyStore,
      project: (x: number, y: number, z: number) => {
        const v = new Vector3(x, y, z).project(camera);
        return { x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height };
      },
    };
    return () => {
      delete w.__assemblyDev;
    };
  }, [camera, size]);
  return null;
}
