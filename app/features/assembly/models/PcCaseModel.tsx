import { useMemo } from "react";
import type { CaseSpec } from "@shared/hardware";
import { BOARD_TEMPLATES, BOARD_TOP_IN_CASE, MAT_T, SLOT_PITCH, WALL, bayPose, fanMountPose, firstSlotU, type CaseGeometry } from "../constants/layouts";
import { perforationAlpha } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Box, Cyl } from "./primitives";

/**
 * Mid-tower chassis lying on its right side (tray down, glass side up).
 * Everything here is static sheet metal; interactive features (standoffs,
 * slot covers, power button, mounts) are drawn by the scene on top of it.
 * Case-local = world: origin at the centre of the case footprint on the mat.
 */
export function PcCaseModel({ spec, g }: { spec: CaseSpec; g: CaseGeometry }) {
  const { L, D, H } = g;
  const y0 = MAT_T;
  const yMid = y0 + H / 2;
  const mats = useMemo(() => {
    const front = MATERIALS.meshGrille.clone();
    front.alphaMap = perforationAlpha(18, 18, 0.55);
    const vent = MATERIALS.caseSteelPerforated.clone();
    vent.alphaMap = perforationAlpha(12, 12, 0.5);
    return { front, vent };
  }, []);

  const io = BOARD_TEMPLATES[spec.formFactors[0] ?? "ATX"].ioShroud;
  const ioX0 = g.anchor.x - io.u1;
  const ioX1 = g.anchor.x - io.u0;
  const slot0 = firstSlotU(spec);
  const slotsTop = g.anchor.x - slot0 + SLOT_PITCH / 2;
  const slotsBottom = g.anchor.x - slot0 - (spec.expansionSlots - 0.5) * SLOT_PITCH;
  const rearFan = spec.fanMounts.find((m) => m.side === "rear");
  const topFans = spec.fanMounts.filter((m) => m.side === "top");

  return (
    <group>
      {/* Motherboard tray (the right side panel, now the floor) */}
      <Box size={[L, WALL, D]} position={[0, y0 + WALL / 2, 0]} material={MATERIALS.caseSteelInner} />

      {/* Rear wall with I/O cut-out, expansion slot window, PSU opening */}
      <Box size={[L, H, WALL]} position={[0, yMid, -D / 2 + WALL / 2]} material={MATERIALS.caseSteel} />
      <Box size={[ioX1 - ioX0, 4.4, 0.02]} position={[(ioX0 + ioX1) / 2, BOARD_TOP_IN_CASE + 2.3, -D / 2 + WALL + 0.012]} material={MATERIALS.chip} />
      <Box size={[slotsTop - slotsBottom, 11.8, 0.02]} position={[(slotsTop + slotsBottom) / 2, BOARD_TOP_IN_CASE + 6.4, -D / 2 + WALL + 0.012]} material={MATERIALS.chip} />
      {/* Slot ledge the brackets screw onto */}
      <Box size={[slotsTop - slotsBottom + 0.6, 0.15, 1.2]} position={[(slotsTop + slotsBottom) / 2, BOARD_TOP_IN_CASE + 12.3, -D / 2 + WALL + 0.6]} material={MATERIALS.caseSteel} />
      {rearFan ? (
        <mesh position={[rearFan.u, y0 + rearFan.v, -D / 2 + WALL + 0.014]} material={mats.vent}>
          <planeGeometry args={[11.4, 11.4]} />
        </mesh>
      ) : null}
      <Box size={[g.psu.size[0] - 0.6, g.psu.size[1] - 0.6, 0.02]} position={[g.psu.center[0], g.psu.center[1], -D / 2 + WALL + 0.012]} material={MATERIALS.chip} />

      {/* Front wall and the mesh bezel in front of it */}
      <Box size={[L, H, WALL]} position={[0, yMid, D / 2 - WALL / 2]} material={MATERIALS.caseSteel} />
      <Box size={[L + 0.4, H + 0.2, 0.3]} position={[0, yMid, D / 2 + 0.15]} material={MATERIALS.bezelPlastic} />
      <mesh position={[0, yMid, D / 2 + 0.31]} material={mats.front}>
        <planeGeometry args={[L - 2, H - 2]} />
      </mesh>

      {/* Top (with vents over the top fan mounts) and bottom walls */}
      <Box size={[WALL, H, D]} position={[L / 2 - WALL / 2, yMid, 0]} material={MATERIALS.caseSteel} />
      {topFans.map((m) => {
        const p = fanMountPose(m, g).position;
        return (
          <mesh key={m.id} position={[L / 2 - WALL - 0.014, p[1], p[2]]} rotation={[0, -Math.PI / 2, 0]} material={mats.vent}>
            <planeGeometry args={[11.4, 11.4]} />
          </mesh>
        );
      })}
      <Box size={[WALL, H, D]} position={[-L / 2 + WALL / 2, yMid, 0]} material={MATERIALS.caseSteel} />
      {/* Feet on the bottom wall */}
      {[-1, 1].flatMap((sz) =>
        [-1, 1].map((sy) => (
          <Cyl key={`${sz}${sy}`} radius={1.1} height={1.0} rotation={[0, 0, Math.PI / 2]} position={[-L / 2 - 0.5, yMid + sy * (H / 2 - 2.5), sz * (D / 2 - 4)]} material={MATERIALS.rubber} segments={18} />
        )),
      )}

      {/* Front I/O on the top-front edge: two USB-A, USB-C, audio */}
      {[0, 1.6, 3.2].map((dy, i) => (
        <Box key={i} size={[0.05, i === 2 && spec.frontIO.usbc ? 0.35 : 0.5, i === 2 && spec.frontIO.usbc ? 0.9 : 1.3]} position={[L / 2 + 0.03, y0 + H * 0.3 + dy, D / 2 - 2.6]} material={MATERIALS.chip} />
      ))}

      {/* Lip around the glass opening */}
      <Box size={[L, 0.3, 0.8]} position={[0, y0 + H - 0.15, -D / 2 + 0.4]} material={MATERIALS.caseSteel} />
      <Box size={[L, 0.3, 0.8]} position={[0, y0 + H - 0.15, D / 2 - 0.4]} material={MATERIALS.caseSteel} />
      <Box size={[0.8, 0.3, D]} position={[L / 2 - 0.4, y0 + H - 0.15, 0]} material={MATERIALS.caseSteel} />
      <Box size={[0.8, 0.3, D]} position={[-L / 2 + 0.4, y0 + H - 0.15, 0]} material={MATERIALS.caseSteel} />

      {/* PSU shroud wall */}
      <Box size={[WALL * 2, g.shroud.height, g.shroud.zEnd + D / 2]} position={[g.shroud.x1, y0 + g.shroud.height / 2, (-D / 2 + g.shroud.zEnd) / 2]} material={MATERIALS.caseSteelInner} />

      {/* Drive bays: rails for 3.5", a bracket outline for 2.5" */}
      {spec.driveBays.map((bay) => {
        const p = bayPose(bay);
        const big = bay.kind === "3.5";
        const w = big ? 10.6 : 7.4;
        const l = big ? 15.2 : 10.4;
        return (
          <group key={bay.id} position={[p.position[0], p.position[1], p.position[2]]} rotation={p.rotation}>
            <Box size={[0.3, big ? 2.4 : 0.5, l]} position={[w / 2 + 0.15, big ? 1.2 : 0.25, 0]} material={MATERIALS.caseSteelInner} />
            <Box size={[0.3, big ? 2.4 : 0.5, l]} position={[-w / 2 - 0.15, big ? 1.2 : 0.25, 0]} material={MATERIALS.caseSteelInner} />
            <Box size={[w, 0.03, 0.3]} position={[0, 0.02, l / 2]} material={MATERIALS.latch} />
          </group>
        );
      })}

      {/* Cable grommets: rubber-lined slots in the tray */}
      {spec.grommets.map((gr) => (
        <group key={gr.id} position={[gr.x, y0 + WALL + 0.01, gr.z]}>
          <Box size={[gr.id === "g-top" ? 4.4 : 3.2, 0.06, gr.id === "g-top" ? 1.4 : 1.6]} material={MATERIALS.rubber} />
          <Box size={[gr.id === "g-top" ? 3.6 : 2.4, 0.07, 0.25]} material={MATERIALS.chip} />
        </group>
      ))}
    </group>
  );
}

/** Tempered glass side panel. Origin: centre of the glass bottom face. */
export function GlassPanelModel({ L, D }: { L: number; D: number }) {
  return (
    <group>
      <Box size={[L - 0.2, 0.4, D - 0.2]} position={[0, 0.2, 0]} material={MATERIALS.glass} />
      {/* Dark frit border hides the frame, as on real glass panels */}
      <Box size={[L - 0.2, 0.02, 1.4]} position={[0, 0.41, -D / 2 + 0.8]} material={MATERIALS.glassFrit} />
      <Box size={[L - 0.2, 0.02, 1.4]} position={[0, 0.41, D / 2 - 0.8]} material={MATERIALS.glassFrit} />
      <Box size={[1.4, 0.02, D - 3]} position={[L / 2 - 0.8, 0.41, 0]} material={MATERIALS.glassFrit} />
      <Box size={[1.4, 0.02, D - 3]} position={[-L / 2 + 0.8, 0.41, 0]} material={MATERIALS.glassFrit} />
    </group>
  );
}

/** Thumbscrew spots on the glass corners (panel-local). */
export function panelScrewPoints(L: number, D: number): Array<[number, number, number]> {
  return [
    [L / 2 - 1.6, 0.4, D / 2 - 1.6],
    [-L / 2 + 1.6, 0.4, D / 2 - 1.6],
    [L / 2 - 1.6, 0.4, -D / 2 + 1.6],
    [-L / 2 + 1.6, 0.4, -D / 2 + 1.6],
  ];
}
