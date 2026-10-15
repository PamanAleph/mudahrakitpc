import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { MAT_THICKNESS } from "../../constants/sceneLayout";

/**
 * Studio-style lighting built from light-formers (no HDR download), so
 * metals and glass get believable reflections at low cost.
 */
export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[30, 70, 45]} intensity={1.5} />
      <directionalLight position={[-45, 30, -25]} intensity={0.35} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 45, 10]} rotation-x={Math.PI / 2} scale={[90, 45, 1]} />
        <Lightformer form="rect" intensity={1.1} position={[-60, 22, 0]} rotation-y={Math.PI / 2} scale={[50, 18, 1]} />
        <Lightformer form="rect" intensity={1.1} position={[60, 22, 0]} rotation-y={-Math.PI / 2} scale={[50, 18, 1]} />
        <Lightformer form="rect" intensity={0.7} position={[0, 18, 70]} scale={[60, 12, 1]} />
      </Environment>
      <ContactShadows position={[0, MAT_THICKNESS + 0.01, 4]} scale={[110, 90]} blur={2.6} opacity={0.5} far={24} resolution={512} frames={1} />
    </>
  );
}
