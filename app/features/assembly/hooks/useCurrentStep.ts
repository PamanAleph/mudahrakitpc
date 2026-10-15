import { useAssemblyStore } from "../store/assemblyStore";
import { currentStepIndex, panelScrewsLeft, STEPS } from "../constants/steps";

export function useCurrentStep() {
  const index = useAssemblyStore((s) => currentStepIndex(s));
  const screwsLeft = useAssemblyStore((s) => panelScrewsLeft(s));
  const step = STEPS[index] ?? null;
  return { index, step, total: STEPS.length, done: index >= STEPS.length, screwsLeft };
}
