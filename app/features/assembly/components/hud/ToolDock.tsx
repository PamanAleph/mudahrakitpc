import { Expand, Focus, Hand, PackageOpen, RotateCw } from "lucide-react";
import { Button } from "@shared/components/Button";
import { SegmentedControl, type SegmentOption } from "@shared/components/SegmentedControl";
import { Surface } from "@shared/components/Surface";
import { useCurrentStep } from "../../hooks/useCurrentStep";
import { HARDWARE } from "../../services/hardwareSpec";
import { useAssemblyStore } from "../../store/assemblyStore";
import type { ToolId } from "../../types/assemblyTypes";
import styles from "./ToolDock.module.css";

const TOOL_OPTIONS: ReadonlyArray<SegmentOption<ToolId>> = [
  { value: "hand", label: "Tangan", content: <Hand size={18} strokeWidth={1.6} aria-hidden="true" /> },
  ...HARDWARE.fasteners.bits.map((b) => ({ value: b.id, label: b.label, mono: true })),
];

/** Tools and camera, in one bar along the bottom edge. */
export function ToolDock() {
  const tool = useAssemblyStore((s) => s.tool);
  const held = useAssemblyStore((s) => s.held);
  const selectTool = useAssemblyStore((s) => s.selectTool);
  const rotateHeld = useAssemblyStore((s) => s.rotateHeld);
  const dropHeld = useAssemblyStore((s) => s.dropHeld);
  const setView = useAssemblyStore((s) => s.setView);
  const { step } = useCurrentStep();

  return (
    <Surface className={styles.dock} role="toolbar" aria-label="Alat">
      <SegmentedControl label="Pilih alat" value={tool} options={TOOL_OPTIONS} onChange={selectTool} />
      <Button icon={<RotateCw size={16} strokeWidth={1.6} aria-hidden="true" />} onClick={rotateHeld} disabled={held !== "ram"}>
        Putar 180°
      </Button>
      <Button icon={<PackageOpen size={16} strokeWidth={1.6} aria-hidden="true" />} onClick={dropHeld} disabled={!held}>
        Taruh
      </Button>
      <span className={styles.sep} aria-hidden="true" />
      <Button icon={<Expand size={16} strokeWidth={1.6} aria-hidden="true" />} onClick={() => setView("overview")}>
        Lihat semua
      </Button>
      <Button
        icon={<Focus size={16} strokeWidth={1.6} aria-hidden="true" />}
        onClick={() => setView(step && step.view !== "overview" ? step.view : "ram")}
      >
        Fokus
      </Button>
    </Surface>
  );
}
