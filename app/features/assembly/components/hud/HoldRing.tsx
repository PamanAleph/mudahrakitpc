import { useEffect, useRef } from "react";
import { useAssemblyStore } from "../../store/assemblyStore";
import styles from "./HoldRing.module.css";

const R = 18;
const C = 2 * Math.PI * R;

/** Progress ring under the finger/cursor while a hold gesture runs. */
export function HoldRing() {
  const progress = useAssemblyStore((s) => s.hold?.progress ?? null);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", move);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
    };
  }, []);

  return (
    <svg ref={ref} className={styles.ring} viewBox="0 0 48 48" visibility={progress === null ? "hidden" : "visible"} aria-hidden="true">
      <circle className={styles.track} cx="24" cy="24" r={R} />
      <circle className={styles.fill} cx="24" cy="24" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - (progress ?? 0))} />
    </svg>
  );
}
