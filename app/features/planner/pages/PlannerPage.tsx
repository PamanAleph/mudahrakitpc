import { Link } from "@remix-run/react";
import { useEffect, useMemo } from "react";
import { HAS_UNVERIFIED_DATA, loadBuild } from "@shared/hardware";
import { CategoryNav } from "../components/CategoryNav";
import { OptionList } from "../components/OptionList";
import { PlanBar } from "../components/PlanBar";
import { SummaryPanel } from "../components/SummaryPanel";
import { evaluateBuild } from "../rules/compatibility";
import { usePlannerStore } from "../store/plannerStore";
import styles from "./PlannerPage.module.css";

/** Acts 1–2: plan and shop. Ends by sending a compatible build to the bench. */
export function PlannerPage() {
  const build = usePlannerStore((s) => s.build);
  const budget = usePlannerStore((s) => s.budget);
  const hydrate = usePlannerStore((s) => s.hydrate);
  const issues = useMemo(() => evaluateBuild(build, budget), [build, budget]);

  useEffect(() => {
    const saved = loadBuild();
    if (saved) hydrate(saved);
  }, [hydrate]);

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link to="/" className={styles.brand}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="5" y="5" width="14" height="14" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
          </svg>
          <strong>Rakit PC 3D</strong>
        </Link>
        <ol className={styles.acts} aria-label="Tahap">
          <li className={styles.actNow}>1 · Rencana dan belanja</li>
          <li>2 · Rakit</li>
          <li>3 · Nyalakan</li>
        </ol>
      </header>

      <div className={styles.layout}>
        <div className={styles.nav}>
          <CategoryNav issues={issues} />
        </div>
        <main className={styles.main}>
          <PlanBar />
          <OptionList />
          {HAS_UNVERIFIED_DATA ? (
            <p className={styles.note}>
              Katalog berisi komponen generik. Standar konektor bersumber; sebagian nilai masih <span className={styles.mono}>[BELUM DIKONFIRMASI]</span>.
            </p>
          ) : null}
        </main>
        <div className={styles.summary}>
          <SummaryPanel issues={issues} />
        </div>
      </div>
    </div>
  );
}
