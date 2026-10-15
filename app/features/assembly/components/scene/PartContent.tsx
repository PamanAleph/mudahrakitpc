import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import type { Group } from "three";
import { boardLayout, bracketV } from "../../constants/layouts";
import { cableSatisfied } from "../../engine/selectors";
import { CaseFan, fanScrewPoints } from "../../models/CaseFan";
import { PortModel } from "../../models/Connector";
import { CoolerModel, coolerCableAnchor, coolerScrewPoints } from "../../models/CoolerModel";
import { CPU_HEIGHT, CpuModel, PASTE_RADIUS } from "../../models/CpuModel";
import { DriveModel, drivePorts, driveScrewPoints } from "../../models/DriveModel";
import { GpuModel, gpuPowerPorts, gpuScrewPoints } from "../../models/GpuModel";
import { M2Ssd, M2_THICKNESS, m2LengthCm } from "../../models/M2Ssd";
import { MATERIALS } from "../../models/materials";
import { GlassPanelModel, panelScrewPoints } from "../../models/PcCaseModel";
import { PsuModel, psuOutlet, psuScrewPoints, psuSwitchPoint, psuSize } from "../../models/PsuModel";
import { RamStick } from "../../models/RamStick";
import { Box } from "../../models/primitives";
import { useInteractive } from "../../hooks/useInteractive";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { PartInstance } from "../../types/assemblyTypes";
import { runtime } from "../../utils/runtime";
import { BoardContent } from "./BoardContent";
import { Marker } from "./Marker";
import { up } from "../../utils/screwPoints";
import { ScrewSet } from "./ScrewSet";

/** The model for a part plus everything attached to it: screws, ports, cable anchors, switches. */
export function PartContent({ inst }: { inst: PartInstance }) {
  switch (inst.kind) {
    case "board":
      return <BoardContent />;
    case "cpu":
      return <CpuContent />;
    case "cooler":
      return <CoolerContent />;
    case "ram":
      return <RamContent />;
    case "m2":
      return <M2Content inst={inst} />;
    case "drive":
      return <DriveContent inst={inst} />;
    case "gpu":
      return <GpuContent />;
    case "psu":
      return <PsuContent />;
    case "fan":
      return <FanContent inst={inst} />;
    case "panel":
      return <PanelContent />;
    default:
      return null;
  }
}

/** Spins a rotor while `active()` is true; spins down when it stops. */
function useSpin(ref: RefObject<Group | null>, active: () => boolean, speed = 22) {
  const v = useRef(0);
  useFrame((_, dt) => {
    const target = active() ? speed : 0;
    v.current += (target - v.current) * Math.min(1, dt * 1.5);
    if (ref.current && v.current > 0.01) ref.current.rotation.z += v.current * dt;
  });
}

const powered = () => !!readAssembly().post?.powered;
const cablePlugged = (id: string) => {
  const s = readAssembly();
  const spec = s.cableSpecs.find((c) => c.id === id);
  return !!spec && cableSatisfied(s, spec);
};

function CpuContent() {
  const spec = useAssemblyStore((s) => s.build.cpu);
  const paste = useAssemblyStore((s) => (s.parts.cpu?.location === "mounted" ? s.paste : "none"));
  const r = PASTE_RADIUS[paste];
  return (
    <group>
      <CpuModel spec={spec} />
      {r > 0 ? (
        <mesh position={[0, CPU_HEIGHT - 0.02, 0]} scale={[1, 0.35, 1]} material={MATERIALS.paste}>
          <sphereGeometry args={[r, 20, 12]} />
        </mesh>
      ) : null}
    </group>
  );
}

function CoolerContent() {
  const spec = useAssemblyStore((s) => s.build.cooler);
  const film = useAssemblyStore((s) => !s.plasticPeeled);
  const rotor = useRef<Group>(null);
  useSpin(rotor, () => powered() && cablePlugged("cpu-fan"));
  const screws = useMemo(() => up(coolerScrewPoints(spec)), [spec]);
  return (
    <group>
      <CoolerModel spec={spec} film={film} prePaste={spec.prePasted} rotorRef={rotor} />
      <Marker map={runtime.anchors} id="cable:cooler:fan" position={coolerCableAnchor(spec)} />
      <ScrewSet partId="cooler" points={screws} />
    </group>
  );
}

function RamContent() {
  const spec = useAssemblyStore((s) => s.build.ram);
  return <RamStick spec={spec} />;
}

function M2Content({ inst }: { inst: PartInstance }) {
  const spec = useAssemblyStore((s) => s.build.storage[inst.index]);
  if (!spec) return null;
  const len = m2LengthCm(spec.m2Length);
  return (
    <group>
      <M2Ssd spec={spec} />
      <ScrewSet partId={inst.id} points={up([[0, M2_THICKNESS + 0.02, len - 0.05]])} headRadius={0.2} />
    </group>
  );
}

function DriveContent({ inst }: { inst: PartInstance }) {
  const spec = useAssemblyStore((s) => s.build.storage[inst.index]);
  const screws = useMemo(() => (spec ? driveScrewPoints(spec).map((p) => ({ p, n: [Math.sign(p[0]), 0, 0] as [number, number, number] })) : []), [spec]);
  if (!spec) return null;
  const ports = drivePorts(spec);
  return (
    <group>
      <DriveModel spec={spec} />
      <Marker map={runtime.ports} id={`${inst.id}:data`} position={ports.data} rotation={[-Math.PI / 2, 0, 0]} />
      <Marker map={runtime.ports} id={`${inst.id}:power`} position={ports.power} rotation={[-Math.PI / 2, 0, 0]} />
      <ScrewSet partId={inst.id} points={screws} />
    </group>
  );
}

function GpuContent() {
  const spec = useAssemblyStore((s) => s.build.gpu);
  const board = useAssemblyStore((s) => s.build.board);
  const geometry = useAssemblyStore((s) => s.geometry);
  const mount = useAssemblyStore((s) => s.parts.gpu?.mount ?? null);
  const fingerStart = useMemo(() => {
    const layout = boardLayout(board);
    const slotId = mount?.startsWith("pcie:") ? mount.slice(5) : board.pcieSlots.find((p) => p.kind === "pcie-x16")?.id;
    const p = slotId ? layout.pcie[slotId] : undefined;
    return p ? p.v - p.len / 2 - bracketV(geometry) : 2.6;
  }, [board, geometry, mount]);
  if (!spec) return null;
  const ports = gpuPowerPorts(spec);
  let k = 0;
  const kinds = spec.powerConnectors.flatMap((c) => Array.from({ length: c.count }, () => c.kind));
  return (
    <group>
      <GpuModel spec={spec} fingerStart={fingerStart} />
      {ports.map((p) => {
        const id = `gpu:pwr-${k}`;
        const kind = kinds[k++] ?? "pcie-8";
        return (
          <Marker key={id} map={runtime.ports} id={id} position={p} rotation={[0, Math.PI / 2, 0]}>
            <PortModel kind={kind} />
          </Marker>
        );
      })}
      <ScrewSet partId="gpu" points={up(gpuScrewPoints(spec))} headRadius={0.3} />
    </group>
  );
}

function PsuContent() {
  const spec = useAssemblyStore((s) => s.build.psu);
  const cables = useAssemblyStore((s) => s.cableSpecs);
  const rotor = useRef<Group>(null);
  useSpin(rotor, powered, 14);
  const outlets = useMemo(() => cables.flatMap((c) => (["a", "b"] as const).map((e) => c.ends[e].fixedTo).filter((f): f is { partId: string; anchor: string } => f?.partId === "psu")), [cables]);
  const screws = useMemo(() => psuScrewPoints(spec).map((p) => ({ p, n: [0, 0, -1] as [number, number, number] })), [spec]);
  const nonModular = spec.modular === "none";
  return (
    <group>
      <PsuModel spec={spec} rotorRef={rotor} />
      {outlets.map((o, i) => (
        <Marker
          key={o.anchor}
          map={runtime.anchors}
          id={`cable:psu:${o.anchor}`}
          // Non-modular cables all leave through one grommet; modular ones from their own sockets.
          position={nonModular ? [0, 0, psuSize(spec)[2] / 2 + 0.5] : psuOutlet(spec, i, outlets.length)}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}
      <PsuSwitch />
      <ScrewSet partId="psu" points={screws} />
    </group>
  );
}

function PsuSwitch() {
  const spec = useAssemblyStore((s) => s.build.psu);
  const on = useAssemblyStore((s) => s.psuSwitch);
  const p = psuSwitchPoint(spec);
  const { handlers } = useInteractive({
    id: "psu-switch",
    priority: true,
    label: () => `Saklar PSU · ${readAssembly().psuSwitch ? "I (nyala)" : "O (mati)"}`,
    onTap: () => readAssembly().togglePsuSwitch(),
  });
  return (
    <group position={p}>
      <Box size={[1.2, 0.8, 0.12]} material={MATERIALS.chip} />
      <Box size={[0.9, 0.55, 0.2]} position={[0, 0, -0.08]} rotation={[0, on ? 0.35 : -0.35, 0]} material={on ? MATERIALS.cableRed : MATERIALS.plug} />
      <mesh {...handlers} position={[0, 0, -0.4]}>
        <boxGeometry args={[2.2, 1.8, 1.2]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

function FanContent({ inst }: { inst: PartInstance }) {
  const fan = useAssemblyStore((s) => s.build.fan);
  const rotor = useRef<Group>(null);
  useSpin(rotor, () => powered() && cablePlugged(inst.id));
  const size = (fan?.sizeMm ?? 120) / 10;
  const screws = useMemo(() => fanScrewPoints(size).map((p) => ({ p, n: [0, 0, -1] as [number, number, number] })), [size]);
  return (
    <group>
      <CaseFan size={size} rotorRef={rotor} />
      <Marker map={runtime.anchors} id={`cable:${inst.id}:cable`} position={[size / 2 - 0.2, -size / 2 + 1.2, 0.6]} rotation={[0, 0, -Math.PI / 2]} />
      <ScrewSet partId={inst.id} points={screws} />
    </group>
  );
}

function PanelContent() {
  const g = useAssemblyStore((s) => s.geometry);
  const screws = useMemo(() => up(panelScrewPoints(g.L, g.D)), [g.L, g.D]);
  return (
    <group>
      <GlassPanelModel L={g.L} D={g.D} />
      <ScrewSet partId="panel" points={screws} thumb />
    </group>
  );
}
