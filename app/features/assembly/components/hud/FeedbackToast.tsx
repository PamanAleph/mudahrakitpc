import { CircleCheck, CircleX, Info } from "lucide-react";
import { Surface } from "@shared/components/Surface";
import { cn } from "@shared/utils/cn";
import { useAssemblyStore } from "../../store/assemblyStore";
import styles from "./FeedbackToast.module.css";

const ICONS = { info: Info, success: CircleCheck, danger: CircleX } as const;

/** Explains what just happened, especially why something was refused. */
export function FeedbackToast() {
  const feedback = useAssemblyStore((s) => s.feedback);
  if (!feedback) return null;
  const Icon = ICONS[feedback.tone];
  return (
    <Surface key={feedback.id} className={cn(styles.toast, styles[feedback.tone])} role="status" aria-live="polite">
      <Icon className={styles.icon} size={22} strokeWidth={1.75} aria-hidden="true" />
      <div className={styles.text}>
        <strong className={styles.title}>{feedback.title}</strong>
        <p className={styles.body}>{feedback.body}</p>
      </div>
    </Surface>
  );
}
