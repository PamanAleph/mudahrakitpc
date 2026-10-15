import { useEffect, useState } from "react";

/**
 * Reads CSS custom properties (design tokens) for code that cannot use CSS,
 * such as Three.js materials. Re-reads when the theme changes, so the 3D
 * scene follows light/dark exactly like the HUD.
 */
export function useCssTokens<const K extends readonly string[]>(names: K, fallback: string): Record<K[number], string> {
  const read = () => {
    const out = {} as Record<K[number], string>;
    const style = typeof window === "undefined" ? null : getComputedStyle(document.documentElement);
    for (const name of names) {
      out[name as K[number]] = style?.getPropertyValue(name).trim() || fallback;
    }
    return out;
  };
  const [values, setValues] = useState(read);

  useEffect(() => {
    const update = () => setValues(read());
    update();
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mql.removeEventListener("change", update);
      observer.disconnect();
    };
    // names is a const tuple from the caller; reading it once is intended.
  }, []);

  return values;
}
