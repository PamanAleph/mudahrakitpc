import { Link } from "@remix-run/react";
import { ListChecks, RotateCcw, ShoppingCart } from "lucide-react";
import { Suspense, lazy, useEffect, useState } from "react";
import type { ResolvedBuild } from "@shared/hardware";
import { Button } from "@shared/components/Button";
import { SegmentedControl } from "@shared/components/SegmentedControl";
import { Surface } from "@shared/components/Surface";
import { useHydrated } from "@shared/hooks/useHydrated";
import { useMediaQuery } from "@shared/hooks/useMediaQuery";
import { useWebGLSupport } from "@shared/hooks/useWebGLSupport";
import { FeedbackToast } from "../components/hud/FeedbackToast";
import { HoldRing } from "../components/hud/HoldRing";
import { HoverTip } from "../components/hud/HoverTip";
import { Overlays } from "../components/hud/Overlays";
import { SceneFallback } from "../components/hud/SceneFallback";
import { ScenePoster } from "../components/hud/ScenePoster";
import { TaskCard } from "../components/hud/TaskCard";
import { TaskList } from "../components/hud/TaskList";
import { ToolDock } from "../components/hud/ToolDock";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useTaskEffects } from "../hooks/useTaskEffects";
import { useAssemblyStore } from "../store/assemblyStore";
import type { Mode } from "../types/assemblyTypes";
import styles from "./AssemblyPage.module.css";

const AssemblySceneRoot = lazy(() => import("../components/scene/AssemblySceneRoot"));

const MODES = [
  { value: "guided", label: "Terpandu" },
  { value: "free", label: "Bebas" },
] as const satisfies ReadonlyArray<{ value: Mode; label: string }>;

/** Act 3 and 4: assemble the parts that were bought, then power it on. */
export function AssemblyPage({ build }: { build: ResolvedBuild }) {
  const hydrated = useHydrated();
  const webgl = useWebGLSupport();
  const [contextLost, setContextLost] = useState(false);
  const ready = useAssemblyStore((s) => s.ready);
  const init = useAssemblyStore((s) => s.init);
  const reset = useAssemblyStore((s) => s.reset);
  const mode = useAssemblyStore((s) => s.mode);
  const setMode = useAssemblyStore((s) => s.setMode);
  const roomy = useMediaQuery("(min-width: 1360px)");
  const [listOpen, setListOpen] = useState(false);
  useEffect(() => setListOpen(roomy), [roomy]);
  useEffect(() => init(build), [build, init]);
  useKeyboardShortcuts();
  useTaskEffects();

  if (!ready) return <ScenePoster />;

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
        </Surface>
        <TaskCard />
        <div className={styles.actions}>
          <Surface className={styles.modeWrap}>
            <SegmentedControl label="Mode merakit" value={mode} options={MODES} onChange={setMode} />
          </Surface>
          <Button
            icon={<ListChecks size={16} strokeWidth={1.6} aria-hidden="true" />}
            aria-expanded={listOpen}
            aria-controls="task-list"
            aria-label="Daftar tugas"
            onClick={() => setListOpen((v) => !v)}
          >
            <span className={styles.actionLabel}>Tugas</span>
          </Button>
          <Link to="/" className={styles.linkButton} aria-label="Ubah rakitan">
            <ShoppingCart size={16} strokeWidth={1.6} aria-hidden="true" />
            <span className={styles.actionLabel}>Ubah rakitan</span>
          </Link>
          <Button icon={<RotateCcw size={16} strokeWidth={1.6} aria-hidden="true" />} aria-label="Ulang dari awal" onClick={reset}>
            <span className={styles.actionLabel}>Ulang</span>
          </Button>
        </div>
      </header>

      {listOpen ? (
        <div className={styles.side} id="task-list">
          <TaskList />
        </div>
      ) : null}

      <div className={styles.feedback}>
        <FeedbackToast />
      </div>

      <div className={styles.dock}>
        <ToolDock />
      </div>

      <Overlays />
      <HoldRing />
      <HoverTip />
    </div>
  );
}
