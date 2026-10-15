import { Link } from "@remix-run/react";
import { AlertTriangle, CircleCheck, CircleX, Info, RotateCcw } from "lucide-react";
import { getConnector } from "@shared/hardware";
import { Button } from "@shared/components/Button";
import { cn } from "@shared/utils/cn";
import { formatMessage } from "../../constants/messages";
import { FP_EXPECTED, FP_MISSING, FP_PINS, FP_PLUGS } from "../../engine/frontPanel";
import { recommendedRamSlots } from "../../engine/selectors";
import { useAssemblyStore } from "../../store/assemblyStore";
import type { FrontPanelPlugId, PasteAmount } from "../../types/assemblyTypes";
import { Dialog } from "./Dialog";
import styles from "./Overlays.module.css";

/** Whichever overlay the store asks for. */
export function Overlays() {
  const overlay = useAssemblyStore((s) => s.overlay);
  const close = useAssemblyStore((s) => s.setOverlay);
  if (overlay === "paste") return <PastePicker onClose={() => close(null)} />;
  if (overlay === "frontPanel") return <FrontPanelPanel onClose={() => close(null)} />;
  if (overlay === "manual") return <ManualPanel onClose={() => close(null)} />;
  if (overlay === "result") return <ResultPanel onClose={() => close(null)} />;
  return null;
}

const PASTE_OPTIONS: Array<{ value: Exclude<PasteAmount, "none">; label: string; detail: string }> = [
  { value: "sedikit", label: "Sedikit", detail: "Sebutir beras" },
  { value: "pas", label: "Secukupnya", detail: "Sebutir kacang polong" },
  { value: "banyak", label: "Banyak", detail: "Satu lingkaran penuh" },
];

function PastePicker({ onClose }: { onClose: () => void }) {
  const paste = useAssemblyStore((s) => s.paste);
  const apply = useAssemblyStore((s) => s.applyPaste);
  const wipe = useAssemblyStore((s) => s.wipePaste);
  return (
    <Dialog title="Oles pasta termal" onClose={onClose}>
      <p className={styles.lead}>Berapa banyak pasta di tengah CPU? Tekanan cooler yang meratakannya.</p>
      <div className={styles.choices}>
        {PASTE_OPTIONS.map((o) => (
          <button key={o.value} type="button" className={styles.choice} aria-pressed={paste === o.value} onClick={() => apply(o.value)}>
            <span className={styles.choiceLabel}>{o.label}</span>
            <span className={styles.choiceDetail}>{o.detail}</span>
          </button>
        ))}
      </div>
      {paste !== "none" ? (
        <Button variant="ghost" onClick={wipe}>
          Bersihkan pasta
        </Button>
      ) : null}
    </Dialog>
  );
}

const plugLabel = (id: FrontPanelPlugId) => FP_PLUGS.find((p) => p.id === id)?.label ?? id;

function FrontPanelPanel({ onClose }: { onClose: () => void }) {
  const fp = useAssemblyStore((s) => s.frontPanel);
  const selected = useAssemblyStore((s) => s.fpSelected);
  const select = useAssemblyStore((s) => s.selectFpPlug);
  const place = useAssemblyStore((s) => s.placeFrontPanel);
  const remove = useAssemblyStore((s) => s.removeFrontPanel);
  const setOverlay = useAssemblyStore((s) => s.setOverlay);
  const occupant = (pin: number) => (Object.entries(fp) as Array<[FrontPanelPlugId, number[]]>).find(([, pins]) => pins.includes(pin))?.[0];
  const rows = [FP_PINS.filter((n) => n % 2 === 1), FP_PINS.filter((n) => n % 2 === 0)];

  return (
    <Dialog title="Header front panel (F_PANEL)" onClose={onClose} wide side>
      <p className={styles.lead}>
        Pilih kabel dari casing, lalu klik pin pertamanya. Kabel 2-pin ikut menempati pin di sebelahnya pada baris yang sama. Tata letak pin ada di manual board.
      </p>
      <div className={styles.fpLayout}>
        <ul className={styles.plugList} aria-label="Kabel front panel">
          {FP_PLUGS.map((p) => (
            <li key={p.id}>
              <button type="button" className={styles.plug} aria-pressed={selected === p.id} onClick={() => select(selected === p.id ? null : p.id)}>
                <span className={styles.plugName}>{p.label}</span>
                <span className={styles.plugMeta}>{fp[p.id] ? `pin ${fp[p.id]!.join(", ")}` : p.width === 2 ? "2 pin" : "1 pin"}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.header} role="grid" aria-label="Pin header, baris ganjil di atas">
          {rows.map((row, r) => (
            <div key={r} role="row" className={styles.pinRow}>
              {row.map((n) => {
                const missing = FP_MISSING.includes(n);
                const occ = occupant(n);
                return (
                  <button
                    key={n}
                    type="button"
                    role="gridcell"
                    disabled={missing}
                    className={cn(styles.pin, occ && styles.pinUsed)}
                    aria-label={missing ? `Pin ${n} tidak ada` : `Pin ${n}${occ ? `, terisi ${plugLabel(occ)}` : ""}`}
                    onClick={() => {
                      if (selected) place(selected, n);
                      else if (occ) remove(occ);
                    }}
                  >
                    <span className={styles.pinNo}>{n}</span>
                    <span className={styles.pinOcc}>{missing ? "–" : occ ? plugLabel(occ) : ""}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.row}>
        <Button onClick={() => setOverlay("manual")}>Buka manual board</Button>
        <span className={styles.hintText}>Klik pin yang terisi tanpa memilih kabel untuk mencabutnya.</span>
      </div>
    </Dialog>
  );
}

function ManualPanel({ onClose }: { onClose: () => void }) {
  const b = useAssemblyStore((s) => s.build);
  const s = useAssemblyStore();
  const fpSource = getConnector("fp-intel").source;
  const pinRows = FP_PINS.map((n) => {
    const plug = (Object.entries(FP_EXPECTED) as Array<[FrontPanelPlugId, number[]]>).find(([, pins]) => pins.includes(n))?.[0];
    return { n, what: FP_MISSING.includes(n) ? "Tidak ada pin (penanda arah)" : plug ? plugLabel(plug) : "Tidak dipakai" };
  });
  const unverified = !b.board.verified || !b.case.verified;
  return (
    <Dialog title={`Manual · ${b.board.name}`} onClose={onClose} wide side>
      {unverified ? <p className={styles.notice}>Sebagian posisi dan angka di manual ini nilai desain simulator [BELUM DIKONFIRMASI].</p> : null}
      <h3 className={styles.h3}>F_PANEL (header front panel)</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Pin</th>
            <th scope="col">Fungsi</th>
          </tr>
        </thead>
        <tbody>
          {pinRows.map((r) => (
            <tr key={r.n}>
              <td className={styles.mono}>{r.n}</td>
              <td>{r.what}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.source}>Sumber: {fpSource.document}. Pin ganjil satu baris, pin genap baris lainnya. Kaki + LED adalah kabel berwarna, − kabel putih atau hitam.</p>

      <h3 className={styles.h3}>Memori</h3>
      <p className={styles.p}>
        {b.board.ramType}, {b.board.ramSlots.length} slot ({b.board.ramSlots.map((r) => r.id).join(", ")}). Untuk {b.ram.sticks} keping pakai slot{" "}
        <strong>{recommendedRamSlots(s).join(" dan ")}</strong> agar jalan di dua kanal.
      </p>

      {b.board.m2Slots.length ? (
        <>
          <h3 className={styles.h3}>Slot M.2</h3>
          <ul className={styles.ul}>
            {b.board.m2Slots.map((m) => (
              <li key={m.id}>
                <span className={styles.mono}>{m.id}</span>: {m.key}-key, {m.interfaces.map((x) => (x === "pcie" ? "PCIe NVMe" : "SATA")).join(" + ")}, panjang {m.lengths.join("/")}.
                {m.disablesSata.length ? ` Bila terisi, port ${m.disablesSata.join(", ")} mati (berbagi jalur).` : ""}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3 className={styles.h3}>Header dan port</h3>
      <ul className={styles.ul}>
        <li>CPU_PWR: {b.board.headers.eps} × EPS 8-pin, di pojok atas dekat panel belakang.</li>
        <li>CPU_FAN: 1 header 4-pin untuk kipas cooler. SYS_FAN: {b.board.headers.sysFan} header untuk kipas casing.</li>
        <li>SATA: {b.board.sataPorts.join(", ")} di tepi depan board.</li>
        <li>
          USB 3.x: {b.board.headers.usb3}, USB-C: {b.board.headers.usbc}, USB 2.0: {b.board.headers.usb2}, HD Audio: {b.board.headers.audio}.
        </li>
        <li>Slot PCIe: {b.board.pcieSlots.map((p) => `${p.id} (${p.kind === "pcie-x16" ? `x16 fisik, x${p.lanes} jalur` : "x1"})`).join(", ")}. VGA di slot x16 paling atas.</li>
      </ul>

      <h3 className={styles.h3}>Casing</h3>
      <ul className={styles.ul}>
        <li>Board yang didukung: {b.case.formFactors.join(", ")}. Standoff hanya di lubang yang cocok dengan board {b.board.formFactor}.</li>
        <li>
          VGA maks {b.case.gpuMaxLengthCm} cm, tinggi cooler maks {b.case.coolerMaxHeightCm} cm, PSU {b.case.psuFormFactor}.
        </li>
        <li>Kipas depan menyedot masuk, belakang dan atas membuang keluar. Panah di rangka kipas menunjuk arah aliran udara.</li>
      </ul>
    </Dialog>
  );
}

const SEVERITY_ICON = { fatal: CircleX, warn: AlertTriangle, note: Info } as const;

function ResultPanel({ onClose }: { onClose: () => void }) {
  const post = useAssemblyStore((s) => s.post);
  const mistakes = useAssemblyStore((s) => s.mistakes);
  const startedAt = useAssemblyStore((s) => s.startedAt);
  const reset = useAssemblyStore((s) => s.reset);
  if (!post) return null;
  const minutes = Math.max(1, Math.round(((post.at || Date.now()) - startedAt) / 60000));
  const headline = post.booted ? "PC menyala sampai layar firmware" : !post.powered ? "PC tidak menyala" : post.led ? `Berhenti di lampu debug ${post.led}` : "PC menyala tapi belum siap";
  return (
    <Dialog title="Hasil menyalakan PC" onClose={onClose} side>
      <div className={cn(styles.result, post.booted ? styles.ok : styles.bad)}>
        {post.booted ? <CircleCheck size={22} strokeWidth={1.75} aria-hidden="true" /> : <CircleX size={22} strokeWidth={1.75} aria-hidden="true" />}
        <strong>{headline}</strong>
      </div>
      <dl className={styles.stats}>
        <div>
          <dt>Kesalahan</dt>
          <dd>{mistakes}</dd>
        </div>
        <div>
          <dt>Waktu</dt>
          <dd>{minutes} menit</dd>
        </div>
      </dl>
      {post.findings.length ? (
        <ul className={styles.findings}>
          {post.findings.map((f, i) => {
            const m = formatMessage(f.key, f.params);
            const Icon = SEVERITY_ICON[f.severity];
            return (
              <li key={i} className={styles[f.severity]}>
                <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                <div>
                  <strong>{m.title}</strong>
                  {m.body ? <p>{m.body}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className={styles.row}>
        <Button variant="primary" onClick={onClose}>
          {post.booted ? "Tutup" : "Perbaiki"}
        </Button>
        <Button icon={<RotateCcw size={16} strokeWidth={1.6} aria-hidden="true" />} onClick={reset}>
          Rakit ulang
        </Button>
        <Link to="/" className={styles.link}>
          Ubah rakitan
        </Link>
      </div>
    </Dialog>
  );
}
