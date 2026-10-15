import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, MeshBasicMaterial, type Mesh } from "three";
import { BOARD_TOP, RAM_SLOT, SSD_BOARD, SSD_INSTALLED, ramSlotWorld } from "../../constants/sceneLayout";
import { readAssembly } from "../../store/assemblyStore";

/** Glowing outline on the mount point the held part is aimed at: green = will fit, red = won't. */
export function SnapIndicator({ validColor, invalidColor }: { validColor: string; invalidColor: string }) {
  const ram = useRef<Mesh>(null);
  const m2 = useRef<Mesh>(null);
  const mat = useMemo(() => new MeshBasicMaterial({ transparent: true, opacity: 0.6, depthWrite: false }), []);
  const colors = useMemo(() => ({ valid: new Color(validColor), invalid: new Color(invalidColor) }), [validColor, invalidColor]);

  useFrame(() => {
    const snap = readAssembly().snap;
    const pulse = 0.45 + Math.sin(performance.now() * 0.009) * 0.2;
    mat.opacity = pulse;
    if (ram.current) {
      ram.current.visible = snap?.kind === "ram";
      if (snap?.kind === "ram") {
        const [x, , z] = ramSlotWorld(snap.slot);
        ram.current.position.set(x - 0.45, BOARD_TOP + RAM_SLOT.height + 0.04, z);
        mat.color.copy(snap.valid ? colors.valid : colors.invalid);
      }
    }
    if (m2.current) {
      m2.current.visible = snap?.kind === "m2";
      if (snap?.kind === "m2") mat.color.copy(colors.valid);
    }
  });

  return (
    <>
      <mesh ref={ram} material={mat} visible={false} renderOrder={3}>
        <boxGeometry args={[RAM_SLOT.length - 0.5, 0.06, 1.0]} />
      </mesh>
      <mesh ref={m2} material={mat} visible={false} position={[SSD_INSTALLED[0], BOARD_TOP + 0.6, SSD_INSTALLED[2] - 0.3]} renderOrder={3}>
        <boxGeometry args={[SSD_BOARD.width + 0.8, 0.06, 1.2]} />
      </mesh>
    </>
  );
}
