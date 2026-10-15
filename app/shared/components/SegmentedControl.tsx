import type { ReactNode } from "react";
import { cn } from "@shared/utils/cn";
import styles from "./SegmentedControl.module.css";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Visible content; falls back to label. */
  content?: ReactNode;
  mono?: boolean;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<SegmentOption<T>>;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={opt.value === value}
          aria-label={opt.content ? opt.label : undefined}
          className={cn(styles.option, opt.mono && styles.mono)}
          onClick={() => onChange(opt.value)}
        >
          {opt.content ?? opt.label}
        </button>
      ))}
    </div>
  );
}
