import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@shared/utils/cn";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  iconOnly?: boolean;
  children?: ReactNode;
}

export function Button({ variant = "secondary", icon, iconOnly, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={cn(styles.button, styles[variant], iconOnly && styles.iconOnly, className)} {...rest}>
      {icon}
      {iconOnly ? null : children}
    </button>
  );
}
