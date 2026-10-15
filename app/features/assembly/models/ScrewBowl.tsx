import { BOWL } from "../constants/sceneLayout";
import { dishGeometry } from "../utils/geometryFactory";
import { MATERIALS } from "./materials";

/** Magnetic parts dish where removed screws go. */
export function ScrewBowl() {
  return <mesh geometry={dishGeometry(3, 0.9)} position={BOWL} material={MATERIALS.dish} />;
}
