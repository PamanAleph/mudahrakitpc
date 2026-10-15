import { useCssTokens } from "@shared/hooks/useCssTokens";
import { RAM_SLOT_IDS } from "../../constants/sceneLayout";
import { Desk } from "../../models/Desk";
import { Motherboard } from "../../models/Motherboard";
import { PartsTray } from "../../models/PartsTray";
import { PcCase } from "../../models/PcCase";
import { ScrewBowl } from "../../models/ScrewBowl";
import { CameraDirector } from "./CameraDirector";
import { DevBridge } from "./DevBridge";
import { HoldController } from "./HoldController";
import { InteractiveM2Screw } from "./InteractiveM2Screw";
import { InteractivePanel } from "./InteractivePanel";
import { InteractiveRam } from "./InteractiveRam";
import { InteractiveRamLatch } from "./InteractiveRamLatch";
import { InteractiveSsd } from "./InteractiveSsd";
import { LooseScrews } from "./LooseScrews";
import { PulseLayer } from "./PulseLayer";
import { SceneLighting } from "./SceneLighting";
import { ScrewdriverRig } from "./ScrewdriverRig";
import { SnapIndicator } from "./SnapIndicator";

const SCENE_TOKENS = [
  "--scene-backdrop",
  "--scene-desk",
  "--scene-mat",
  "--scene-snap-valid",
  "--scene-snap-invalid",
  "--scene-accent",
] as const;

/** Everything inside the canvas. Colours that carry meaning come from design tokens. */
export function AssemblyScene() {
  const t = useCssTokens(SCENE_TOKENS, "#888888");
  const valid = t["--scene-snap-valid"];
  const invalid = t["--scene-snap-invalid"];

  return (
    <>
      <color attach="background" args={[t["--scene-backdrop"]]} />
      <SceneLighting />

      <Desk deskColor={t["--scene-desk"]} matColor={t["--scene-mat"]} />
      <PcCase />
      <Motherboard />
      <PartsTray />
      <ScrewBowl />

      <InteractivePanel />
      <LooseScrews />
      {RAM_SLOT_IDS.map((slot) => (
        <InteractiveRamLatch key={slot} slot={slot} highlightColor={t["--scene-accent"]} />
      ))}
      <InteractiveRam validColor={valid} invalidColor={invalid} />
      <InteractiveSsd validColor={valid} />
      <InteractiveM2Screw />
      <ScrewdriverRig gripColor={t["--scene-accent"]} />

      <SnapIndicator validColor={valid} invalidColor={invalid} />
      <PulseLayer colors={{ success: valid, danger: invalid, info: t["--scene-accent"] }} />
      <HoldController />
      <CameraDirector />
      {import.meta.env.DEV ? <DevBridge /> : null}
    </>
  );
}
