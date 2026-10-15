import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { createSpring, stepSpring } from "@shared/utils/spring";
import { SPRING } from "@shared/constants/motion";
import { BOARD_TOP_IN_CASE, MAT_T, SLOT_PITCH, STANDOFF_H, TRAY_TOP, WALL, bayPose, fanMountPose, firstSlotU, frontCableAnchor, powerButtonPoint } from "../../constants/layouts";
import { boardInCase, isMounted, panelOff } from "../../engine/selectors";
import { MATERIALS } from "../../models/materials";
import { PcCaseModel } from "../../models/PcCaseModel";
import { Box, Cyl } from "../../models/primitives";
import { useInteractive } from "../../hooks/useInteractive";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import { runtime } from "../../utils/runtime";
import { Marker } from "./Marker";

/** The chassis plus its mounts, standoffs, slot covers, grommets and the power button. */
export function CaseRig() {
  const spec = useAssemblyStore((s) => s.build.case);
  const g = useAssemblyStore((s) => s.geometry);
  const cables = useAssemblyStore((s) => s.cableSpecs);
  const caseAnchors = [...new Set(cables.flatMap((c) => (["a", "b"] as const).map((e) => c.ends[e].fixedTo).filter((f) => f?.partId === "case").map((f) => f!.anchor)))];

  return (
    <group>
      <PcCaseModel spec={spec} g={g} />
      <Marker map={runtime.mounts} id="case-board" position={[g.anchor.x, BOARD_TOP_IN_CASE, g.anchor.z]} />
      <Marker map={runtime.mounts} id="psu-bay" position={g.psu.center} />
      <Marker map={runtime.mounts} id="panel" position={[0, MAT_T + g.H, 0]} />
      {spec.fanMounts.map((m) => {
        const p = fanMountPose(m, g);
        return <Marker key={m.id} map={runtime.mounts} id={`fan:${m.id}`} position={p.position} rotation={p.rotation} />;
      })}
      {spec.driveBays.map((b) => {
        const p = bayPose(b);
        return <Marker key={b.id} map={runtime.mounts} id={`bay:${b.id}`} position={p.position} rotation={p.rotation} />;
      })}
      {caseAnchors.map((a) => (
        <Marker key={a} map={runtime.anchors} id={`cable:case:${a}`} position={frontCableAnchor(g, a)} />
      ))}
      <Marker map={runtime.anchors} id="cable:case:fp" position={frontCableAnchor(g, "fp")} />
      {spec.grommets.map((gr) => (
        <Marker key={gr.id} map={runtime.anchors} id={`grommet:${gr.id}`} position={[gr.x, TRAY_TOP + 0.4, gr.z]} />
      ))}
      {g.holes.map((h) => (
        <Standoff key={h.key} hole={h} />
      ))}
      {Array.from({ length: spec.expansionSlots }, (_, i) => (
        <SlotCover key={i} index={i} x={g.anchor.x - firstSlotU(spec) - i * SLOT_PITCH} z={-g.D / 2 + WALL + 0.08} />
      ))}
      <PowerButton />
    </group>
  );
}

function Standoff({ hole }: { hole: { key: string; x: number; z: number; formFactors: string[] } }) {
  const on = useAssemblyStore((s) => !!s.standoffs[hole.key]);
  const editable = useAssemblyStore((s) => panelOff(s) && !boardInCase(s));
  const { handlers } = useInteractive({
    id: `standoff:${hole.key}`,
    enabled: editable,
    label: () => `Lubang standoff · cocok untuk ${hole.formFactors.join(", ")} · ${readAssembly().standoffs[hole.key] ? "terpasang" : "kosong"}`,
    onTap: () => readAssembly().toggleStandoff(hole.key),
  });
  return (
    <group position={[hole.x, TRAY_TOP, hole.z]}>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MATERIALS.chip}>
        <ringGeometry args={[0.16, 0.34, 20]} />
      </mesh>
      {on ? <Cyl radius={0.26} height={STANDOFF_H} position={[0, STANDOFF_H / 2, 0]} material={MATERIALS.standoff} segments={6} /> : null}
      <mesh {...handlers} position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.9, 1.2]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

function SlotCover({ index, x, z }: { index: number; x: number; z: number }) {
  const removed = useAssemblyStore((s) => !!s.slotCovers[index]);
  const enabled = useAssemblyStore((s) => panelOff(s) && !isMounted(s, "gpu"));
  const { handlers } = useInteractive({
    id: `cover:${index}`,
    enabled,
    label: () => `Penutup slot ekspansi ${index + 1} · ${readAssembly().slotCovers[index] ? "dilepas" : "terpasang"}`,
    onTap: () => readAssembly().toggleCover(index),
  });
  const y = BOARD_TOP_IN_CASE + 6.4;
  return (
    <group position={[x, y, z]}>
      {removed ? null : (
        <>
          <Box size={[SLOT_PITCH - 0.3, 11.6, 0.06]} material={MATERIALS.steelBright} />
          {[-3, -1, 1, 3].map((dy) => (
            <Box key={dy} size={[SLOT_PITCH - 0.9, 0.5, 0.08]} position={[0, dy, 0.01]} material={MATERIALS.caseSteelInner} />
          ))}
          <Box size={[SLOT_PITCH - 0.3, 0.06, 1.0]} position={[0, 5.9, 0.5]} material={MATERIALS.steelBright} />
        </>
      )}
      <mesh {...handlers} position={[0, 0, 0.5]}>
        <boxGeometry args={[SLOT_PITCH - 0.2, 11.8, 1.0]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

function PowerButton() {
  const g = useAssemblyStore((s) => s.geometry);
  const ref = useRef<Group>(null);
  const spring = useRef(createSpring(0));
  const pressedAt = useRef(0);
  useFrame((_, dt) => {
    const pressed = performance.now() - pressedAt.current < 180;
    const d = stepSpring(spring.current, pressed ? -0.25 : 0, Math.min(dt, 0.05), SPRING.click);
    if (ref.current) ref.current.position.x = d;
  });
  const { handlers } = useInteractive({
    id: "power-button",
    priority: true,
    label: () => "Tombol power casing",
    onTap: () => {
      pressedAt.current = performance.now();
      readAssembly().pressPower();
    },
  });
  const p = powerButtonPoint(g);
  return (
    <group position={p}>
      <group ref={ref}>
        <Cyl radius={0.9} height={0.3} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.bezelPlastic} segments={28} />
        <PowerLed />
      </group>
      <mesh {...handlers} position={[0.6, 0, 0]}>
        <boxGeometry args={[1.6, 2.6, 2.6]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

function PowerLed() {
  const on = useAssemblyStore((s) => !!s.post?.powered && !!s.frontPanel["PLED+"]);
  return (
    <mesh position={[0.16, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={on ? MATERIALS.ledGreen : MATERIALS.chip}>
      <ringGeometry args={[0.55, 0.68, 28]} />
    </mesh>
  );
}
