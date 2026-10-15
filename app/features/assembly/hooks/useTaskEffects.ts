import { useEffect, useRef } from "react";
import { useAssemblyStore, useCurrentTask } from "../store/assemblyStore";

/** When the current task changes, glide the camera to where that task happens. */
export function useTaskEffects(): void {
  const task = useCurrentTask();
  const setView = useAssemblyStore((s) => s.setView);
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!task || task.id === last.current) return;
    const first = last.current === null;
    last.current = task.id;
    if (!first) setView(task.view);
  }, [task, setView]);
}
