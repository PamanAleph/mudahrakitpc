import { SegmentedControl } from "@shared/components/SegmentedControl";
import { PRESET_BUILDS, type Goal } from "@shared/hardware";
import { Button } from "@shared/components/Button";
import { BUDGETS, GOAL_LABEL } from "../constants/categories";
import { usePlannerStore } from "../store/plannerStore";
import styles from "./PlanBar.module.css";

/** Act 1: what the PC is for and how much (fictional credit) there is to spend. */
export function PlanBar() {
  const goal = usePlannerStore((s) => s.goal);
  const budget = usePlannerStore((s) => s.budget);
  const setGoal = usePlannerStore((s) => s.setGoal);
  const setBudget = usePlannerStore((s) => s.setBudget);
  const applyPreset = usePlannerStore((s) => s.applyPreset);

  return (
    <section className={styles.bar} aria-label="Rencana rakitan">
      <div className={styles.field}>
        <span className={styles.label}>Untuk</span>
        <SegmentedControl<Goal>
          label="Tujuan rakitan"
          value={goal ?? ("" as Goal)}
          options={(Object.keys(GOAL_LABEL) as Goal[]).map((g) => ({ value: g, label: GOAL_LABEL[g] }))}
          onChange={setGoal}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Anggaran (kredit fiktif)</span>
        <SegmentedControl<string>
          label="Anggaran"
          value={String(budget)}
          options={BUDGETS.map((b) => ({ value: String(b.value), label: b.label, mono: b.value !== null }))}
          onChange={(v) => setBudget(v === "null" ? null : Number(v))}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Atau mulai dari</span>
        <div className={styles.presets}>
          {PRESET_BUILDS.map((p) => (
            <Button key={p.id} variant="ghost" onClick={() => applyPreset(p.id)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
