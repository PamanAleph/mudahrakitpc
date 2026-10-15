import { Surface } from "@shared/components/Surface";
import { PHASES } from "../../engine/tasks";
import { useAssemblyStore, useCurrentTask } from "../../store/assemblyStore";
import styles from "./TaskCard.module.css";

/** The one thing to do right now, with the phase it belongs to. */
export function TaskCard() {
  const task = useCurrentTask();
  const total = useAssemblyStore((s) => s.tasks.length);
  const done = useAssemblyStore((s) => s.tasks.filter((t) => t.isDone(s)).length);
  const mode = useAssemblyStore((s) => s.mode);
  const phase = PHASES.find((p) => p.id === task?.phase);

  return (
    <Surface as="section" className={styles.card} aria-live="polite" aria-label="Tugas saat ini">
      {task ? (
        <div key={task.id} className={styles.body}>
          <span className={styles.counter}>
            {phase?.label} · {done}/{total}
            {mode === "free" ? " · mode bebas" : ""}
          </span>
          <h1 className={styles.title}>{task.title}</h1>
          <p className={styles.hint}>{task.hint}</p>
        </div>
      ) : (
        <div key="done" className={styles.body}>
          <span className={styles.counter}>Selesai · {total}/{total}</span>
          <h1 className={styles.title}>PC menyala sampai layar firmware</h1>
          <p className={styles.hint}>Buka ringkasan untuk melihat catatan dari percobaan menyala.</p>
        </div>
      )}
      <div className={styles.progress} aria-hidden="true">
        <div className={styles.progressFill} style={{ transform: `scaleX(${total ? done / total : 0})` }} />
      </div>
    </Surface>
  );
}
