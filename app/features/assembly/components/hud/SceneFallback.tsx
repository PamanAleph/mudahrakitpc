import { Surface } from "@shared/components/Surface";
import { PHASES } from "../../engine/tasks";
import { useAssemblyStore } from "../../store/assemblyStore";
import styles from "./SceneFallback.module.css";

/** No WebGL (or the GPU dropped it): the lesson still reads as text, in the real order. */
export function SceneFallback({ reason }: { reason: "unsupported" | "lost" }) {
  const tasks = useAssemblyStore((s) => s.tasks);
  return (
    <div className={styles.wrap}>
      <Surface className={styles.card}>
        <h2 className={styles.title}>
          {reason === "lost" ? "Tampilan 3D berhenti karena kartu grafis direset" : "Tampilan 3D tidak bisa dimuat di perangkat ini"}
        </h2>
        <p className={styles.lead}>
          {reason === "lost"
            ? "Muat ulang halaman untuk mencoba lagi. Urutan merakit untuk rakitanmu tetap bisa dibaca di bawah."
            : "Browser ini tidak menyediakan WebGL. Urutan merakit untuk rakitanmu tetap bisa dibaca di sini."}
        </p>
        {PHASES.map((phase) => {
          const items = tasks.filter((t) => t.phase === phase.id);
          if (!items.length) return null;
          return (
            <section key={phase.id}>
              <h3 className={styles.phase}>{phase.label}</h3>
              <ol className={styles.list}>
                {items.map((t) => (
                  <li key={t.id}>
                    <strong>{t.title}.</strong> {t.hint}
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </Surface>
    </div>
  );
}
