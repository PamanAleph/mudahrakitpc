import { Check } from "lucide-react";
import { Kbd } from "@shared/components/Kbd";
import { Surface } from "@shared/components/Surface";
import { cn } from "@shared/utils/cn";
import { STEPS } from "../../constants/steps";
import { useCurrentStep } from "../../hooks/useCurrentStep";
import { HAS_UNVERIFIED_DATA } from "../../services/hardwareSpec";
import { useAssemblyStore } from "../../store/assemblyStore";
import styles from "./StepList.module.css";

/** Whole-job overview for people who stepped away, plus controls cheat sheet. */
export function StepList() {
  const { index } = useCurrentStep();
  const mistakes = useAssemblyStore((s) => s.mistakes);

  return (
    <Surface as="aside" className={styles.panel} aria-label="Daftar langkah">
      <h2 className={styles.heading}>Langkah</h2>
      <ol className={styles.list}>
        {STEPS.map((step, i) => {
          const state = i < index ? "done" : i === index ? "now" : "todo";
          return (
            <li key={step.id} className={cn(styles.item, styles[state])} aria-current={state === "now" ? "step" : undefined}>
              <span className={styles.mark} aria-hidden="true">
                {state === "done" ? <Check size={11} strokeWidth={3} /> : null}
              </span>
              <span>{step.title}</span>
              {state === "done" ? <span className="visually-hidden"> (selesai)</span> : null}
            </li>
          );
        })}
      </ol>
      <p className={styles.meta}>
        Kesalahan: <span className={styles.mono}>{mistakes}</span>
      </p>
      <p className={styles.meta}>
        Tahan klik untuk memutar baut atau menekan komponen. Seret area kosong untuk memutar kamera.
        <br />
        <Kbd>R</Kbd> putar keping · <Kbd>Esc</Kbd> taruh · <Kbd>0</Kbd>–<Kbd>3</Kbd> pilih alat
      </p>
      {HAS_UNVERIFIED_DATA ? (
        <p className={styles.meta}>
          Ukuran mata obeng, posisi takik, dan tata letak board: <span className={styles.mono}>[BELUM DIKONFIRMASI]</span>, belum dicek ke
          manual resmi.
        </p>
      ) : null}
    </Surface>
  );
}
