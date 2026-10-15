import type { Texture } from "three";
import { MeshStandardMaterial } from "three";
import { useMemo } from "react";
import { MATERIALS } from "./materials";
import { Box, Cyl, RoundBox } from "./primitives";

/** 24" class monitor. Origin: centre of the stand base, screen facing +z. */
export function MonitorModel({ screen }: { screen: Texture }) {
  const mat = useMemo(() => new MeshStandardMaterial({ map: screen, emissiveMap: screen, emissive: "#ffffff", emissiveIntensity: 0.9, roughness: 0.3 }), [screen]);
  return (
    <group>
      <RoundBox size={[22, 0.8, 16]} position={[0, 0.4, 0]} material={MATERIALS.monitorBody} radius={0.3} />
      <Box size={[4, 20, 1.6]} position={[0, 10.8, -2.6]} material={MATERIALS.monitorBody} />
      <RoundBox size={[55, 32.5, 2]} position={[0, 30, 0]} material={MATERIALS.monitorBody} radius={0.4} />
      <mesh position={[0, 30.3, 1.01]} material={mat}>
        <planeGeometry args={[53.2, 30]} />
      </mesh>
    </group>
  );
}

/** Motherboard box with the anti-static bag on top: the bench for out-of-case work. Origin: bottom centre. */
export function BoardBoxModel({ size }: { size: [number, number, number] }) {
  const [w, h, d] = size;
  return (
    <group>
      <Box size={[w, h, d]} position={[0, h / 2, 0]} material={MATERIALS.cardboard} />
      <Box size={[w + 0.3, 0.6, d + 0.3]} position={[0, h - 0.3, 0]} material={MATERIALS.cardboard} />
      <Box size={[w - 1, 0.04, d - 1]} position={[0, h + 0.02, 0]} material={MATERIALS.bag} />
    </group>
  );
}

/** Wrist strap coiled next to its grounding snap. Origin: the snap. */
export function WristStrapModel({ worn }: { worn: boolean }) {
  return (
    <group>
      <Cyl radius={0.55} height={0.25} position={[0, 0.12, 0]} material={MATERIALS.chrome} segments={24} />
      {/* Coiled cord */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-3.2, 0.25 + i * 0.12, -1.4]} rotation={[-Math.PI / 2, 0, 0]} material={MATERIALS.cableBlack}>
          <torusGeometry args={[1.8 - i * 0.15, 0.08, 6, 32]} />
        </mesh>
      ))}
      {worn ? null : (
        <group position={[-7, 0.35, -1.2]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={MATERIALS.strapBand}>
            <torusGeometry args={[2.6, 0.35, 8, 40]} />
          </mesh>
          <Box size={[1.2, 0.5, 1.6]} position={[2.6, 0.1, 0]} material={MATERIALS.steelBright} />
        </group>
      )}
    </group>
  );
}

/** Thermal paste syringe. Origin: the tip, body along +y. */
export function PasteSyringeModel() {
  return (
    <group>
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI, 0, 0]} material={MATERIALS.syringe}>
        <coneGeometry args={[0.35, 0.8, 16]} />
      </mesh>
      <Cyl radius={0.5} height={6} position={[0, 3.8, 0]} material={MATERIALS.syringe} segments={20} />
      <Cyl radius={0.42} height={4.5} position={[0, 3.4, 0]} material={MATERIALS.paste} segments={20} />
      <Cyl radius={0.9} height={0.2} position={[0, 6.8, 0]} material={MATERIALS.syringe} segments={20} />
      <Cyl radius={0.2} height={2.2} position={[0, 7.9, 0]} material={MATERIALS.syringe} segments={12} />
      <Cyl radius={0.6} height={0.2} position={[0, 9.0, 0]} material={MATERIALS.syringe} segments={20} />
    </group>
  );
}
