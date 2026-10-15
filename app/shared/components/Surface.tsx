import { forwardRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@shared/utils/cn";
import styles from "./Surface.module.css";

interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
}

/** The single elevated surface style. Use only where something floats over the 3D scene. */
export const Surface = forwardRef<HTMLElement, SurfaceProps>(function Surface({ as: Tag = "div", className, children, ...rest }, ref) {
  return (
    <Tag ref={ref} className={cn(styles.surface, className)} {...rest}>
      {children}
    </Tag>
  );
});
