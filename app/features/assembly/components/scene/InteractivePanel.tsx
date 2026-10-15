import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, Vector3, type Group } from "three";
import { PANEL_REST, PANEL_SCREW_IDS, PANEL_SCREW_LOCAL, PANEL_Y } from "../../constants/sceneLayout";
import { HOLD_MS, PANEL_REMOVE_MS } from "../../constants/timings";
import { useInteractive } from "../../hooks/useInteractive";
import { SideGlassPanel } from "../../models/SideGlassPanel";
import { Thumbscrew } from "../../models/Screws";
import { PANEL_SCREW } from "../../services/hardwareSpec";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { PanelScrewId } from "../../types/assemblyTypes";
import { prefersReducedMotion } from "@shared/hooks/useReducedMotion";
import { shakeOffset } from "../../utils/pointerPlane";

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Glass side panel: unscrew all four, then lift it off and set it aside. */
export function InteractivePanel() {
  const group = useRef<Group>(null);
  const panel = useAssemblyStore((s) => s.panel);

  const glass = useInteractive({
    id: "panel",
    label: () => {
      const left = Object.values(readAssembly().panelScrews).filter((p) => !p.removed).length;
      return left ? `Panel kaca · ${left} baut tersisa` : "Panel kaca · klik untuk angkat";
    },
    enabled: panel === "attached",
    onTap: () => readAssembly().removePanel(),
  });

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const s = readAssembly();
    const now = performance.now();
    if (s.panel === "attached") {
      g.position.set(shakeOffset(s.shakes.panel, now, 0.3), PANEL_Y, 0);
      g.rotation.set(0, 0, 0);
      return;
    }
    const t = prefersReducedMotion() ? 1 : MathUtils.clamp((now - s.panelRemovedAt) / PANEL_REMOVE_MS, 0, 1);
    const lift = 10;
    const [rx, ry, rz] = PANEL_REST.position;
    if (t < 0.3) {
      // Lift straight up, tipping slightly toward the builder.
      const k = smooth(t / 0.3);
      g.position.set(0, PANEL_Y + lift * k, 0);
      g.rotation.set(0.12 * k, 0, 0);
    } else {
      // Carry it across in an arc and lay it flat on the desk.
      const k = smooth((t - 0.3) / 0.7);
      g.position.set(MathUtils.lerp(0, rx, k), MathUtils.lerp(PANEL_Y + lift, ry, k) + Math.sin(k * Math.PI) * 6, MathUtils.lerp(0, rz, k));
      g.rotation.set(0.12 * (1 - k), PANEL_REST.rotation[1] * k, 0);
    }
  });

  return (
    <group ref={group} position={[0, PANEL_Y, 0]}>
      <group {...glass.handlers}>
        <SideGlassPanel />
      </group>
      {PANEL_SCREW_IDS.map((id) => (
        <PanelScrew key={id} id={id} />
      ))}
    </group>
  );
}

function PanelScrew({ id }: { id: PanelScrewId }) {
  const ref = useRef<Group>(null);
  const removed = useAssemblyStore((s) => s.panelScrews[id].removed);
  const panel = useAssemblyStore((s) => s.panel);
  const base = PANEL_SCREW_LOCAL[id];
  const turns = PANEL_SCREW.turnsToRemove;

  const { handlers } = useInteractive({
    id: `panel-screw-${id}`,
    label: () => `${PANEL_SCREW.name} · ${PANEL_SCREW.thread}`,
    enabled: !removed && panel === "attached",
    anchor: () => (ref.current ? { object: ref.current, offset: [0, 0.55, 0] } : null),
    getHold: () => {
      const s = readAssembly();
      if (!s.beginPanelScrew() || !ref.current) return "handled";
      const object = ref.current;
      return {
        id: `panel-screw-${id}`,
        durationMs: HOLD_MS.panelScrew,
        initialProgress: s.panelScrews[id].progress,
        anchor: { object, offset: [0, 0.55, 0] },
        onProgress: (p) => readAssembly().setPanelScrewProgress(id, p),
        onComplete: () => {
          const w = object.getWorldPosition(new Vector3());
          readAssembly().completePanelScrew(id, [w.x, w.y, w.z]);
        },
      };
    },
    onTap: () => readAssembly().notify("screw.holdToTurn"),
  });

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = readAssembly().panelScrews[id].progress;
    // Rises by thread pitch per turn while it spins out.
    g.position.set(base[0], base[1] + p * 0.85, base[2]);
    g.rotation.y = -p * turns * Math.PI * 2;
  });

  if (removed) return null;
  return (
    <group ref={ref} position={base} {...handlers}>
      <Thumbscrew />
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 1.2, 12]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
