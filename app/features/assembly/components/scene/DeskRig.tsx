import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, Euler, Quaternion, SRGBColorSpace, Vector3, type Group } from "three";
import { easing } from "maath";
import type { ResolvedBuild } from "@shared/hardware";
import { useCssTokens } from "@shared/hooks/useCssTokens";
import { MONITOR_POSE, SCREWDRIVER_REST, STRAP_POINT, SYRINGE_REST, benchBoardPose } from "../../constants/deskLayout";
import { BENCH_BOX, MAT_T, benchCenter } from "../../constants/layouts";
import { driveDetected } from "../../engine/selectors";
import { Desk } from "../../models/Desk";
import { BoardBoxModel, MonitorModel, PasteSyringeModel, WristStrapModel } from "../../models/DeskProps";
import { MATERIALS } from "../../models/materials";
import { Screwdriver } from "../../models/Screwdriver";
import { useInteractive } from "../../hooks/useInteractive";
import { readAssembly, useAssemblyStore } from "../../store/assemblyStore";
import type { AssemblySnapshot, BitId } from "../../types/assemblyTypes";
import { fastenersFor } from "../../engine/parts";
import { pointerOnPlane } from "../../utils/pointerPlane";
import { runtime, worldPose } from "../../utils/runtime";
import { Marker } from "./Marker";

const SCENE_TOKENS = ["--scene-desk", "--scene-mat"] as const;

/** Desk, mat, board box (the bench), monitor, wrist strap and the hand tools. */
export function DeskRig() {
  const build = useAssemblyStore((s) => s.build);
  const g = useAssemblyStore((s) => s.geometry);
  const tokens = useCssTokens(SCENE_TOKENS, "#888888");
  const bench = benchCenter(g.L);
  const boardPose = benchBoardPose(build, g);
  return (
    <group>
      <Desk deskColor={tokens["--scene-desk"]} matColor={tokens["--scene-mat"]} />
      <group position={bench}>
        <BoardBoxModel size={BENCH_BOX.size} />
      </group>
      <Marker map={runtime.mounts} id="bench" position={boardPose.position} />
      <Monitor />
      <Strap />
      <ToolRig />
    </group>
  );
}

function Strap() {
  const worn = useAssemblyStore((s) => s.strap);
  const { handlers } = useInteractive({
    id: "strap",
    priority: true,
    label: () => (readAssembly().strap ? "Gelang antistatis · terpakai (klik untuk melepas)" : "Gelang antistatis · klik untuk memakai"),
    onTap: () => readAssembly().toggleStrap(),
  });
  return (
    <group position={STRAP_POINT}>
      <WristStrapModel worn={worn} />
      <mesh {...handlers} position={[-4, 1, -1]}>
        <boxGeometry args={[11, 2.5, 7]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

/** Screwdriver and paste syringe: lie on the mat until picked, then follow the pointer tip-down. */
function ToolRig() {
  const tool = useAssemblyStore((s) => s.tool);
  const driver = useRef<Group>(null);
  const syringe = useRef<Group>(null);
  const bit: BitId = tool === "PH0" || tool === "PH1" || tool === "PH2" ? tool : "PH2";
  const spin = useRef(0);

  useFrame((state, dt) => {
    const s = readAssembly();
    const bitInHand = s.tool !== "hand" && s.tool !== "paste";
    const d = driver.current;
    const y = syringe.current;
    if (d) {
      const screw = bitInHand ? nextScrewAnchor(s) : null;
      if (screw && worldPose(runtime.anchors, screw, aimPos, aimQuat)) {
        // Lock onto the screw being driven (or the next one), along its axis.
        easing.damp3(d.position, aimPos, 0.05, dt);
        const turning = s.hold?.id === `fasten:${screw.split(":")[1]}`;
        if (turning) spin.current += dt * 9 * s.fastenDirection(screw.split(":")[1]!);
        easing.dampQ(d.quaternion, aimQuat.multiply(spinQ.setFromAxisAngle(UP, spin.current)), 0.06, dt);
      } else if (bitInHand) {
        const target = runtime.hitValid ? runtime.hitPoint : pointerOnPlane(state, MAT_T + 22);
        if (target) easing.damp3(d.position, [target.x, target.y + 0.35, target.z], 0.05, dt);
        easing.dampQ(d.quaternion, aimQuat.identity(), 0.1, dt);
      } else {
        easing.damp3(d.position, SCREWDRIVER_REST.position, 0.18, dt);
        easing.dampQ(d.quaternion, aimQuat.setFromEuler(euler.set(...SCREWDRIVER_REST.rotation)), 0.18, dt);
      }
    }
    if (y) {
      if (s.tool === "paste") {
        const target = runtime.hitValid ? runtime.hitPoint : pointerOnPlane(state, MAT_T + 22);
        if (target) easing.damp3(y.position, [target.x, target.y + 0.35, target.z], 0.05, dt);
        easing.dampE(y.rotation, [0, 0, 0], 0.1, dt);
      } else {
        easing.damp3(y.position, SYRINGE_REST.position, 0.18, dt);
        easing.dampE(y.rotation, SYRINGE_REST.rotation, 0.18, dt);
      }
    }
  });

  return (
    <group>
      <group ref={driver} position={SCREWDRIVER_REST.position} rotation={SCREWDRIVER_REST.rotation}>
        <Screwdriver bit={bit} gripMaterial={MATERIALS.handleGrip} />
      </group>
      <group ref={syringe} position={SYRINGE_REST.position} rotation={SYRINGE_REST.rotation}>
        <PasteSyringeModel />
      </group>
    </group>
  );
}

const aimPos = new Vector3();
const aimQuat = new Quaternion();
const spinQ = new Quaternion();
const euler = new Euler();
const UP = new Vector3(0, 1, 0);

/** The screw the screwdriver should sit on: the one being turned, else the next one of the hovered part. */
function nextScrewAnchor(s: ReturnType<typeof readAssembly>): string | null {
  const partId = s.hold?.id.startsWith("fasten:") ? s.hold.id.slice(7) : s.hover?.id;
  if (!partId) return null;
  const inst = s.instances.find((p) => p.id === partId);
  const f = inst ? fastenersFor(s.build, inst) : null;
  const st = s.parts[partId];
  if (!f || !st || st.location !== "mounted") return null;
  const done = st.fastened * f.count;
  const i = s.fastenDirection(partId) === 1 ? Math.floor(done) : Math.ceil(done) - 1;
  return `screw:${partId}:${Math.min(f.count - 1, Math.max(0, i))}`;
}

function Monitor() {
  const post = useAssemblyStore((s) => s.post);
  const canvas = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 576;
    return c;
  }, []);
  const texture = useMemo(() => {
    if (!canvas) return null;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [canvas]);

  useEffect(() => {
    if (!canvas || !texture) return;
    drawScreen(canvas, readAssembly());
    texture.needsUpdate = true;
  }, [post, canvas, texture]);

  if (!texture) return null;
  return (
    <group position={MONITOR_POSE.position} rotation={MONITOR_POSE.rotation}>
      <MonitorModel screen={texture} />
    </group>
  );
}

function drawScreen(c: HTMLCanvasElement, s: AssemblySnapshot) {
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const { width: W, height: H } = c;
  ctx.fillStyle = "#050607";
  ctx.fillRect(0, 0, W, H);
  const post = s.post;
  if (!post || !post.powered) return;
  ctx.font = '500 26px "IBM Plex Mono", monospace';
  ctx.textBaseline = "top";
  if (!post.booted && post.led !== "BOOT") {
    ctx.fillStyle = "rgba(220, 224, 230, 0.75)";
    ctx.fillText("Tidak ada sinyal", 48, H - 80);
    return;
  }
  const b = s.build;
  const lines = firmwareLines(b, s);
  ctx.fillStyle = "#18213a";
  ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = "#e8ebf0";
  ctx.font = '600 28px "IBM Plex Mono", monospace';
  ctx.fillText("FIRMWARE SETUP · simulasi", 40, 18);
  ctx.font = '500 25px "IBM Plex Mono", monospace';
  lines.forEach((l, i) => {
    ctx.fillStyle = l.startsWith("!") ? "#ff9b7a" : "#cfd5de";
    ctx.fillText(l.replace(/^!/, ""), 40, 100 + i * 44);
  });
}

function firmwareLines(b: ResolvedBuild, s: AssemblySnapshot): string[] {
  const ram = b.ram.sticks * b.ram.capacityGbPerStick;
  const drives = b.storage.map((d, i) => {
    const det = driveDetected(s, i);
    return det.ok ? `  ${d.name}` : `! ${d.name} tidak terdeteksi`;
  });
  return [
    `CPU      ${b.cpu.name}`,
    `Memori   ${ram} GB ${b.ram.type} · ${b.ram.sticks} keping`,
    `Grafis   ${b.gpu ? b.gpu.name : "Grafis terintegrasi CPU"}`,
    "Drive",
    ...drives,
    s.post?.booted ? "Status   Siap memasang sistem operasi" : "!Status   Tidak ada perangkat boot",
  ];
}
