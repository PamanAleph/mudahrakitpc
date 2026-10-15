import { useEffect, useRef } from "react";
import { useAssemblyStore } from "../store/assemblyStore";
import { useCurrentStep } from "./useCurrentStep";

/** Moves the camera to the next step's area and announces completion once. */
export function useStepEffects(): void {
  const { index, step, done } = useCurrentStep();
  const prev = useRef(index);
  const announced = useRef(false);

  useEffect(() => {
    if (index === prev.current) return;
    prev.current = index;
    const { view, setView, hold } = useAssemblyStore.getState();
    if (step && step.view !== view && !hold) setView(step.view);
  }, [index, step]);

  useEffect(() => {
    if (!done || announced.current) return;
    announced.current = true;
    const timer = window.setTimeout(() => {
      const s = useAssemblyStore.getState();
      s.notify("session.complete", { mistakes: s.mistakes });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [done]);
}
