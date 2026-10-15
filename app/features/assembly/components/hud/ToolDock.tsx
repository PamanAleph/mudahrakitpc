import { BookOpen, Expand, Focus, Hand, PackageOpen, RotateCw, Undo2 } from "lucide-react";
import { FASTENERS } from "@shared/hardware";
import { Button } from "@shared/components/Button";
import { SegmentedControl, type SegmentOption } from "@shared/components/SegmentedControl";
import { Surface } from "@shared/components/Surface";
import { useAssemblyStore, useCurrentTask } from "../../store/assemblyStore";
import type { ToolId } from "../../types/assemblyTypes";
import styles from "./ToolDock.module.css";

const ICON = { size: 16, strokeWidth: 1.6, "aria-hidden": true } as const;

const TOOL_OPTIONS: ReadonlyArray<SegmentOption<ToolId>> = [
  { value: "hand", label: "Tangan", content: <Hand size={18} strokeWidth={1.6} aria-hidden="true" /> },
  ...[...FASTENERS.bits].sort((a, b) => a.order - b.order).map((b) => ({ value: b.id as ToolId, label: b.label, mono: true })),
  { value: "paste", label: "Pasta" },
];

/** Tools, what to do with the thing in hand, and camera shortcuts, along the bottom edge. */
export function ToolDock() {
  const tool = useAssemblyStore((s) => s.tool);
  const held = useAssemblyStore((s) => s.held);
  const selectTool = useAssemblyStore((s) => s.selectTool);
  const rotateHeld = useAssemblyStore((s) => s.rotateHeld);
  const dropHeld = useAssemblyStore((s) => s.dropHeld);
  const setView = useAssemblyStore((s) => s.setView);
  const setOverlay = useAssemblyStore((s) => s.setOverlay);
  const task = useCurrentTask();

  return (
    <Surface className={styles.dock} role="toolbar" aria-label="Alat">
      <SegmentedControl label="Pilih alat" value={tool} options={TOOL_OPTIONS} onChange={selectTool} />
      <span className={styles.sep} aria-hidden="true" />
      <Button icon={<RotateCw {...ICON} />} onClick={rotateHeld} disabled={!held} title="Putar 180° (R)">
        <span className={styles.label}>Putar</span>
      </Button>
      <Button icon={<PackageOpen {...ICON} />} onClick={dropHeld} disabled={!held} title="Taruh kembali (Esc)">
        <span className={styles.label}>Taruh</span>
      </Button>
      <span className={styles.sep} aria-hidden="true" />
      <Button icon={<Expand {...ICON} />} onClick={() => setView("overview")} aria-label="Lihat seluruh meja" title="Lihat seluruh meja" iconOnly />
      <Button icon={<Focus {...ICON} />} onClick={() => setView(task?.view ?? "caseInside")} aria-label="Fokus ke tugas" title="Fokus ke tugas" iconOnly />
      <Button icon={<Undo2 {...ICON} />} onClick={() => setView("rear")} aria-label="Lihat sisi belakang casing" title="Sisi belakang" iconOnly />
      <Button icon={<BookOpen {...ICON} />} onClick={() => setOverlay("manual")} title="Manual (M)">
        <span className={styles.label}>Manual</span>
      </Button>
    </Surface>
  );
}
