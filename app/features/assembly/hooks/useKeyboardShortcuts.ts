import { useEffect } from "react";
import { useAssemblyStore } from "../store/assemblyStore";
import type { ToolId } from "../types/assemblyTypes";

const TOOL_KEYS: Record<string, ToolId> = { "0": "hand", "1": "PH0", "2": "PH1", "3": "PH2" };

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useAssemblyStore.getState();
      if (e.key === "r" || e.key === "R") s.rotateHeld();
      else if (e.key === "Escape") s.dropHeld();
      else if (TOOL_KEYS[e.key]) s.selectTool(TOOL_KEYS[e.key] as ToolId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
