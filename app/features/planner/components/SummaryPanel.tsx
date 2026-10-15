import { useNavigate } from "@remix-run/react";
import { ArrowRight, CircleX, TriangleAlert } from "lucide-react";
import { buildPrice, estimatePowerW, getPart, saveBuild } from "@shared/hardware";
import { Button } from "@shared/components/Button";
import { cn } from "@shared/utils/cn";
import { CATEGORIES } from "../constants/categories";
import { missingRequired, type Issue } from "../rules/compatibility";
import { usePlannerStore } from "../store/plannerStore";
import styles from "./SummaryPanel.module.css";

function Meter({ label, value, max, unit }: { label: string; value: number; max: number | null; unit: string }) {
  const ratio = max ? value / max : 0;
  const tone = !max ? "neutral" : ratio > 1 ? "over" : ratio > 0.8 ? "near" : "ok";
  return (
    <div className={styles.meter}>
      <div className={styles.meterHead}>
        <span>{label}</span>
        <span className={styles.mono}>
          {value} {max ? `/ ${max}` : ""} {unit}
        </span>
      </div>
      {max ? (
        <div className={styles.track} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
          <div className={cn(styles.fill, styles[tone])} style={{ transform: `scaleX(${Math.min(1, ratio)})` }} />
        </div>
      ) : null}
    </div>
  );
}

/** Running receipt: what's chosen, what it costs, what it draws, and what's wrong. */
export function SummaryPanel({ issues }: { issues: Issue[] }) {
  const build = usePlannerStore((s) => s.build);
  const budget = usePlannerStore((s) => s.budget);
  const setActive = usePlannerStore((s) => s.setActive);
  const reset = usePlannerStore((s) => s.reset);
  const navigate = useNavigate();
  const psu = getPart("psu", build.psuId);
  const missing = missingRequired(build);
  const blocks = issues.filter((i) => i.severity === "block");
  const warns = issues.filter((i) => i.severity === "warn");
  const ready = missing.length === 0 && blocks.length === 0;

  const reason = missing.length
    ? `Lengkapi dulu: ${missing.map((m) => CATEGORIES.find((c) => c.id === m)?.label).join(", ")}.`
    : blocks.length
      ? `Ada ${blocks.length} masalah yang membuat rakitan ini tidak bisa dirakit.`
      : "Semua komponen cocok. Komponen dikirim ke meja rakit.";

  return (
    <aside className={styles.panel} aria-label="Ringkasan rakitan">
      <h2 className={styles.heading}>Rakitan kamu</h2>

      <div className={styles.meters}>
        <Meter label="Total harga" value={buildPrice(build)} max={budget} unit="kredit" />
        <Meter label="Perkiraan daya" value={estimatePowerW(build)} max={psu?.watt ?? null} unit="W" />
      </div>

      {issues.length ? (
        <ul className={styles.issues} aria-label="Masalah kompatibilitas">
          {[...blocks, ...warns].map((i) => (
            <li key={i.id} className={cn(styles.issue, styles[i.severity])}>
              {i.severity === "block" ? (
                <CircleX size={16} strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <TriangleAlert size={16} strokeWidth={1.8} aria-hidden="true" />
              )}
              <div>
                <button type="button" className={styles.issueTitle} onClick={() => i.categories[0] && setActive(i.categories[0])}>
                  {i.title}
                </button>
                <p className={styles.issueBody}>{i.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.actions}>
        <p className={styles.reason}>{reason}</p>
        <Button
          variant="primary"
          disabled={!ready}
          icon={<ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />}
          onClick={() => {
            saveBuild(build);
            navigate("/rakit");
          }}
        >
          Mulai merakit
        </Button>
        <Button variant="ghost" onClick={reset}>
          Kosongkan
        </Button>
      </div>
    </aside>
  );
}
