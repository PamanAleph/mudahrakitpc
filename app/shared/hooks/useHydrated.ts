import { useEffect, useState } from "react";

/** True after the first client render. Gate browser-only UI (WebGL) behind it. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
