import type { Ref } from "react";
import type { Group } from "three";
import { MATERIALS } from "./materials";
import { Box, Cyl } from "./primitives";

interface SocketModelProps {
  /** CPU footprint (cm). */
  fx: number;
  fz: number;
  /** LGA sockets have a loading plate; PGA (AM4) only a lever. */
  loadingPlate: boolean;
  leverRef?: Ref<Group>;
  plateRef?: Ref<Group>;
}

export const SOCKET_LEVER_OPEN = 1.65;
export const SOCKET_PLATE_OPEN = -1.95;

/**
 * CPU socket. Origin: centre of the seat, where the CPU's bottom rests (y = 0).
 * The lever pivots about z at its −x end; the plate hinges about x on the −z edge.
 * The scene rotates the two ref groups; this file only draws.
 */
export function SocketModel({ fx, fz, loadingPlate, leverRef, plateRef }: SocketModelProps) {
  const leverLen = fx + 1.4;
  return (
    <group>
      {/* Seat and retention frame on the board */}
      <Box size={[fx + 1.2, 0.3, fz + 1.2]} position={[0, -0.15, 0]} material={MATERIALS.socketPlastic} />
      <Box size={[fx - 0.2, 0.02, fz - 0.2]} position={[0, 0.005, 0]} material={loadingPlate ? MATERIALS.gold : MATERIALS.connectorWhite} />
      {/* Pin-1 mark on the socket */}
      <mesh position={[-fx / 2 - 0.25, 0.01, -fz / 2 - 0.25]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} material={MATERIALS.latch}>
        <circleGeometry args={[0.22, 3]} />
      </mesh>
      {loadingPlate ? (
        <>
          <Box size={[fx + 1.8, 0.1, 0.5]} position={[0, -0.05, -fz / 2 - 0.85]} material={MATERIALS.loadingPlate} />
          <Box size={[fx + 1.8, 0.1, 0.5]} position={[0, -0.05, fz / 2 + 0.85]} material={MATERIALS.loadingPlate} />
          <group ref={plateRef} position={[0, 0.08, -fz / 2 - 0.55]}>
            {/* Frame open in the middle: the CPU's lid shows through */}
            <Box size={[fx + 0.8, 0.08, 0.6]} position={[0, 0, 0.25]} material={MATERIALS.loadingPlate} />
            <Box size={[fx + 0.8, 0.08, 0.6]} position={[0, 0, fz + 0.85]} material={MATERIALS.loadingPlate} />
            <Box size={[0.6, 0.08, fz + 1.2]} position={[-fx / 2 - 0.1, 0, fz / 2 + 0.55]} material={MATERIALS.loadingPlate} />
            <Box size={[0.6, 0.08, fz + 1.2]} position={[fx / 2 + 0.1, 0, fz / 2 + 0.55]} material={MATERIALS.loadingPlate} />
            <Box size={[0.8, 0.06, 0.5]} position={[0, 0.02, fz + 1.35]} material={MATERIALS.loadingPlate} />
          </group>
        </>
      ) : null}
      <group ref={leverRef} position={[-leverLen / 2, 0.15, fz / 2 + 1.0]}>
        <Cyl radius={0.13} height={leverLen} rotation={[0, 0, Math.PI / 2]} position={[leverLen / 2, 0, 0]} material={MATERIALS.steelBright} segments={10} />
        <Box size={[0.32, 0.32, 0.8]} position={[leverLen, 0, -0.3]} material={MATERIALS.steelBright} />
      </group>
    </group>
  );
}
