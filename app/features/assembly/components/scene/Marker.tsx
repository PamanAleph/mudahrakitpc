import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { Group, Object3D } from "three";
import { register } from "../../utils/runtime";

type Vec3 = [number, number, number];

/**
 * A named point the store and controllers can find: a mount, a port or an
 * anchor. Registers its Object3D in a runtime map while mounted.
 */
export function Marker({ map, id, position, rotation, children }: { map: Map<string, Object3D>; id: string; position?: Vec3; rotation?: Vec3; children?: ReactNode }) {
  const ref = useRef<Group>(null);
  useLayoutEffect(() => register(map, id, ref.current), [map, id]);
  return (
    <group ref={ref} position={position} rotation={rotation}>
      {children}
    </group>
  );
}
