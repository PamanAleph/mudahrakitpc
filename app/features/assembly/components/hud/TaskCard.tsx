import { CirclePlay, CircleStop, Hand, MousePointerClick, Move, Wrench } from "lucide-react";
import { Button } from "@shared/components/Button";
import { Surface } from "@shared/components/Surface";
import { PHASES } from "../../engine/tasks";
import { useAssemblyStore, useCurrentGuide, useCurrentTask } from "../../store/assemblyStore";
import type { GuideGesture } from "../../types/assemblyTypes";
import styles from "./TaskCard.module.css";

const ICON = { size: 16, strokeWidth: 1.6, "aria-hidden": true } as const;

const GESTURE: Record<GuideGesture, { label: string; icon: typeof Hand }> = {
  tap: { label: "Klik", icon: MousePointerClick },
  hold: { label: "Tahan klik", icon: Hand },
  carry: { label: "Angkat lalu taruh", icon: Move },
};

/** The one thing to do right now, how to do it, and a replayable demo. */
export function TaskCard() {
  const task = useCurrentTask();
  const guide = useCurrentGuide();
  const total = useAssemblyStore((s) => s.tasks.length);
  const done = useAssemblyStore((s) => s.tasks.filter((t) => t.isDone(s)).length);
  const mode = useAssemblyStore((s) => s.mode);
  const demo = useAssemblyStore((s) => s.demo);
  const setDemo = useAssemblyStore((s) => s.setDemo);
  const selectTool = useAssemblyStore((s) => s.selectTool);
  const toolNow = useAssemblyStore((s) => s.tool);
  const setView = useAssemblyStore((s) => s.setView);
  const phase = PHASES.find((p) => p.id === task?.phase);
  const gesture = guide.gesture ? GESTURE[guide.gesture] : null;

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
          {gesture ? (
            <div className={styles.how}>
              <span className={styles.gesture}>
                <gesture.icon {...ICON} />
                {gesture.label}
              </span>
              <p className={styles.howText}>{guide.how}</p>
              <div className={styles.actions}>
                {guide.tool && guide.tool !== toolNow ? (
                  <Button icon={<Wrench {...ICON} />} onClick={() => selectTool(guide.tool!)}>
                    Pilih {guide.tool}
                  </Button>
                ) : null}
                <Button
                  variant={demo ? "secondary" : "primary"}
                  icon={demo ? <CircleStop {...ICON} /> : <CirclePlay {...ICON} />}
                  aria-pressed={demo}
                  onClick={() => {
                    if (!demo) setView(task.view);
                    setDemo(!demo);
                  }}
                >
                  {demo ? "Tutup contoh" : "Tunjukkan caranya"}
                </Button>
              </div>
            </div>
          ) : null}
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
