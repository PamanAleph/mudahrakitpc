import { useCssTokens } from "@shared/hooks/useCssTokens";
import { useAssemblyStore } from "../../store/assemblyStore";
import { CableLayer } from "./CableLayer";
import { CameraDirector } from "./CameraDirector";
import { CaseRig } from "./CaseRig";
import { DeskRig } from "./DeskRig";
import { DevBridge } from "./DevBridge";
import { GuideLayer } from "./GuideLayer";
import { HoldController } from "./HoldController";
import { PartRig } from "./PartRig";
import { PulseLayer } from "./PulseLayer";
import { SceneLighting } from "./SceneLighting";
import { SnapController, SnapIndicator } from "./SnapController";

const TOKENS = ["--scene-backdrop", "--color-feedback-info", "--scene-snap-valid", "--scene-snap-invalid"] as const;

/** The whole bench. Rendered only once the store holds a build. */
export function AssemblyScene() {
  const ready = useAssemblyStore((s) => s.ready);
  const instances = useAssemblyStore((s) => s.instances);
  const t = useCssTokens(TOKENS, "#888888");
  if (!ready) return null;
  return (
    <>
      <color attach="background" args={[t["--scene-backdrop"]]} />
      <SceneLighting />
      <CameraDirector />
      <DeskRig />
      <CaseRig />
      {instances.map((p) => (
        <PartRig key={p.id} inst={p} />
      ))}
      <CableLayer />
      <SnapController />
      <SnapIndicator />
      <HoldController />
      <GuideLayer />
      <PulseLayer colors={{ info: t["--color-feedback-info"], success: t["--scene-snap-valid"], danger: t["--scene-snap-invalid"] }} />
      {import.meta.env.DEV ? <DevBridge /> : null}
    </>
  );
}
