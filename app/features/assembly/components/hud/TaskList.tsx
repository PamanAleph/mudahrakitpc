import { Check } from "lucide-react";
import { Surface } from "@shared/components/Surface";
import { cn } from "@shared/utils/cn";
import { PHASES } from "../../engine/tasks";
import { useAssemblyStore, useCurrentTask } from "../../store/assemblyStore";
import styles from "./TaskList.module.css";

/** Every task, grouped by phase, ticked off as the bench changes. */
export function TaskList() {
  const tasks = useAssemblyStore((s) => s.tasks);
  const doneIds = useAssemblyStore((s) => s.tasks.filter((t) => t.isDone(s)).map((t) => t.id).join("|"));
  const current = useCurrentTask();
  const done = new Set(doneIds.split("|"));
  return (
    <Surface as="nav" className={styles.panel} aria-label="Daftar tugas">
      {PHASES.map((phase) => {
        const items = tasks.filter((t) => t.phase === phase.id);
        if (!items.length) return null;
        return (
          <section key={phase.id} className={styles.phase}>
            <h2 className={styles.phaseTitle}>{phase.label}</h2>
            <ol className={styles.list}>
              {items.map((t) => (
                <li key={t.id} className={cn(styles.item, done.has(t.id) && styles.done, current?.id === t.id && styles.current)} aria-current={current?.id === t.id ? "step" : undefined}>
                  <span className={styles.mark} aria-hidden="true">
                    {done.has(t.id) ? <Check size={12} strokeWidth={2.4} /> : null}
                  </span>
                  <span>{t.title}</span>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </Surface>
  );
}
