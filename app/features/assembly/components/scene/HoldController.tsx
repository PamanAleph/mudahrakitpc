import { useFrame } from "@react-three/fiber";
import { readAssembly } from "../../store/assemblyStore";

/** Advances the active hold gesture once per frame. */
export function HoldController() {
  useFrame((_, dt) => {
    if (readAssembly().hold) readAssembly().tickHold(Math.min(dt, 0.05));
  });
  return null;
}
