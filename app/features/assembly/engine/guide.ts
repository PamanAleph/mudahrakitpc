import { getScrew, type ResolvedBuild } from "@shared/hardware";
import type { CaseGeometry } from "../constants/layouts";
import type { AssemblySnapshot, CableSpec, GuideStep, PartInstance, ToolId } from "../types/assemblyTypes";
import { fastenersFor } from "./parts";
import { derivePorts } from "./ports";
import { matchesPort, portAvailable, portOccupant, recommendedRamSlots, requiredCovers, standoffDiff } from "./selectors";

type Guide = (s: AssemblySnapshot) => GuideStep | null;

const TOOL_KEY: Record<string, string> = { PH0: "1", PH1: "2", PH2: "3" };

const tap = (target: string, how: string): GuideStep => ({ gesture: "tap", target, how });
const place = (spot: string, how: string): GuideStep => ({ gesture: "tap", spot, how });
const carry = (target: string, spot: string, how: string): GuideStep => ({ gesture: "carry", target, spot, how });

/**
 * The "how" for every task: given the bench right now, what is the very next
 * click, hold or carry, and on which object. Pure; the scene turns it into a
 * marker and a replayable demo. Facts (which bit, which slot) come from data.
 */
export function deriveGuides(b: ResolvedBuild, parts: PartInstance[], cables: CableSpec[], geometry: CaseGeometry): Record<string, Guide> {
  const g: Record<string, Guide> = {};
  const ports = derivePorts(b);
  const heldId = (s: AssemblySnapshot) => (s.held?.kind === "part" ? s.held.id : null);
  const part = (id: string) => parts.find((p) => p.id === id)!;

  /** Press-and-hold the screws of a mounted part, with the bit its fastener needs. */
  const fasten = (id: string, what: string): Guide => (s) => {
    const f = fastenersFor(b, part(id));
    const bit = f ? (getScrew(f.screwId).bit as ToolId) : undefined;
    const key = bit ? TOOL_KEY[bit] : undefined;
    const pick = bit && s.tool !== bit ? `Pilih mata ${bit}${key ? ` (tombol ${key})` : ""} dulu. ` : "";
    return { gesture: "hold", target: id, tool: bit, how: `${pick}Lalu tahan klik pada ${what} sampai bautnya selesai terpasang.` };
  };

  /** Pick a part up and put it on a mount. */
  const mountPart = (id: string, spot: (s: AssemblySnapshot) => string, pickHow: string, placeHow: string, flipHow?: (s: AssemblySnapshot) => string | null): Guide => (s) => {
    const to = spot(s);
    if (heldId(s) === id) return place(to, flipHow?.(s) ?? placeHow);
    return carry(id, to, pickHow);
  };

  g.strap = () => tap("strap", "Klik gelang di sudut kanan depan alas. Gelang menempel di pergelangan tangan.");

  const lever = (open: boolean): Guide => () =>
    tap("lever", open ? "Klik tuas logam di tepi socket. Tuas terangkat dan pelat penahan ikut terbuka." : "Klik tuas yang sama sekali lagi. Pelat turun dan menekan CPU.");
  g["lever-open"] = lever(true);
  g["lever-close"] = lever(false);

  g.cpu = mountPart(
    "cpu",
    () => "socket",
    "Klik CPU di meja untuk mengambilnya, lalu gerakkan ke socket. Tekan R bila segitiga emasnya belum searah penanda socket.",
    "Letakkan: klik socket yang menyala hijau.",
    (s) => ((s.parts.cpu?.flips ?? 0) % 2 !== 0 ? "Segitiga emas CPU belum searah penanda socket. Tekan R sampai menyala hijau, lalu klik socket." : null),
  );

  g.paste = () => ({ gesture: "tap", target: "cpu", tool: "paste", how: "Pilih alat Pasta (tombol 4), klik CPU, lalu pilih jumlah “pas”." });
  g.plastic = () => tap("cooler", "Pastikan alat Tangan terpilih (tombol 0), lalu klik cooler di meja untuk mengupas plastik di dasarnya.");
  g.cooler = mountPart(
    "cooler",
    () => "cooler",
    "Klik cooler untuk mengambilnya, gerakkan ke atas CPU.",
    "Letakkan: klik titik cooler yang menyala hijau di atas CPU.",
  );
  g["cooler-screws"] = fasten("cooler", "cooler");

  const ramSlot = (s: AssemblySnapshot, index: number) => recommendedRamSlots(s)[index] ?? b.board.ramSlots[index]?.id ?? "";
  parts
    .filter((p) => p.kind === "ram")
    .forEach((p) => {
      g[p.id] = (s) => {
        const slot = ramSlot(s, p.index);
        const st = s.parts[p.id];
        if (st?.location === "mounted" && st.stage === "inserted") return { gesture: "hold", target: p.id, how: "Tahan klik pada keping RAM sampai terdengar “klik”. Klip di ujung slot menutup sendiri." };
        if (!s.latches[slot] && heldId(s) !== p.id) return tap(`latch:${slot}`, `Klik klip di ujung slot ${slot} untuk membukanya. RAM hanya bisa masuk bila klipnya terbuka.`);
        if (heldId(s) === p.id) {
          if (!s.latches[slot]) return tap(`latch:${slot}`, `Klip slot ${slot} masih tertutup. Klik klipnya dulu.`);
          return place(`ram:${slot}`, (st?.flips ?? 0) % 2 !== 0 ? "Takik RAM belum searah takik slot. Tekan R sampai menyala hijau, lalu klik slot." : `Klik slot ${slot} yang menyala hijau.`);
        }
        return carry(p.id, `ram:${slot}`, `Klik keping RAM untuk mengambilnya, lalu bawa ke slot ${slot}. Tekan R bila takiknya terbalik.`);
      };
    });

  parts
    .filter((p) => p.kind === "m2")
    .forEach((p) => {
      const slot = () => b.board.m2Slots.find((x) => b.storage[p.index]?.m2Length && x.lengths.includes(b.storage[p.index]!.m2Length!))?.id ?? b.board.m2Slots[0]?.id ?? "";
      const screws = fasten(p.id, "SSD M.2");
      g[p.id] = (s) => {
        const st = s.parts[p.id];
        if (st?.location === "mounted" && st.stage === "angled") return { gesture: "hold", target: p.id, how: "Tahan klik pada SSD sampai rata dengan board." };
        if (st?.location === "mounted") return screws(s);
        return mountPart(p.id, () => `m2:${slot()}`, "Klik SSD M.2 untuk mengambilnya, bawa ke slot M.2.", "Letakkan: klik slot M.2 yang menyala hijau. SSD masuk miring.")(s);
      };
    });

  g["panel-off"] = (s) => {
    const st = s.parts.panel;
    if (st?.location === "mounted" && st.fastened > 0) return fasten("panel", "panel samping")(s);
    return tap("panel", "Baut sudah lepas. Klik panel untuk mengangkatnya, lalu taruh di meja.");
  };

  g.standoffs = (s) => {
    const d = standoffDiff(s, geometry);
    const missing = d.missing[0];
    if (missing) return tap(`standoff:${missing}`, `Klik lubang yang berkedip untuk memasang standoff. Board ${b.board.formFactor} butuh ${d.missing.length} lagi.`);
    const extra = d.extra[0];
    return extra ? tap(`standoff:${extra}`, "Klik standoff yang berkedip ini untuk melepasnya. Lubang itu tidak dipakai board ini.") : null;
  };

  const fanMounts = b.case.fanMounts.filter((m) => (m.sizes as number[]).includes(b.fan?.sizeMm ?? 120));
  parts
    .filter((p) => p.kind === "fan")
    .forEach((p) => {
      const mount = fanMounts[p.index];
      const screws = fasten(p.id, "kipas");
      g[p.id] = (s) => {
        if (s.parts[p.id]?.location === "mounted") return screws(s);
        if (!mount) return null;
        const intake = mount.side === "front";
        const flips = (s.parts[p.id]?.flips ?? 0) % 2;
        const right = intake ? flips === 0 : flips === 1;
        const air = intake ? "menyedot udara masuk" : "membuang udara keluar";
        if (heldId(s) === p.id) return place(`fan:${mount.id}`, right ? "Klik titik kipas yang menyala hijau." : `Arah kipas salah di sisi ini. Tekan R sampai kipas ${air}.`);
        return carry(p.id, `fan:${mount.id}`, `Klik kipas, bawa ke titik yang berkedip. Di sisi ini kipas harus ${air}; tekan R untuk membalik.`);
      };
    });

  g.psu = (s) =>
    s.parts.psu?.location === "mounted"
      ? fasten("psu", "PSU")(s)
      : mountPart("psu", () => "psu-bay", "Klik PSU untuk mengambilnya, bawa ke ruang PSU di bawah.", "Letakkan: klik ruang PSU yang menyala hijau.")(s);

  g.board = mountPart("board", () => "case-board", "Klik board di kotaknya untuk mengangkatnya, lalu bawa ke atas standoff di casing.", "Letakkan: klik titik board yang menyala hijau.");
  g["board-screws"] = fasten("board", "board");

  parts
    .filter((p) => p.kind === "drive")
    .forEach((p) => {
      const kind = b.storage[p.index]?.kind;
      const screws = fasten(p.id, "drive");
      g[p.id] = (s) => {
        if (s.parts[p.id]?.location === "mounted") return screws(s);
        const bays = b.case.driveBays.filter((x) => x.kind === kind);
        const free = bays.find((x) => !Object.values(s.parts).some((q) => q.location === "mounted" && q.mount === `bay:${x.id}`)) ?? bays[0];
        return mountPart(p.id, () => `bay:${free?.id ?? ""}`, `Klik drive untuk mengambilnya, bawa ke bay ${kind} yang berkedip.`, "Letakkan: klik bay yang menyala hijau.")(s);
      };
    });

  g.covers = (s) => {
    const i = requiredCovers(s).find((n) => !s.slotCovers[n]);
    return i === undefined ? null : tap(`cover:${i}`, "Klik penutup slot yang berkedip untuk melepasnya dari panel belakang.");
  };
  if (b.gpu) {
    g.gpu = mountPart("gpu", () => `pcie:${b.board.pcieSlots[0]?.id}`, "Klik VGA untuk mengambilnya, bawa ke slot PCIe x16 paling atas.", "Letakkan: klik slot yang menyala hijau.");
    g["gpu-screws"] = fasten("gpu", "VGA");
  }

  for (const c of cables.filter((x) => x.required)) {
    g[`cable-${c.id}`] = (s) => {
      const t = c.targets.find((x) => {
        const e = s.cables[c.id]?.ends[x.end];
        return !(e?.state === "plugged" && e.portId && matchesPort(x.portId, e.portId));
      });
      if (!t) return null;
      const port = ports.find((p) => matchesPort(t.portId, p.id) && !portOccupant(s, p.id) && portAvailable(s, p).ok);
      const held = s.held?.kind === "cable" && s.held.id === c.id;
      if (held) return place(port?.id ?? t.portId, `Klik port yang menyala hijau. Bila merah, tekan R untuk memutar colokannya.`);
      return carry(`plug:${c.id}:${t.end}`, port?.id ?? t.portId, "Klik ujung kabel yang bebas untuk mengangkatnya, bawa ke port yang berkedip, lalu klik. Tekan R bila kaitnya tidak cocok.");
    };
  }

  g["front-panel"] = () => tap("fp-header", "Klik header front panel di pojok bawah board. Lalu pilih tiap kabel dan klik pasangan pinnya (lihat manual, tombol M).");

  g["panel-on"] = (s) =>
    s.parts.panel?.location === "mounted"
      ? fasten("panel", "panel samping")(s)
      : mountPart("panel", () => "panel", "Klik panel di meja untuk mengangkatnya, bawa ke atas casing.", "Letakkan: klik casing yang menyala hijau.")(s);
  g["psu-switch"] = () => tap("psu-switch", "Lihat sisi belakang casing, lalu klik saklar PSU. Posisi I berarti nyala.");
  g.power = () => tap("power-button", "Klik tombol bulat di sisi atas casing (yang sedang menghadap ke kanan).");

  return g;
}
