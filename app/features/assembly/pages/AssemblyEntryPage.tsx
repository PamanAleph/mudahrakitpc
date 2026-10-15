import { Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import { PRESET_BUILDS, loadBuild, resolveBuild, saveBuild, type ResolvedBuild } from "@shared/hardware";
import { Button } from "@shared/components/Button";
import { Surface } from "@shared/components/Surface";
import { ScenePoster } from "../components/hud/ScenePoster";
import { AssemblyPage } from "./AssemblyPage";
import styles from "./AssemblyEntryPage.module.css";

/**
 * Reads the build chosen in the planner (stored in this browser) and opens the
 * bench with it. Without a complete build there is nothing to assemble yet.
 */
export function AssemblyEntryPage() {
  const [state, setState] = useState<{ status: "loading" } | { status: "missing" } | { status: "ready"; build: ResolvedBuild }>({ status: "loading" });
  const load = () => {
    const raw = loadBuild();
    const build = raw ? resolveBuild(raw) : null;
    setState(build ? { status: "ready", build } : { status: "missing" });
  };
  useEffect(load, []);

  if (state.status === "loading") return <ScenePoster />;
  if (state.status === "ready") return <AssemblyPage build={state.build} />;
  return (
    <main className={styles.wrap}>
      <Surface className={styles.card}>
        <h1 className={styles.title}>Belum ada rakitan untuk dirakit</h1>
        <p className={styles.lead}>Pilih komponen dulu di halaman belanja: casing, board, CPU, cooler, RAM, penyimpanan, dan PSU. Atau mulai dari contoh rakitan.</p>
        <div className={styles.row}>
          <Link to="/" className={styles.primary}>
            Pilih komponen
          </Link>
          {PRESET_BUILDS.map((p) => (
            <Button
              key={p.id}
              onClick={() => {
                saveBuild(p.build);
                load();
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </Surface>
    </main>
  );
}
