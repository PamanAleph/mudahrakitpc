import { Canvas, type CanvasProps } from "@react-three/fiber";
import { usePageVisibility } from "@shared/hooks/usePageVisibility";

interface StageCanvasProps extends Omit<CanvasProps, "dpr" | "frameloop"> {
  /** Called when the GPU drops the WebGL context. */
  onContextLost?: () => void;
  label: string;
}

/**
 * The one place the WebGL canvas is configured: capped pixel ratio,
 * paused when the tab is hidden, context-loss reporting.
 * Knows nothing about PCs.
 */
export function StageCanvas({ onContextLost, onCreated, label, children, ...rest }: StageCanvasProps) {
  const visible = usePageVisibility();
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={visible ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      aria-label={label}
      role="img"
      onCreated={(state) => {
        state.gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onContextLost?.();
        });
        onCreated?.(state);
      }}
      {...rest}
    >
      {children}
    </Canvas>
  );
}
