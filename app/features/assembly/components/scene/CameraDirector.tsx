import { CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef, type ElementRef } from "react";
import { VIEWS, viewFitScale } from "../../constants/views";
import { useAssemblyStore } from "../../store/assemblyStore";
import { runtime } from "../../utils/interactionRuntime";
import { prefersReducedMotion } from "@shared/hooks/useReducedMotion";

/** Orbit camera from the builder's seat, with smooth moves between work areas. */
export function CameraDirector() {
  const ref = useRef<ElementRef<typeof CameraControls>>(null);
  const view = useAssemblyStore((s) => s.view);
  const nonce = useAssemblyStore((s) => s.viewNonce);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const first = useRef(true);

  useEffect(() => {
    runtime.controls = ref.current;
    return () => {
      runtime.controls = null;
    };
  }, []);

  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    const v = VIEWS[view];
    const k = viewFitScale(aspect);
    const [tx, ty, tz] = v.target;
    const [ox, oy, oz] = v.offset;
    const animate = !first.current && !prefersReducedMotion();
    first.current = false;
    void controls.setLookAt(tx + ox * k, ty + oy * k, tz + oz * k, tx, ty, tz, animate);
  }, [view, nonce, aspect]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={8}
      maxDistance={190}
      minPolarAngle={0.12}
      maxPolarAngle={1.32}
      minAzimuthAngle={-1.2}
      maxAzimuthAngle={1.2}
      smoothTime={0.35}
      draggingSmoothTime={0.12}
      dollySpeed={0.6}
    />
  );
}
