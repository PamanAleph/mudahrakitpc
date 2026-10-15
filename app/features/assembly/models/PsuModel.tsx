import { useMemo, type Ref } from "react";
import { MeshStandardMaterial, type Group } from "three";
import type { PsuSpec } from "@shared/hardware";
import { perforationAlpha, stickerTexture } from "../utils/proceduralTextures";
import { CaseFan } from "./CaseFan";
import { MATERIALS } from "./materials";
import { Box, Cyl } from "./primitives";

type Vec3 = [number, number, number];

/** Outer size in the case frame (x = PSU height, y = width, z = depth), cm. ATX 150×86×140, SFX 125×63.5×100. */
export function psuSize(spec: PsuSpec): Vec3 {
  return spec.formFactor === "SFX" ? [6.35, 12.5, 10] : [8.6, 15, 14];
}

/** Cable exits on the front (+z) face, one per output in a grid. PSU-local. */
export function psuOutlet(spec: PsuSpec, index: number, total: number): Vec3 {
  const [x, y, z] = psuSize(spec);
  const cols = Math.max(1, Math.ceil(total / 2));
  const col = Math.floor(index / 2);
  const row = index % 2;
  return [-x / 2 + 1.6 + row * (x - 3.2), -y / 2 + 1.8 + (col * (y - 3.6)) / Math.max(1, cols - 1), z / 2 + 0.1];
}

/** Switch on the rear (−z) face. */
export function psuSwitchPoint(spec: PsuSpec): Vec3 {
  const [x, y, z] = psuSize(spec);
  return [x / 2 - 2.0, -y / 2 + 4.6, -z / 2 - 0.1];
}

export function psuScrewPoints(spec: PsuSpec): Vec3[] {
  const [x, y, z] = psuSize(spec);
  return [
    [x / 2 - 0.8, y / 2 - 0.8, -z / 2 - 0.15],
    [-x / 2 + 0.8, y / 2 - 0.8, -z / 2 - 0.15],
    [x / 2 - 0.8, -y / 2 + 0.8, -z / 2 - 0.15],
    [-x / 2 + 0.8, -y / 2 + 0.8, -z / 2 - 0.15],
  ];
}

/**
 * Power supply, oriented as it sits in a case lying on its side: the fan faces
 * the bottom wall (−x), AC inlet and switch on the rear (−z), cables or modular
 * sockets on the front (+z). Origin: centre of the box.
 */
export function PsuModel({ spec, rotorRef }: { spec: PsuSpec; rotorRef?: Ref<Group> }) {
  const [x, y, z] = psuSize(spec);
  const mats = useMemo(() => {
    const grille = MATERIALS.meshGrille.clone();
    grille.alphaMap = perforationAlpha(10, 10, 0.5);
    const label = new MeshStandardMaterial({
      map: stickerTexture(`psu:${spec.id}`, [`${spec.watt} W · ${spec.formFactor}`, `ATX ${spec.atxVersion}`, spec.modular === "none" ? "NON-MODULAR" : spec.modular === "full" ? "FULL MODULAR" : "SEMI MODULAR"], {
        width: 512,
        height: 256,
      }),
      roughness: 0.6,
    });
    return { grille, label };
  }, [spec.id, spec.watt, spec.formFactor, spec.atxVersion, spec.modular]);
  const fan = Math.min(y, z) - 1.6;
  return (
    <group>
      <Box size={[x, y, z]} material={MATERIALS.psuBody} />
      <mesh position={[0, y / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.label}>
        <planeGeometry args={[x * 0.8, z * 0.5]} />
      </mesh>
      {/* Fan behind a grille on the −x face */}
      <group position={[-x / 2 + 1.4, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <CaseFan size={fan} depth={1.2} rotorRef={rotorRef} />
      </group>
      <mesh position={[-x / 2 - 0.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.grille}>
        <planeGeometry args={[z - 0.6, y - 0.6]} />
      </mesh>
      {/* Rear: honeycomb, AC inlet */}
      <Box size={[2.2, 2.8, 0.2]} position={[x / 2 - 2.0, -y / 2 + 1.9, -z / 2 - 0.05]} material={MATERIALS.chip} />
      <Box size={[x - 1, y * 0.45, 0.04]} position={[0, y * 0.2, -z / 2 - 0.02]} material={MATERIALS.chipMarking} />
      {/* Front: modular sockets or the cable bundle exit */}
      {spec.modular === "none" ? (
        <Cyl radius={1.6} height={0.6} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z / 2 + 0.3]} material={MATERIALS.rubber} segments={20} />
      ) : (
        <Box size={[x - 1.2, y - 1.6, 0.1]} position={[0, 0, z / 2 + 0.05]} material={MATERIALS.chip} />
      )}
    </group>
  );
}
