import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@shared/utils/cn";
import styles from "./Surface.module.css";

interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
}

/** The single elevated surface style. Use only where something floats over the 3D scene. */
export function Surface({ as: Tag = "div", className, children, ...rest }: SurfaceProps) {
  return (
    <Tag className={cn(styles.surface, className)} {...rest}>
      {children}
    </Tag>
  );
}
