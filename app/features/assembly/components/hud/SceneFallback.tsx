import { Surface } from "@shared/components/Surface";
import { STEPS } from "../../constants/steps";
import styles from "./SceneFallback.module.css";

/** No WebGL (or the GPU dropped it): the lesson still reads as text. */
export function SceneFallback({ reason }: { reason: "unsupported" | "lost" }) {
  return (
    <div className={styles.wrap}>
      <Surface className={styles.card}>
        <h2 className={styles.title}>
          {reason === "lost" ? "Tampilan 3D berhenti karena kartu grafis direset" : "Tampilan 3D tidak bisa dimuat di perangkat ini"}
        </h2>
        <p className={styles.lead}>
          {reason === "lost"
            ? "Muat ulang halaman untuk mencoba lagi. Urutan langkahnya tetap bisa dibaca di bawah."
            : "Browser ini tidak menyediakan WebGL. Urutan langkah di simulator tetap bisa dibaca di sini."}
        </p>
        <ol className={styles.list}>
          {STEPS.map((s) => (
            <li key={s.id}>
              <strong>{s.title}.</strong> {s.hint}
            </li>
          ))}
        </ol>
      </Surface>
    </div>
  );
}
