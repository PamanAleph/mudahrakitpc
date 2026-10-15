import { StageCanvas } from "@shared/components/three/StageCanvas";
import { readAssembly } from "../../store/assemblyStore";
import { AssemblyScene } from "./AssemblyScene";

/**
 * Lazy-loaded entry for the 3D chunk (three, drei, models). Kept separate so
 * the HUD paints before any WebGL code is downloaded.
 */
export default function AssemblySceneRoot({ onContextLost }: { onContextLost: () => void }) {
  return (
    <StageCanvas
      label="Meja rakit 3D. Casing PC rebah di atas alas antistatis dengan panel kaca menghadap ke atas. Di kiri ada kotak motherboard sebagai alas kerja, di depan komponen kecil, di kanan PSU, VGA dan kipas."
      camera={{ fov: 40, near: 0.5, far: 1200, position: [4, 118, 110] }}
      onContextLost={onContextLost}
      onPointerMissed={() => {
        const s = readAssembly();
        if (s.held) s.placeHeld();
      }}
    >
      <AssemblyScene />
    </StageCanvas>
  );
}
