import { Surface } from "@shared/components/Surface";
import { useCurrentStep } from "../../hooks/useCurrentStep";
import { useAssemblyStore } from "../../store/assemblyStore";
import styles from "./StepCard.module.css";

/** The one thing to do right now. */
export function StepCard() {
  const { index, step, total, done, screwsLeft } = useCurrentStep();
  const mistakes = useAssemblyStore((s) => s.mistakes);

  return (
    <Surface as="section" className={styles.card} aria-live="polite" aria-label="Langkah saat ini">
      {done || !step ? (
        <div key="done" className={styles.body}>
          <span className={styles.counter}>Selesai</span>
          <h1 className={styles.title}>RAM dan SSD M.2 terpasang</h1>
          <p className={styles.hint}>
            Kesalahan selama merakit: {mistakes}. Di versi penuh, berikutnya CPU, cooler, GPU, kabel daya, dan front panel.
          </p>
        </div>
      ) : (
        <div key={step.id} className={styles.body}>
          <span className={styles.counter}>
            Langkah {index + 1} dari {total}
          </span>
          <h1 className={styles.title}>
            {step.title}
            {step.id === "panel-screws" ? <span className={styles.count}> ({4 - screwsLeft}/4)</span> : null}
          </h1>
          <p className={styles.hint}>{step.hint}</p>
        </div>
      )}
      <div className={styles.progress} aria-hidden="true">
        <div className={styles.progressFill} style={{ transform: `scaleX(${Math.min(index, total) / total})` }} />
      </div>
    </Surface>
  );
}
