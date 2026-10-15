import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, DoubleSide, MeshBasicMaterial, type Mesh } from "three";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { FeedbackTone, Pulse } from "../../types/assemblyTypes";
import { prefersReducedMotion } from "@shared/hooks/useReducedMotion";

const LIFE_MS = 750;

/** Expanding rings where something just clicked into place. */
export function PulseLayer({ colors }: { colors: Record<FeedbackTone, string> }) {
  const pulses = useAssemblyStore((s) => s.pulses);
  if (prefersReducedMotion()) return null;
  return (
    <>
      {pulses.map((p) => (
        <PulseRing key={p.id} pulse={p} color={colors[p.tone]} />
      ))}
    </>
  );
}

function PulseRing({ pulse, color }: { pulse: Pulse; color: string }) {
  const ref = useRef<Mesh>(null);
  const mat = useMemo(
    () => new MeshBasicMaterial({ color: new Color(color), transparent: true, depthWrite: false, side: DoubleSide }),
    [color],
  );
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const t = (performance.now() - pulse.createdAt) / LIFE_MS;
    if (t >= 1) {
      readAssembly().removePulse(pulse.id);
      return;
    }
    const k = 1 - Math.pow(1 - t, 3);
    m.scale.setScalar(0.4 + k * 3.2);
    mat.opacity = 0.85 * (1 - t);
  });
  return (
    <mesh ref={ref} position={[pulse.position[0], pulse.position[1] + 0.05, pulse.position[2]]} rotation={[-Math.PI / 2, 0, 0]} material={mat} renderOrder={4}>
      <ringGeometry args={[0.55, 0.7, 40]} />
    </mesh>
  );
}
