import { ListChecks, RotateCcw } from "lucide-react";
import { Suspense, lazy, useEffect, useState } from "react";
import { Button } from "@shared/components/Button";
import { Surface } from "@shared/components/Surface";
import { useHydrated } from "@shared/hooks/useHydrated";
import { useMediaQuery } from "@shared/hooks/useMediaQuery";
import { useWebGLSupport } from "@shared/hooks/useWebGLSupport";
import { FeedbackToast } from "../components/hud/FeedbackToast";
import { HoldRing } from "../components/hud/HoldRing";
import { HoverTip } from "../components/hud/HoverTip";
import { SceneFallback } from "../components/hud/SceneFallback";
import { ScenePoster } from "../components/hud/ScenePoster";
import { StepCard } from "../components/hud/StepCard";
import { StepList } from "../components/hud/StepList";
import { ToolDock } from "../components/hud/ToolDock";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useStepEffects } from "../hooks/useStepEffects";
import { useAssemblyStore } from "../store/assemblyStore";
import styles from "./AssemblyPage.module.css";

const AssemblySceneRoot = lazy(() => import("../components/scene/AssemblySceneRoot"));

/** Guided assembly session: the 3D bench with the HUD floating at its edges. */
export function AssemblyPage() {
  const hydrated = useHydrated();
  const webgl = useWebGLSupport();
  const [contextLost, setContextLost] = useState(false);
  const reset = useAssemblyStore((s) => s.reset);
  // The full step list is secondary: open by default only where it doesn't cover the bench.
  const roomy = useMediaQuery("(min-width: 1360px)");
  const [listOpen, setListOpen] = useState(false);
  useEffect(() => setListOpen(roomy), [roomy]);
  useKeyboardShortcuts();
  useStepEffects();

  return (
    <div className={styles.app}>
      <div className={styles.stage}>
        {!hydrated || webgl === "checking" ? (
          <ScenePoster />
        ) : webgl === "unsupported" || contextLost ? (
          <SceneFallback reason={contextLost ? "lost" : "unsupported"} />
        ) : (
          <Suspense fallback={<ScenePoster />}>
            <AssemblySceneRoot onContextLost={() => setContextLost(true)} />
          </Suspense>
        )}
      </div>

      <header className={styles.top}>
        <Surface className={styles.brand}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="5" y="5" width="14" height="14" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
          </svg>
          <strong className={styles.brandName}>Rakit PC 3D</strong>
          <span className={styles.brandMode}>Terpandu</span>
        </Surface>
        <StepCard />
        <div className={styles.actions}>
          <Button
            icon={<ListChecks size={16} strokeWidth={1.6} aria-hidden="true" />}
            aria-expanded={listOpen}
            aria-controls="step-list"
            aria-label="Daftar langkah"
            onClick={() => setListOpen((v) => !v)}
          >
            <span className={styles.actionLabel}>Langkah</span>
          </Button>
          <Button icon={<RotateCcw size={16} strokeWidth={1.6} aria-hidden="true" />} aria-label="Ulang dari awal" onClick={reset}>
            <span className={styles.actionLabel}>Ulang</span>
          </Button>
        </div>
      </header>

      {listOpen ? (
        <div className={styles.side} id="step-list">
          <StepList />
        </div>
      ) : null}

      <div className={styles.feedback}>
        <FeedbackToast />
      </div>

      <div className={styles.dock}>
        <ToolDock />
      </div>

      <HoldRing />
      <HoverTip />
    </div>
  );
}
