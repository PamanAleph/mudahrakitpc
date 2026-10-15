import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@shared/components/Button";
import { Surface } from "@shared/components/Surface";
import { cn } from "@shared/utils/cn";
import styles from "./Dialog.module.css";

/**
 * Floating panel over the bench. Non-modal for the scene (the bench stays
 * visible beside it), but takes focus and closes on Esc like a dialog.
 */
export function Dialog({ title, onClose, children, wide = false, side = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; side?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => prev?.focus?.();
  }, []);
  return (
    <div className={cn(styles.layer, side && styles.side)}>
      <Surface
        as="section"
        ref={ref}
        role="dialog"
        aria-label={title}
        tabIndex={-1}
        className={cn(styles.panel, wide && styles.wide)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <header className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <Button variant="ghost" iconOnly aria-label="Tutup" icon={<X size={18} strokeWidth={1.6} aria-hidden="true" />} onClick={onClose} />
        </header>
        <div className={styles.body}>{children}</div>
      </Surface>
    </div>
  );
}
