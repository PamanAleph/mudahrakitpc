import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { createSpring, stepSpring } from "@shared/utils/spring";
import { SPRING } from "@shared/constants/motion";
import { RAM_SLOT_LEN, boardLayout, bracketV, uv } from "../../constants/layouts";
import { FP_PLUGS } from "../../engine/frontPanel";
import { BoardModel, DEBUG_LEDS, type DebugLedId } from "../../models/BoardModel";
import { PinHeader, PortModel } from "../../models/Connector";
import { CPU_HEIGHT, cpuFootprint } from "../../models/CpuModel";
import { MATERIALS } from "../../models/materials";
import { Box } from "../../models/primitives";
import { RamLatch } from "../../models/RamLatch";
import { SOCKET_LEVER_OPEN, SOCKET_PLATE_OPEN, SocketModel } from "../../models/SocketModel";
import { useInteractive } from "../../hooks/useInteractive";
import { boardInCase } from "../../engine/selectors";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import { runtime } from "../../utils/runtime";
import { Marker } from "./Marker";
import { up } from "../../utils/screwPoints";
import { ScrewSet } from "./ScrewSet";

const SOCKET_Y = 0.3;
const FP_PITCH = 0.254;

/** Everything on the motherboard, in board-local space. Moves with the board. */
export function BoardContent() {
  const build = useAssemblyStore((s) => s.build);
  const geometry = useAssemblyStore((s) => s.geometry);
  const ports = useAssemblyStore((s) => s.ports);
  const led = useAssemblyStore((s) => (s.post?.powered ? s.post.led : null)) as DebugLedId | null;
  const layout = useMemo(() => boardLayout(build.board), [build.board]);
  const t = layout.t;
  const bv = bracketV(geometry);

  const portPose = (id: string): { position: [number, number, number]; rotation?: [number, number, number] } | null => {
    if (id === "board:atx24") return { position: uv(t.atx24, 1.0) };
    if (id === "board:cpu_fan") return { position: uv(t.cpuFan, 0.6) };
    if (id === "board:usb3") return { position: uv(t.usb3, 0.9) };
    if (id === "board:usbc" && t.usbc) return { position: uv(t.usbc, 0.7) };
    if (id === "board:usb2" && t.usb2) return { position: uv(t.usb2, 0.7) };
    if (id === "board:audio") return { position: uv(t.audio, 0.7) };
    const i = Number(id.split("-").pop());
    if (id.startsWith("board:eps-") && layout.eps[i]) return { position: uv(layout.eps[i]!, 1.0), rotation: [0, Math.PI / 2, 0] };
    if (id.startsWith("board:sys_fan-") && layout.sysFans[i]) return { position: uv(layout.sysFans[i]!, 0.6) };
    if (id.startsWith("board:sata-") && layout.sata[i]) return { position: uv(layout.sata[i]!, 0.45), rotation: [Math.PI / 2, 0, 0] };
    return null;
  };

  return (
    <group>
      <BoardModel spec={build.board} layout={layout} led={led && DEBUG_LEDS.includes(led) ? led : null} />
      <Socket position={uv(t.socket, SOCKET_Y)} />
      <Marker map={runtime.mounts} id="socket" position={uv(t.socket, SOCKET_Y)} />
      <Marker map={runtime.mounts} id="cooler" position={uv(t.socket, SOCKET_Y + CPU_HEIGHT)} />

      {Object.entries(layout.ram).map(([id, p]) => (
        <group key={id}>
          <Marker map={runtime.mounts} id={`ram:${id}`} position={uv(p, 0.15)} />
          <Latch slot={id} position={[-(p.u + RAM_SLOT_LEN / 2), 0.05, p.v]} />
        </group>
      ))}
      {Object.entries(layout.m2).map(([id, p]) => (
        <Marker key={id} map={runtime.mounts} id={`m2:${id}`} position={uv({ u: p.u, v: p.v - 0.45 }, 0.25)} />
      ))}
      {Object.entries(layout.pcie).map(([id, p]) => (
        <Marker key={id} map={runtime.mounts} id={`pcie:${id}`} position={[-p.u, 0.35, bv]} />
      ))}

      {ports
        .filter((p) => p.owner === "board")
        .map((p) => {
          const pose = portPose(p.id);
          if (!pose) return null;
          return (
            <Marker key={p.id} map={runtime.ports} id={p.id} position={pose.position} rotation={pose.rotation}>
              <PortModel kind={p.kind} />
            </Marker>
          );
        })}

      <FrontPanelHeader position={uv(t.frontPanel, 0)} />
      <ScrewSet partId="board" points={up(t.holes.map((h) => uv(h, 0.02)))} headRadius={0.3} />
    </group>
  );
}

function Socket({ position }: { position: [number, number, number] }) {
  const cpu = useAssemblyStore((s) => s.build.cpu);
  const { x, z } = cpuFootprint(cpu);
  const lever = useRef<Group>(null);
  const plate = useRef<Group>(null);
  const springs = useRef({ lever: createSpring(0), plate: createSpring(0) });
  const lga = cpu.socket !== "AM4";
  useFrame((_, dt) => {
    const open = readAssembly().lever === "open";
    const d = Math.min(dt, 0.05);
    const l = stepSpring(springs.current.lever, open ? SOCKET_LEVER_OPEN : 0, d, SPRING.settle);
    const p = stepSpring(springs.current.plate, open ? SOCKET_PLATE_OPEN : 0, d, SPRING.settle);
    if (lever.current) lever.current.rotation.z = l;
    if (plate.current) plate.current.rotation.x = p;
  });
  const { handlers } = useInteractive({
    id: "lever",
    priority: true,
    label: () => `Tuas socket ${cpu.socket} · ${readAssembly().lever === "open" ? "terbuka" : "terkunci"}`,
    onTap: () => readAssembly().toggleLever(),
  });
  return (
    <group position={position}>
      <SocketModel fx={x} fz={z} loadingPlate={lga} leverRef={lever} plateRef={plate} />
      <mesh {...handlers} position={[0, 0.5, z / 2 + 0.9]}>
        <boxGeometry args={[x + 2.4, 1.8, 2.4]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

function Latch({ slot, position }: { slot: string; position: [number, number, number] }) {
  const ref = useRef<Group>(null);
  const spring = useRef(createSpring(0));
  useFrame((_, dt) => {
    const open = readAssembly().latches[slot] ?? false;
    const a = stepSpring(spring.current, open ? 0.85 : 0, Math.min(dt, 0.05), SPRING.click);
    if (ref.current) ref.current.rotation.z = a;
  });
  const { handlers } = useInteractive({
    id: `latch:${slot}`,
    priority: true,
    label: () => `Klip slot ${slot} · ${readAssembly().latches[slot] ? "terbuka" : "tertutup"}`,
    onTap: () => readAssembly().toggleLatch(slot),
  });
  return (
    <group position={position}>
      <group ref={ref}>
        <RamLatch />
      </group>
      <mesh {...handlers} position={[0.1, 0.7, 0]}>
        <boxGeometry args={[1.0, 1.4, 0.7]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

/** Pin n of the 2×5 header → header-local x/z. Odd pins on the −z row. */
function fpPinPosition(n: number): [number, number, number] {
  const col = Math.floor((n - 1) / 2);
  const row = n % 2 === 1 ? 0 : 1;
  return [(col - 2) * FP_PITCH, 0, (row - 0.5) * FP_PITCH];
}

function FrontPanelHeader({ position }: { position: [number, number, number] }) {
  const fp = useAssemblyStore((s) => s.frontPanel);
  const { handlers } = useInteractive({
    id: "fp-header",
    priority: true,
    label: () => "Header front panel (F_PANEL) · klik untuk mencolok kabel",
    onTap: () => {
      const s = readAssembly();
      if (!boardInCase(s)) return s.notify("fp.boardFirst");
      s.setOverlay("frontPanel");
    },
  });
  return (
    <group position={position}>
      <Marker map={runtime.anchors} id="fp-header" />
      <PinHeader cols={5} missing={[10]} />
      {Object.entries(fp).map(([plug, pins]) =>
        (pins ?? []).map((n) => {
          const [x, , z] = fpPinPosition(n);
          return <Box key={`${plug}:${n}`} size={[0.24, 0.5, 0.24]} position={[x, 0.65, z]} material={FP_PLUGS.find((p) => p.id === plug)?.id.endsWith("+") ? MATERIALS.plugLight : MATERIALS.plug} />;
        }),
      )}
      <mesh {...handlers} position={[0, 0.5, 0]}>
        <boxGeometry args={[2.2, 1.6, 1.6]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
