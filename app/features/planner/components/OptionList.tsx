import { Check, CircleX, Minus, Plus } from "lucide-react";
import { CATALOG, type AnyPart, type CategoryId } from "@shared/hardware";
import { Button } from "@shared/components/Button";
import { cn } from "@shared/utils/cn";
import { CATEGORIES, GOAL_LABEL, specLine } from "../constants/categories";
import { optionProblem } from "../rules/compatibility";
import { usePlannerStore } from "../store/plannerStore";
import styles from "./OptionList.module.css";

/** Act 2: the options for one category. Incompatible ones stay visible, dimmed, with the reason. */
export function OptionList() {
  const active = usePlannerStore((s) => s.active);
  const build = usePlannerStore((s) => s.build);
  const goal = usePlannerStore((s) => s.goal);
  const choose = usePlannerStore((s) => s.choose);
  const clear = usePlannerStore((s) => s.clear);
  const setFanCount = usePlannerStore((s) => s.setFanCount);
  const info = CATEGORIES.find((c) => c.id === active);
  const items = CATALOG[active] as AnyPart[];

  const isChosen = (id: string) =>
    active === "storage"
      ? build.storageIds.includes(id)
      : (build as unknown as Record<string, string | null>)[`${active}Id`] === id;

  return (
    <section className={styles.section} aria-labelledby="category-title">
      <header className={styles.head}>
        <h1 id="category-title" className={styles.title}>
          {info?.label}
        </h1>
        <p className={styles.why}>{info?.why}</p>
      </header>

      <ul className={styles.list}>
        {items.map((item) => {
          const chosen = isChosen(item.id);
          const problem = chosen ? null : optionProblem(build, active, item.id);
          return (
            <li key={item.id} className={cn(styles.row, chosen && styles.chosen, problem && styles.blocked)}>
              <div className={styles.main}>
                <div className={styles.nameLine}>
                  <strong className={styles.name}>{item.name}</strong>
                  {chosen ? (
                    <span className={styles.chosenTag}>
                      <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                      Dipilih
                    </span>
                  ) : null}
                  {goal && item.goals.includes(goal) ? <span className={styles.fit}>Cocok untuk {GOAL_LABEL[goal].toLowerCase()}</span> : null}
                </div>
                <ul className={styles.specs}>
                  {specLine(active as CategoryId, item as never).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                {problem ? (
                  <p className={styles.problem}>
                    <CircleX size={14} strokeWidth={1.8} aria-hidden="true" />
                    <span>
                      <strong>{problem.title}.</strong> {problem.body}
                    </span>
                  </p>
                ) : null}
              </div>
              <div className={styles.side}>
                <span className={styles.price}>{item.price} kredit</span>
                {chosen && active !== "storage" ? (
                  <Button variant="ghost" onClick={() => clear(active)}>
                    Lepas pilihan
                  </Button>
                ) : (
                  <Button variant={chosen ? "secondary" : problem ? "secondary" : "primary"} onClick={() => choose(active, item.id)} aria-pressed={chosen}>
                    {chosen ? "Hapus" : "Pilih"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {active === "fan" && build.fanId ? (
        <div className={styles.count}>
          <span>Jumlah kipas</span>
          <Button iconOnly aria-label="Kurangi kipas" icon={<Minus size={16} aria-hidden="true" />} onClick={() => setFanCount(build.fanCount - 1)} />
          <span className={styles.countValue}>{build.fanCount}</span>
          <Button iconOnly aria-label="Tambah kipas" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setFanCount(build.fanCount + 1)} />
        </div>
      ) : null}
    </section>
  );
}
