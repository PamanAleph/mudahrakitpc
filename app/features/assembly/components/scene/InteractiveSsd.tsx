import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useMemo, useRef } from "react";
import { Color, Vector3, type Group } from "three";
import { BOARD_TOP, SSD_BOARD, SSD_INSTALLED, SSD_TRAY_POSE } from "../../constants/sceneLayout";
import { HOLD_MS } from "../../constants/timings";
import { useInteractive } from "../../hooks/useInteractive";
import { M2Ssd } from "../../models/M2Ssd";
import { MATERIALS } from "../../models/materials";
import { HARDWARE } from "../../services/hardwareSpec";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { SnapTarget } from "../../types/assemblyTypes";
import { pointerOnPlane } from "../../utils/pointerPlane";
import { createSpring, snapSpring, stepSpring } from "@shared/utils/spring";
import { DAMP, SPRING } from "@shared/constants/motion";

const CARRY_Y = BOARD_TOP + 3.5;
const HOVER_Y = BOARD_TOP + 1.3;
const scratch = new Vector3();

/**
 * The M.2 card: in at an angle, pressed flat (it springs back up if you let go
 * early, like the real thing), then held down by the screw.
 */
export function InteractiveSsd({ validColor }: { validColor: string }) {
  const group = useRef<Group>(null);
  const tilt = useRef(createSpring(0));
  const state = useAssemblyStore((s) => s.ssd);
  const pcb = useMemo(() => MATERIALS.ssdPcb.clone(), []);
  const valid = useMemo(() => new Color(validColor), [validColor]);

  const { handlers } = useInteractive({
    id: "ssd",
    label: () => `${HARDWARE.ssd.name} · ${HARDWARE.ssd.formFactor} · ${HARDWARE.ssd.key}-key`,
    enabled: state !== "held",
    getHold: () => {
      if (readAssembly().ssd !== "angled") return null;
      return { id: "ssd-press", durationMs: HOLD_MS.ssdPress, onComplete: () => readAssembly().completeSsdPress() };
    },
    onTap: () => {
      const s = readAssembly();
      if (s.ssd === "flat") s.notify("ssd.needsScrew");
      else if (s.ssd === "secured") s.notify("standoff.done");
      else s.pickSsd();
    },
  });

  useFrame((frame, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.05);
    const s = readAssembly();
    let snap: SnapTarget | null = null;
    let glow = false;

    switch (s.ssd) {
      case "tray":
        easing.damp3(g.position, SSD_TRAY_POSE.position, DAMP.place, dt);
        easing.dampE(g.rotation, SSD_TRAY_POSE.rotation, DAMP.place, dt);
        snapSpring(tilt.current, g.rotation.x);
        break;
      case "held": {
        const p = pointerOnPlane(frame, HOVER_Y, scratch);
        const [cx, , cz] = SSD_INSTALLED;
        const near = !!p && s.panel === "removed" && Math.abs(p.x - cx) < 3 && p.z > cz - 3 && p.z < cz + SSD_BOARD.length;
        if (near) {
          snap = { kind: "m2", valid: true };
          glow = true;
          easing.damp3(g.position, [cx, HOVER_Y, cz], DAMP.follow, dt);
          easing.dampE(g.rotation, [SSD_BOARD.tilt, 0, 0], DAMP.rotate, dt);
        } else {
          const c = pointerOnPlane(frame, CARRY_Y, scratch);
          // Hold it by the far end so the contact edge leads toward the slot.
          if (c) easing.damp3(g.position, [c.x, CARRY_Y, c.z - SSD_BOARD.length * 0.6], DAMP.follow, dt);
          easing.dampE(g.rotation, [-0.15, 0, 0], DAMP.rotate, dt);
        }
        snapSpring(tilt.current, g.rotation.x);
        break;
      }
      default: {
        easing.damp3(g.position, SSD_INSTALLED, DAMP.place, dt);
        let target = s.ssd === "angled" ? SSD_BOARD.tilt : 0;
        if (s.ssd === "angled" && s.hold?.id === "ssd-press") target = SSD_BOARD.tilt * (1 - s.hold.progress);
        g.rotation.x = stepSpring(tilt.current, target, dt, SPRING.click);
        g.rotation.y = 0;
        g.rotation.z = 0;
      }
    }

    pcb.emissive.copy(glow ? valid : new Color(0, 0, 0));
    pcb.emissiveIntensity = glow ? 0.5 + Math.sin(performance.now() * 0.008) * 0.2 : 0;
    s.setSnap(s.ssd === "held" ? snap : s.snap?.kind === "m2" ? null : s.snap);
  });

  return (
    <group ref={group} position={SSD_TRAY_POSE.position} {...handlers}>
      <M2Ssd pcbMaterial={pcb} />
      <mesh position={[0, 0.3, (SSD_BOARD.length - 0.9) / 2]}>
        <boxGeometry args={[SSD_BOARD.width + 0.6, 0.9, SSD_BOARD.length - 0.9]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
