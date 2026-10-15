import { useEffect, useRef } from "react";
import { useAssemblyStore, useCurrentTask } from "../store/assemblyStore";

/** When the current task changes, glide the camera to where that task happens and end any demo. */
export function useTaskEffects(): void {
  const task = useCurrentTask();
  const setView = useAssemblyStore((s) => s.setView);
  const setDemo = useAssemblyStore((s) => s.setDemo);
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!task || task.id === last.current) return;
    const first = last.current === null;
    last.current = task.id;
    setDemo(false);
    if (!first) setView(task.view);
  }, [task, setView, setDemo]);
}
