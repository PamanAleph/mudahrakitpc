import { useEffect, useState } from "react";

export type WebGLSupport = "checking" | "supported" | "unsupported";

export function useWebGLSupport(): WebGLSupport {
  const [support, setSupport] = useState<WebGLSupport>("checking");
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      setSupport(ctx ? "supported" : "unsupported");
    } catch {
      setSupport("unsupported");
    }
  }, []);
  return support;
}
