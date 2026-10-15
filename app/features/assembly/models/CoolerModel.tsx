import type { Ref } from "react";
import type { Group } from "three";
import type { CoolerSpec } from "@shared/hardware";
import { CaseFan } from "./CaseFan";
import { MATERIALS } from "./materials";
import { Box, Cyl } from "./primitives";

type Vec3 = [number, number, number];

/** Where the four mounting screws sit around the base (cooler-local). */
export function coolerScrewPoints(spec: CoolerSpec): Vec3[] {
  const o = spec.type === "stock" ? 4.6 : 3.8;
  return [
    [o, 0.5, o],
    [-o, 0.5, o],
    [o, 0.5, -o],
    [-o, 0.5, -o],
  ];
}

/** Where the fan cable leaves the cooler (cooler-local). */
export function coolerCableAnchor(spec: CoolerSpec): Vec3 {
  if (spec.type === "tower") return [4.5, spec.heightCm * 0.35, 4.2];
  return [spec.fanSizeMm / 20, spec.heightCm - 0.8, 0];
}

/**
 * CPU air cooler. Origin: centre of the contact base bottom (sits on the CPU lid).
 * Height comes from data (heightCm) because that is what the case clearance rule checks.
 * Tower: fins stand up, fan on the +z face blowing towards −z (to the rear exhaust).
 * Low-profile and stock: fan on top blowing down.
 */
export function CoolerModel({ spec, film, prePaste, rotorRef }: { spec: CoolerSpec; film: boolean; prePaste: boolean; rotorRef?: Ref<Group> }) {
  const h = spec.heightCm;
  const fan = spec.fanSizeMm / 10;
  return (
    <group>
      {/* Contact base and mounting bar */}
      <Box size={[3.8, 0.45, 3.8]} position={[0, 0.225, 0]} material={spec.type === "stock" ? MATERIALS.aluminium : MATERIALS.copper} />
      {spec.type !== "stock" ? <Box size={[9.0, 0.22, 1.2]} position={[0, 0.56, 0]} material={MATERIALS.steelBright} /> : null}
      {film ? (
        <mesh position={[0, -0.006, 0]} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.film}>
          <planeGeometry args={[4.2, 4.2]} />
        </mesh>
      ) : null}
      {prePaste ? (
        <mesh position={[0, -0.004, 0]} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.paste}>
          <planeGeometry args={[2.6, 2.6]} />
        </mesh>
      ) : null}

      {spec.type === "tower" ? <TowerBody h={h} fan={fan} rotorRef={rotorRef} /> : null}
      {spec.type === "low-profile" ? <FlatBody h={h} fan={fan} rotorRef={rotorRef} wide /> : null}
      {spec.type === "stock" ? <FlatBody h={h} fan={fan} rotorRef={rotorRef} wide={false} /> : null}
    </group>
  );
}

function TowerBody({ h, fan, rotorRef }: { h: number; fan: number; rotorRef?: Ref<Group> }) {
  const finH = h - 2.4;
  const finCount = 34;
  const depth = 5.0;
  return (
    <group>
      {/* Heat pipes: U-shapes rising from the base into the fin stack */}
      {[-1.5, -0.5, 0.5, 1.5].map((x) => (
        <group key={x}>
          <Cyl radius={0.3} height={h - 1.2} position={[x, (h - 1.2) / 2 + 0.6, -1.1]} material={MATERIALS.copper} segments={12} />
          <Cyl radius={0.3} height={h - 1.2} position={[x * 1.3, (h - 1.2) / 2 + 0.6, 1.1]} material={MATERIALS.copper} segments={12} />
        </group>
      ))}
      {Array.from({ length: finCount }, (_, i) => (
        <Box key={i} size={[12.2, 0.05, depth]} position={[0, 2.0 + (i * finH) / finCount, 0]} material={MATERIALS.aluminium} />
      ))}
      <Box size={[12.4, 0.35, depth + 0.1]} position={[0, h - 0.18, 0]} material={MATERIALS.heatsink} />
      {[-1.5, -0.5, 0.5, 1.5].map((x) => (
        <Cyl key={`cap${x}`} radius={0.31} height={0.1} position={[x, h - 0.0, -1.1]} material={MATERIALS.chrome} segments={12} />
      ))}
      <group position={[0, 2.0 + finH / 2, depth / 2 + 1.35]} rotation={[0, Math.PI, 0]}>
        <CaseFan size={fan} rotorRef={rotorRef} />
      </group>
    </group>
  );
}

function FlatBody({ h, fan, wide, rotorRef }: { h: number; fan: number; wide: boolean; rotorRef?: Ref<Group> }) {
  const fanDepth = 1.6;
  const sinkTop = h - fanDepth;
  const size = wide ? fan + 0.4 : fan;
  const fins = wide ? 18 : 24;
  return (
    <group>
      {wide ? (
        Array.from({ length: fins }, (_, i) => (
          <Box key={i} size={[size, sinkTop - 0.8, 0.06]} position={[0, 0.45 + (sinkTop - 0.45) / 2, -size / 2 + 0.2 + (i * (size - 0.4)) / (fins - 1)]} material={MATERIALS.aluminium} />
        ))
      ) : (
        <>
          <Cyl radius={1.8} height={sinkTop - 0.45} position={[0, 0.45 + (sinkTop - 0.45) / 2, 0]} material={MATERIALS.aluminium} segments={24} />
          {Array.from({ length: fins }, (_, i) => {
            const a = (i / fins) * Math.PI * 2;
            return <Box key={i} size={[size / 2 - 1.6, sinkTop - 0.5, 0.08]} position={[Math.cos(a) * (size / 4 + 0.8), 0.45 + (sinkTop - 0.45) / 2, Math.sin(a) * (size / 4 + 0.8)]} rotation={[0, -a, 0]} material={MATERIALS.aluminium} />;
          })}
        </>
      )}
      <group position={[0, sinkTop + fanDepth / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <CaseFan size={fan} rotorRef={rotorRef} depth={fanDepth} />
      </group>
    </group>
  );
}
