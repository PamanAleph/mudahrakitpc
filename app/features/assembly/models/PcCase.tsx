import { useMemo } from "react";
import { BOARD_TOP, CASE, CASE_Y, MOUNTING_HOLES_LOCAL, STANDOFF_HEIGHT, boardToWorld } from "../constants/sceneLayout";
import { perforationAlpha } from "../utils/proceduralTextures";
import { CaseFan } from "./CaseFan";
import { MATERIALS } from "./materials";
import { Box, Cyl, RoundBox } from "./primitives";

/**
 * Mid-tower chassis lying on its right side, side panel removed.
 * Case-local frame: origin on the mat under the case centre.
 */
export function PcCase() {
  const L = CASE.length;
  const D = CASE.depth;
  const H = CASE.height;
  const t = CASE.wall;
  const bz = CASE.bezelDepth;

  const mats = useMemo(() => {
    const top = MATERIALS.caseSteelPerforated.clone();
    top.alphaMap = perforationAlpha(18, 26);
    const shroud = MATERIALS.caseSteelPerforated.clone();
    shroud.alphaMap = perforationAlpha(6, 10);
    const grille = MATERIALS.meshGrille.clone();
    grille.alphaMap = perforationAlpha(70, 30, 0.42);
    return { top, shroud, grille };
  }, []);

  const shroudX = -L / 2 + 7.5;
  const ioY = BOARD_TOP - CASE_Y + 2.1;

  return (
    <group position={[0, CASE_Y, 0]}>
      {/* Motherboard tray (the case's right side, lying on the mat) */}
      <Box size={[L, t, D]} position={[0, t / 2, 0]} material={MATERIALS.caseSteelInner} />

      {/* Rear wall with I/O shield and expansion slot covers */}
      <Box size={[L, H, t]} position={[0, H / 2, -D / 2 + t / 2]} material={MATERIALS.caseSteel} />
      <Box size={[9.6, 4.4, 0.1]} position={[9, ioY, -D / 2 + t + 0.05]} material={MATERIALS.steelBright} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Box key={`io${i}`} size={[1.1, 0.7, 0.04]} position={[5.4 + i * 1.45, ioY + (i % 2 ? 0.9 : -0.6), -D / 2 + t + 0.11]} material={MATERIALS.chip} />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <group key={`slot${i}`} position={[0.5 - i * 2.03, 8, -D / 2 + t + 0.07]}>
          <Box size={[1.75, 11.4, 0.08]} material={MATERIALS.steelBright} />
          {[0, 1, 2, 3].map((k) => (
            <Box key={k} size={[0.9, 0.16, 0.1]} position={[0, -3 + k * 1.1, 0.01]} material={MATERIALS.caseSteel} />
          ))}
        </group>
      ))}

      {/* Front wall + bezel with mesh grille */}
      <Box size={[L, H, t]} position={[0, H / 2, D / 2 - t / 2]} material={MATERIALS.caseSteelInner} />
      <RoundBox size={[L + 0.6, H + 0.4, bz]} position={[0, H / 2, D / 2 + bz / 2]} material={MATERIALS.bezelPlastic} radius={0.35} />
      <mesh position={[-1, H / 2, D / 2 + bz + 0.01]} material={mats.grille}>
        <planeGeometry args={[L - 6, H - 4]} />
      </mesh>
      <Box size={[0.4, H - 4.6, 0.08]} position={[L / 2 - 2.6, H / 2, D / 2 + bz + 0.02]} material={MATERIALS.heatsinkAccent} />

      {/* Top wall (x+): solid rails around a perforated fan area */}
      <Box size={[t, 1.2, D]} position={[L / 2 - t / 2, 0.6, 0]} material={MATERIALS.caseSteel} />
      <Box size={[t, 1.2, D]} position={[L / 2 - t / 2, H - 0.6, 0]} material={MATERIALS.caseSteel} />
      <Box size={[t, H - 2.4, 5]} position={[L / 2 - t / 2, H / 2, -D / 2 + 2.5]} material={MATERIALS.caseSteel} />
      <Box size={[t, H - 2.4, 9]} position={[L / 2 - t / 2, H / 2, D / 2 - 4.5]} material={MATERIALS.caseSteel} />
      <mesh position={[L / 2 - t / 2, H / 2, -2]} rotation={[0, Math.PI / 2, 0]} material={mats.top}>
        <planeGeometry args={[D - 14, H - 2.4]} />
      </mesh>
      {/* Front I/O on the top edge: two USB-A, one USB-C, audio, power button */}
      <group position={[L / 2 + 0.01, H / 2, D / 2 - 2.6]}>
        <Box size={[0.05, 1.3, 0.6]} position={[0, 2.4, 0]} material={MATERIALS.chip} />
        <Box size={[0.05, 1.3, 0.6]} position={[0, 0.7, 0]} material={MATERIALS.chip} />
        <Box size={[0.05, 0.85, 0.32]} position={[0, -0.8, 0]} material={MATERIALS.chip} />
        <Cyl radius={0.2} height={0.05} rotation={[0, 0, Math.PI / 2]} position={[0, -2, 0]} material={MATERIALS.chip} />
        <Cyl radius={0.55} height={0.2} rotation={[0, 0, Math.PI / 2]} position={[0.08, -4, 0]} material={MATERIALS.heatsinkAccent} segments={28} />
      </group>

      {/* Bottom wall (x-) and feet */}
      <Box size={[t, H, D]} position={[-L / 2 + t / 2, H / 2, 0]} material={MATERIALS.caseSteel} />
      {[
        [2.4, 16],
        [2.4, -16],
        [H - 2.4, 16],
        [H - 2.4, -16],
      ].map(([y, z]) => (
        <RoundBox key={`${y}${z}`} size={[0.9, 2.6, 5]} position={[-L / 2 - 0.45, y as number, z as number]} material={MATERIALS.rubber} radius={0.3} />
      ))}

      {/* PSU shroud with perforated intake and a rubber cable cut-out */}
      <Box size={[7.5, t, 22]} position={[-L / 2 + 3.75, 7, -D / 2 + 11]} material={MATERIALS.caseSteel} />
      <mesh position={[-L / 2 + 3.75, 7, D / 2 - 11]} rotation={[-Math.PI / 2, 0, 0]} material={mats.shroud}>
        <planeGeometry args={[7.5, 22 - t * 2]} />
      </mesh>
      <Box size={[t, 7, D - t * 2]} position={[shroudX, 3.5, 0]} material={MATERIALS.caseSteel} />
      <RoundBox size={[0.12, 2.2, 5]} position={[shroudX + 0.07, 4.6, 9]} material={MATERIALS.rubber} radius={0.05} />

      {/* Cable-management grommets on the tray */}
      {[-6, 3, 12].map((x) => (
        <group key={x} position={[x, t + 0.07, 5.8]}>
          <RoundBox size={[3.6, 0.14, 1.4]} material={MATERIALS.rubber} radius={0.06} />
          <Box size={[3, 0.02, 0.07]} position={[0, 0.08, 0]} material={MATERIALS.chip} />
        </group>
      ))}
      <RoundBox size={[1.5, 0.14, 3.4]} position={[19.4, t + 0.07, -16.5]} material={MATERIALS.rubber} radius={0.06} />

      {/* Brass standoffs under the board's mounting holes */}
      {MOUNTING_HOLES_LOCAL.map(([x, z]) => {
        const [wx, , wz] = boardToWorld(x, 0, z);
        return <Cyl key={`${x}${z}`} radius={0.3} height={STANDOFF_HEIGHT} segments={6} position={[wx, t + STANDOFF_HEIGHT / 2, wz]} material={MATERIALS.brass} />;
      })}

      {/* Fans: one exhaust at the rear, two intakes behind the front mesh */}
      <CaseFan position={[16, 11.6, -D / 2 + t + 1.3]} />
      <CaseFan position={[9, 10.5, D / 2 - t - 1.3]} />
      <CaseFan position={[-3.5, 10.5, D / 2 - t - 1.3]} />
    </group>
  );
}
