import styles from "./ScenePoster.module.css";

/** Shown while the 3D chunk downloads. Same footprint as the canvas, so nothing shifts. */
export function ScenePoster() {
  return (
    <div className={styles.poster} role="img" aria-label="Menyiapkan meja rakit 3D">
      <div className={styles.mat}>
        <div className={styles.case} />
      </div>
      <p className={styles.label}>Menyiapkan meja rakit…</p>
    </div>
  );
}
