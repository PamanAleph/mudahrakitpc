import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useMemo, useRef } from "react";
import { Color, Vector3, type Group } from "three";
import {
  RAM_CARRY_Y,
  RAM_HOVER_Y,
  RAM_INSERTED_Y,
  RAM_SEAT_Y,
  RAM_SLOT_IDS,
  RAM_STICK,
  RAM_TRAY_POSE,
  ramSlotWorld,
} from "../../constants/sceneLayout";
import { HOLD_MS } from "../../constants/timings";
import { useInteractive } from "../../hooks/useInteractive";
import { MATERIALS } from "../../models/materials";
import { RamStick } from "../../models/RamStick";
import { isRamSnapValid } from "../../rules/ramRules";
import { HARDWARE } from "../../services/hardwareSpec";
import { isRamFlipped, readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { SlotId, SnapTarget } from "../../types/assemblyTypes";
import { pointerOnPlane, shakeOffset } from "../../utils/pointerPlane";
import { createSpring, snapSpring, stepSpring } from "@shared/utils/spring";
import { DAMP, SPRING } from "@shared/constants/motion";

const SNAP_RADIUS_Z = 1.1;
const SNAP_RANGE_X = 8.5;
const scratch = new Vector3();

/**
 * The DDR5 stick: tray → hand → slot → press until the latch clicks.
 * All motion is derived from store state every frame, so any transition
 * (including undo-like ones such as re-opening the latch) animates for free.
 */
export function InteractiveRam({ validColor, invalidColor }: { validColor: string; invalidColor: string }) {
  const group = useRef<Group>(null);
  const flipGroup = useRef<Group>(null);
  const shakeGroup = useRef<Group>(null);
  const ySpring = useRef(createSpring(RAM_TRAY_POSE.position[1]));
  const lastVx = useRef(0);
  const state = useAssemblyStore((s) => s.ram.state);
  const panel = useAssemblyStore((s) => s.panel);

  const pcb = useMemo(() => MATERIALS.ramPcb.clone(), []);
  const colors = useMemo(() => ({ valid: new Color(validColor), invalid: new Color(invalidColor), off: new Color(0, 0, 0) }), [validColor, invalidColor]);

  const { handlers } = useInteractive({
    id: "ram",
    label: () => `${HARDWARE.ram.name} · ${HARDWARE.ram.type} · ${HARDWARE.ram.pins} pin`,
    enabled: state === "tray" || state === "inserted" || (state === "seated" && panel === "removed"),
    getHold: () => {
      if (readAssembly().ram.state !== "inserted") return null;
      return { id: "ram-press", durationMs: HOLD_MS.ramPress, onComplete: () => readAssembly().completeRamPress() };
    },
    onTap: () => {
      const s = readAssembly();
      if (s.ram.state === "seated") s.notify("ram.alreadySeated");
      else s.pickRam();
    },
  });

  useFrame((frame, rawDt) => {
    const g = group.current;
    const flip = flipGroup.current;
    const shake = shakeGroup.current;
    if (!g || !flip || !shake) return;
    const dt = Math.min(rawDt, 0.05);
    const s = readAssembly();
    const now = performance.now();
    let snap: SnapTarget | null = null;
    let tint: Color = colors.off;

    if (s.ram.state === "held") {
      const p = pointerOnPlane(frame, RAM_HOVER_Y, scratch);
      let slot: SlotId | null = null;
      if (p && s.panel === "removed") {
        const sx = ramSlotWorld("A1")[0];
        if (Math.abs(p.x - sx) < SNAP_RANGE_X) {
          let best = Infinity;
          for (const id of RAM_SLOT_IDS) {
            const d = Math.abs(p.z - ramSlotWorld(id)[2]);
            if (d < best && d < SNAP_RADIUS_Z) {
              best = d;
              slot = id;
            }
          }
        }
      }
      if (slot) {
        const valid = isRamSnapValid({
          slot,
          latchOpen: s.latches[slot],
          flipped: isRamFlipped(s.ram.flips),
          ramType: HARDWARE.ram.type,
          slotType: HARDWARE.motherboard.ramType,
        });
        snap = { kind: "ram", slot, valid };
        const [x, , z] = ramSlotWorld(slot);
        easing.damp3(g.position, [x, RAM_HOVER_Y, z], DAMP.follow, dt);
        tint = valid ? colors.valid : colors.invalid;
      } else if (p) {
        const carry = pointerOnPlane(frame, RAM_CARRY_Y, scratch);
        if (carry) easing.damp3(g.position, [carry.x, RAM_CARRY_Y, carry.z], DAMP.follow, dt);
      }
      // Sway: lean into the direction of travel, like a part dangling from fingertips.
      const vx = (g.position.x - (g.userData.px ?? g.position.x)) / Math.max(dt, 1e-3);
      g.userData.px = g.position.x;
      lastVx.current = lastVx.current * 0.85 + vx * 0.15;
      easing.dampE(g.rotation, [0, 0, -lastVx.current * 0.004], DAMP.rotate, dt);
      snapSpring(ySpring.current, g.position.y);
    } else if (s.ram.state === "tray") {
      easing.damp3(g.position, RAM_TRAY_POSE.position, DAMP.place, dt);
      easing.dampE(g.rotation, RAM_TRAY_POSE.rotation, DAMP.place, dt);
      snapSpring(ySpring.current, g.position.y);
    } else if (s.ram.slot) {
      const [x, , z] = ramSlotWorld(s.ram.slot);
      let targetY = s.ram.state === "seated" ? RAM_SEAT_Y : RAM_INSERTED_Y;
      if (s.ram.state === "inserted" && s.hold?.id === "ram-press") {
        targetY = RAM_INSERTED_Y - (RAM_INSERTED_Y - RAM_SEAT_Y) * 0.8 * s.hold.progress;
      }
      easing.damp(g.position, "x", x, DAMP.place, dt);
      easing.damp(g.position, "z", z, DAMP.place, dt);
      // Spring on y gives the satisfying little bounce when the stick seats.
      g.position.y = stepSpring(ySpring.current, targetY, dt, SPRING.settle);
      easing.dampE(g.rotation, [0, 0, 0], DAMP.rotate, dt);
    }

    easing.damp(flip.rotation, "y", s.ram.flips * Math.PI, DAMP.rotate, dt);
    shake.position.x = shakeOffset(s.shakes.ram, now);

    // Glow tells you before you click whether the slot will accept it.
    const pulse = 0.55 + Math.sin(now * 0.008) * 0.25;
    pcb.emissive.copy(tint);
    pcb.emissiveIntensity = tint === colors.off ? 0 : pulse;
    s.setSnap(s.ram.state === "held" ? snap : s.snap?.kind === "ram" ? null : s.snap);
  });

  return (
    <group ref={group} position={RAM_TRAY_POSE.position} rotation={RAM_TRAY_POSE.rotation} {...handlers}>
      <group ref={shakeGroup}>
        <group ref={flipGroup}>
          <RamStick pcbMaterial={pcb} />
        </group>
      </group>
      <mesh position={[0, RAM_STICK.height / 2, 0]}>
        <boxGeometry args={[RAM_STICK.length + 0.4, RAM_STICK.height + 0.4, 0.9]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
