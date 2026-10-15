import type { FeedbackTone } from "../types/assemblyTypes";

/**
 * Educational copy, keyed by rule outcome. Every rejection explains WHY,
 * in plain Indonesian, and what to do next. Placeholders: {name}.
 */
interface MessageTemplate {
  tone: FeedbackTone;
  title: string;
  body: string;
}

export const MESSAGES = {
  // Fasteners
  "screw.needsTool": {
    tone: "info",
    title: "Butuh obeng",
    body: "{screw} tidak bisa diputar dengan tangan. Pilih mata obeng di bilah bawah.",
  },
  "screw.bitTooSmall": {
    tone: "danger",
    title: "Mata {bit} terlalu kecil",
    body: "Ujungnya tidak mengisi alur kepala baut, jadi akan selip dan membuat alurnya dol. {screw} butuh mata {need}.",
  },
  "screw.bitTooLarge": {
    tone: "danger",
    title: "Mata {bit} terlalu besar",
    body: "Ujungnya tidak bisa masuk ke alur kepala baut, dan kalau dipaksa kepala bautnya rusak. {screw} butuh mata {need}.",
  },
  "screw.holdToTurn": {
    tone: "info",
    title: "Tahan untuk memutar",
    body: "Baut perlu diputar beberapa kali. Tahan klik sampai bautnya terangkat.",
  },
  "screw.removed": { tone: "success", title: "Baut lepas", body: "Tinggal {left} baut lagi. Baut ditaruh di mangkuk supaya tidak hilang." },
  "screw.allRemoved": { tone: "success", title: "Semua baut lepas", body: "Sekarang panel kaca bisa diangkat." },

  // Panel
  "panel.stillScrewed": {
    tone: "danger",
    title: "Panel masih tertahan baut",
    body: "Masih ada {left} baut di sudut panel. Lepas semuanya dulu supaya kacanya tidak tertekuk dan retak.",
  },
  "panel.removed": {
    tone: "success",
    title: "Panel terangkat",
    body: "Bagian dalam casing terbuka. Board, socket CPU, dan slot RAM sekarang bisa dijangkau.",
  },

  // Hands
  "hands.full": {
    tone: "info",
    title: "Tangan sedang memegang sesuatu",
    body: "Pasang atau taruh dulu benda yang sedang dipegang (tombol Taruh atau Esc).",
  },
  "hands.toolInUse": {
    tone: "info",
    title: "Tangan memegang obeng",
    body: "Pilih alat Tangan di bilah bawah untuk mengambil komponen.",
  },

  // RAM
  "ram.picked": {
    tone: "info",
    title: "{name} dipegang",
    body: "{type}, {pins} pin. Arahkan ke slot RAM. Slot hijau siap menerima keping, slot merah belum.",
  },
  "ram.aimAtSlot": { tone: "info", title: "Arahkan ke slot RAM", body: "Gerakkan keping ke atas salah satu slot sampai slotnya menyala, lalu klik." },
  "ram.latchClosed": {
    tone: "danger",
    title: "Klip slot masih tertutup",
    body: "Buka klip di ujung slot {slot} dulu. Keping yang ditekan ke slot tertutup akan tertahan, dan klipnya bisa patah.",
  },
  "ram.notchMisaligned": {
    tone: "danger",
    title: "Takik tidak sejajar",
    body: "Celah di bawah keping harus jatuh tepat di atas sekat di slot. Putar keping 180° (tombol Putar atau R), lalu coba lagi.",
  },
  "ram.typeMismatch": {
    tone: "danger",
    title: "Tipe RAM tidak cocok",
    body: "Board ini memakai slot {slotType}, sedangkan keping ini {ramType}. Posisi takiknya berbeda, jadi keping ini tidak akan masuk.",
  },
  "ram.inserted": {
    tone: "info",
    title: "Keping masuk ke alur slot",
    body: "Sekarang tekan lurus ke bawah: tahan klik pada keping sampai klipnya menutup.{advice}",
  },
  "ram.slotAdvice": { tone: "info", title: "", body: " Untuk satu keping, manual board ini menganjurkan slot {recommended}." },
  "ram.seated": {
    tone: "success",
    title: "Terkunci",
    body: "Klip menutup sendiri karena keping sudah masuk penuh. Kalau klip belum menutup, berarti keping belum masuk sempurna.",
  },
  "ram.alreadySeated": { tone: "info", title: "Keping sudah terkunci", body: "Untuk melepasnya, buka klip di ujung slot dulu." },
  "ram.pressNotLatch": {
    tone: "info",
    title: "Tekan kepingnya, bukan klipnya",
    body: "Klip menutup sendiri saat keping masuk penuh. Tahan klik pada keping RAM.",
  },
  "latch.opened": {
    tone: "info",
    title: "Klip slot {slot} terbuka",
    body: "Slot ini siap menerima keping. Klip akan menutup sendiri saat keping ditekan penuh.",
  },
  "latch.openedEject": {
    tone: "info",
    title: "Klip slot {slot} terbuka",
    body: "Keping terdorong naik sedikit. Klik keping untuk mengambilnya, atau tahan klik untuk menekannya lagi.",
  },
  "latch.closed": { tone: "info", title: "Klip slot {slot} ditutup", body: "Buka lagi klip ini sebelum memasang keping." },

  // SSD
  "ssd.picked": {
    tone: "info",
    title: "{name} dipegang",
    body: "Ukuran {size} ({width} mm × {length} mm), {key}-key. Arahkan ke slot M.2 di antara socket CPU dan slot PCIe.",
  },
  "ssd.aimAtSlot": { tone: "info", title: "Arahkan ke slot M.2", body: "Slot M.2 ada di bawah socket CPU, di antara socket dan slot PCIe pertama." },
  "ssd.angled": {
    tone: "info",
    title: "SSD masuk miring",
    body: "Konektor M.2 menerima SSD dengan sudut kira-kira {angle}°. Sekarang tahan klik pada SSD untuk menekannya rata.",
  },
  "ssd.flat": {
    tone: "success",
    title: "SSD rata",
    body: "Ujung SSD menempel di standoff. Kalau dilepas, ujungnya akan terangkat lagi, jadi kunci dengan baut M.2.",
  },
  "ssd.needsScrew": { tone: "info", title: "SSD belum dibaut", body: "Pilih mata yang pas, ambil baut M.2 di mangkuk, lalu tahan klik pada standoff." },
  "ssd.secured": {
    tone: "success",
    title: "Baut M.2 terpasang",
    body: "SSD terkunci di standoff. Kencangkan secukupnya; terlalu kencang bisa membuat PCB SSD melengkung.",
  },
  "m2screw.tooSmall": {
    tone: "info",
    title: "Baut ini sangat kecil",
    body: "Ambil dengan obeng: pilih mata yang pas, lalu klik bautnya. Ujung obeng bermagnet akan menahannya.",
  },
  "m2screw.onBit": {
    tone: "info",
    title: "Baut menempel di obeng",
    body: "{screw}, ulir {thread}. Sekarang tahan klik pada standoff di ujung SSD.",
  },
  "m2screw.dropped": { tone: "info", title: "Baut kembali ke mangkuk", body: "Mata obeng diganti, jadi baut M.2 yang menempel dilepas dulu." },
  "standoff.needsSsd": { tone: "info", title: "Standoff ini menahan ujung SSD", body: "Masukkan SSD ke slot M.2 dan tekan rata dulu." },
  "standoff.needsScrew": { tone: "info", title: "Ambil baut M.2 dulu", body: "Pilih mata yang pas, lalu klik baut kecil di mangkuk." },
  "standoff.done": { tone: "info", title: "Baut sudah terpasang", body: "SSD sudah terkunci." },

  // Session
  "session.complete": {
    tone: "success",
    title: "Bagian ini selesai",
    body: "Kamu melepas panel, memasang RAM, dan memasang SSD M.2 dengan bautnya. Kesalahan: {mistakes}.",
  },
} as const satisfies Record<string, MessageTemplate>;

export type MessageKey = keyof typeof MESSAGES;

export function formatMessage(key: MessageKey, params: Record<string, string | number> = {}): MessageTemplate {
  const fill = (text: string) => text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ""));
  const tpl = MESSAGES[key];
  return { tone: tpl.tone, title: fill(tpl.title), body: fill(tpl.body) };
}
