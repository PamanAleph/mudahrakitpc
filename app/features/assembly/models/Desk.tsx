import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { MAT, MAT_THICKNESS } from "../constants/sceneLayout";
import { matTexture } from "../utils/proceduralTextures";
import { MATERIALS } from "./materials";
import { Cyl, RoundBox } from "./primitives";

/** Desk top and the anti-static mat. Colours come from scene tokens so they follow the theme. */
export function Desk({ deskColor, matColor }: { deskColor: string; matColor: string }) {
  const deskMat = useMemo(() => new MeshStandardMaterial({ roughness: 0.82, metalness: 0 }), []);
  const matMat = useMemo(() => new MeshStandardMaterial({ map: matTexture(MAT.width, MAT.depth), roughness: 0.9 }), []);
  deskMat.color.set(deskColor);
  matMat.color.set(matColor);

  return (
    <group>
      <RoundBox size={[420, 3, 300]} position={[0, -1.5, -20]} material={deskMat} radius={0.6} />
      <RoundBox size={[MAT.width, MAT_THICKNESS, MAT.depth]} position={[MAT.center[0], MAT_THICKNESS / 2, MAT.center[2]]} material={matMat} radius={0.1} />
      {/* Grounding snap for the wrist strap */}
      <Cyl radius={0.55} height={0.25} position={[MAT.width / 2 - 3, MAT_THICKNESS + 0.12, MAT.center[2] + MAT.depth / 2 - 3]} material={MATERIALS.chrome} segments={24} />
    </group>
  );
}
