import { Check, CircleX } from "lucide-react";
import { getPart, type CategoryId } from "@shared/hardware";
import { cn } from "@shared/utils/cn";
import { CATEGORIES } from "../constants/categories";
import type { Issue } from "../rules/compatibility";
import { usePlannerStore } from "../store/plannerStore";
import styles from "./CategoryNav.module.css";

function chosenLabel(category: CategoryId): string | null {
  const b = usePlannerStore.getState().build;
  if (category === "storage") return b.storageIds.length ? `${b.storageIds.length} drive` : null;
  if (category === "fan") return b.fanId ? `${getPart("fan", b.fanId)?.name ?? ""} × ${b.fanCount}` : null;
  const id = (b as unknown as Record<string, string | null>)[`${category}Id`];
  return getPart(category, id)?.name ?? null;
}

/** The shopping list, in the order choices constrain each other. */
export function CategoryNav({ issues }: { issues: Issue[] }) {
  const active = usePlannerStore((s) => s.active);
  const setActive = usePlannerStore((s) => s.setActive);
  usePlannerStore((s) => s.build); // re-render on build change

  return (
    <nav className={styles.nav} aria-label="Kategori komponen">
      <ol className={styles.list}>
        {CATEGORIES.map((c, i) => {
          const chosen = chosenLabel(c.id);
          const blocked = issues.some((x) => x.severity === "block" && x.categories.includes(c.id));
          return (
            <li key={c.id}>
              <button
                type="button"
                className={cn(styles.item, active === c.id && styles.active)}
                aria-current={active === c.id ? "step" : undefined}
                onClick={() => setActive(c.id)}
              >
                <span className={cn(styles.mark, chosen && styles.done, blocked && styles.blocked)} aria-hidden="true">
                  {blocked ? <CircleX size={12} strokeWidth={2.2} /> : chosen ? <Check size={11} strokeWidth={3} /> : i + 1}
                </span>
                <span className={styles.text}>
                  <span className={styles.name}>
                    {c.label}
                    {c.optional ? <span className={styles.optional}> · opsional</span> : null}
                  </span>
                  <span className={styles.chosen}>{chosen ?? "Belum dipilih"}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
