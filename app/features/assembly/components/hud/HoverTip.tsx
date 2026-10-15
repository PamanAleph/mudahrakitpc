import { useEffect, useRef, useState } from "react";
import { formatMessage } from "../../constants/messages";
import { useAssemblyStore } from "../../store/assemblyStore";
import styles from "./HoverTip.module.css";

/**
 * Names what's under the mouse. While something is in hand it says whether the
 * nearest spot fits, and why not, before the user commits.
 */
export function HoverTip() {
  const label = useAssemblyStore((s) => s.hover?.label ?? "");
  const holding = useAssemblyStore((s) => s.held !== null);
  const pressing = useAssemblyStore((s) => s.hold !== null);
  const snap = useAssemblyStore((s) => s.snap);
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

  let text = label;
  if (holding) {
    if (!snap) text = "";
    else if (snap.valid) text = "Cocok di sini · klik untuk memasang";
    else text = snap.reason && !snap.reason.ok ? `Tidak bisa: ${formatMessage(snap.reason.key, snap.reason.params).title}` : "Tidak bisa di sini";
  }
  return (
    <div ref={ref} className={styles.tip} data-tone={holding && snap ? (snap.valid ? "ok" : "bad") : undefined} hidden={!text || !mouse || pressing} aria-hidden="true">
      {text}
    </div>
  );
}
