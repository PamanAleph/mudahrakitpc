import { useEffect, useRef, useState } from "react";
import { useAssemblyStore } from "../../store/assemblyStore";
import styles from "./HoverTip.module.css";

/** Names what's under the mouse: part, spec, state. Mouse only; touch gets it in the toast. */
export function HoverTip() {
  const label = useAssemblyStore((s) => s.hover?.label ?? "");
  const busy = useAssemblyStore((s) => s.hold !== null || s.held !== null);
  const [mouse, setMouse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      setMouse(e.pointerType === "mouse");
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div ref={ref} className={styles.tip} hidden={!label || !mouse || busy} aria-hidden="true">
      {label}
    </div>
  );
}
