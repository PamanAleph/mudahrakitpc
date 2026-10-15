import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useEffect, useMemo, useRef } from "react";
import { Vector3, type Group } from "three";
import { BOARD_TOP, PANEL_Y, SCREWDRIVER_REST } from "../../constants/sceneLayout";
import { MATERIALS } from "../../models/materials";
import { Screwdriver } from "../../models/Screwdriver";
import { M2_SCREW, PANEL_SCREW } from "../../services/hardwareSpec";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { BitId } from "../../types/assemblyTypes";
import { runtime } from "../../utils/interactionRuntime";
import { pointerOnPlane, shakeOffset } from "../../utils/pointerPlane";
import { createSpring, snapSpring, stepSpring } from "@shared/utils/spring";
import { SPRING } from "@shared/constants/motion";

const TILT_TOWARD_BUILDER = 0.24;
const scratch = new Vector3();
const anchorPos = new Vector3();

/**
 * The screwdriver is the builder's hand when a bit is selected: it follows
 * the pointer, locks onto screw heads, and spins while a screw is turned.
 * With the hand tool selected it lies on the mat.
 */
export function ScrewdriverRig({ gripColor }: { gripColor: string }) {
  const body = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const tip = useRef<Group>(null);
  const pop = useRef(createSpring(1));
  const spinAngle = useRef(0);
  const tool = useAssemblyStore((s) => s.tool);
  const lastBit = useRef<BitId>("PH2");
  if (tool !== "hand") lastBit.current = tool;

  const grip = useMemo(() => MATERIALS.handleGrip.clone(), []);
  grip.color.set(gripColor);

  useEffect(() => {
    // Bit swap: the tip pops in with a quick spin.
    if (tool === "hand") return;
    snapSpring(pop.current, 0.4);
    spinAngle.current += Math.PI * 2;
  }, [tool]);

  useFrame((frame, rawDt) => {
    const g = body.current;
    const sp = spin.current;
    const tp = tip.current;
    if (!g || !sp || !tp) return;
    const dt = Math.min(rawDt, 0.05);
    const s = readAssembly();

    if (s.tool === "hand") {
      easing.damp3(g.position, SCREWDRIVER_REST.position, 0.2, dt);
      easing.dampE(g.rotation, SCREWDRIVER_REST.rotation, 0.2, dt);
    } else {
      const anchor = s.hold?.anchor ?? s.hover?.anchor ?? null;
      let target: Vector3 | null = null;
      if (anchor) {
        target = anchor.object.getWorldPosition(anchorPos).add(scratch.set(...anchor.offset));
      } else {
        target = pointerOnPlane(frame, s.panel === "attached" ? PANEL_Y + 1.4 : BOARD_TOP + 2.6, scratch);
      }
      if (target) {
        const locked = !!anchor;
        easing.damp3(g.position, target, locked ? 0.05 : 0.08, dt);
      }
      g.position.x += shakeOffset(s.shakes.screwdriver, performance.now(), 0.35);
      easing.dampE(g.rotation, [TILT_TOWARD_BUILDER, 0, 0], 0.15, dt);
    }

    // Spin follows the screw being turned, so driver and screw stay in sync.
    const hold = s.hold;
    if (hold && (hold.id.startsWith("panel-screw") || hold.id === "m2-screw")) {
      const turns = hold.id === "m2-screw" ? M2_SCREW.turnsToRemove : PANEL_SCREW.turnsToRemove;
      sp.rotation.y = -hold.progress * turns * Math.PI * 2;
    } else {
      easing.damp(sp.rotation, "y", spinAngle.current, 0.25, dt);
    }
    const sc = stepSpring(pop.current, 1, dt, SPRING.click);
    tp.scale.setScalar(Math.max(0.2, sc));

    tp.getWorldPosition(runtime.toolTip);
  });

  return (
    <group ref={body} position={SCREWDRIVER_REST.position} rotation={SCREWDRIVER_REST.rotation}>
      <group ref={spin}>
        <group ref={tip}>
          <Screwdriver bit={lastBit.current} gripMaterial={grip} />
        </group>
      </group>
    </group>
  );
}
