import type { FeedbackTone } from "../types/assemblyTypes";

/**
 * Educational copy, keyed by rule outcome. Every refusal says what is wrong,
 * why it matters, and what to do next, in plain Indonesian. Placeholders: {name}.
 */
interface MessageTemplate {
  tone: FeedbackTone;
  title: string;
  body: string;
}

export const MESSAGES = {
  /* ---------- Tools and hands ---------- */
  "screw.needsTool": { tone: "info", title: "Butuh obeng", body: "{screw} tidak bisa diputar dengan tangan. Pilih mata obeng di bilah bawah." },
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
  "screw.holdToTurn": { tone: "info", title: "Tahan untuk memutar", body: "Tahan klik pada komponen sampai semua bautnya terpasang." },
  "screw.done": { tone: "success", title: "{part} terkunci", body: "{count} baut {screw} terpasang." },
  "screw.notYet": { tone: "info", title: "Belum bisa dibaut", body: "{reason}" },
  "hands.full": { tone: "info", title: "Tangan sedang memegang sesuatu", body: "Pasang atau taruh dulu yang sedang dipegang (tombol Taruh atau Esc)." },
  "hands.toolInUse": { tone: "info", title: "Tangan memegang alat", body: "Pilih alat Tangan di bilah bawah untuk mengambil komponen atau kabel." },
  "hands.aim": { tone: "info", title: "Arahkan ke tempatnya", body: "Gerakkan ke titik pasang sampai menyala, lalu klik. Hijau berarti pas, merah berarti ada yang salah." },
  "hands.dropped": { tone: "info", title: "Ditaruh kembali", body: "{name} dikembalikan ke meja." },

  /* ---------- Prep ---------- */
  "strap.on": {
    tone: "success",
    title: "Gelang antistatis terpasang",
    body: "Listrik statis dari tubuh sekarang mengalir ke ground, bukan ke komponen. Sentuhan statis yang tidak terasa pun bisa merusak chip.",
  },
  "strap.off": { tone: "info", title: "Gelang dilepas", body: "Pasang lagi sebelum menyentuh komponen." },
  "strap.needed": {
    tone: "danger",
    title: "Pasang gelang antistatis dulu",
    body: "Komponen elektronik bisa rusak oleh listrik statis yang tidak terasa. Klik gelang di sudut alas untuk memakainya.",
  },

  /* ---------- CPU ---------- */
  "lever.opened": { tone: "info", title: "Tuas socket terbuka", body: "Pelat penahan terangkat. Sekarang CPU bisa diletakkan, jangan ditekan atau digeser." },
  "lever.closed": { tone: "success", title: "Tuas terkunci", body: "Pelat menekan CPU rata ke kontak socket. Tuas memang terasa berat saat dikunci." },
  "lever.closedEmpty": { tone: "info", title: "Tuas ditutup tanpa CPU", body: "Buka lagi tuasnya sebelum memasang CPU." },
  "lever.cpuInside": { tone: "info", title: "Tuas dibuka", body: "CPU bisa diangkat sekarang. Pegang dari sisinya." },
  "cpu.leverClosed": { tone: "danger", title: "Tuas socket masih tertutup", body: "Buka tuas dan pelat penahan dulu. CPU yang diletakkan di atas pelat tertutup bisa membengkokkan kontak socket." },
  "cpu.triangle": {
    tone: "danger",
    title: "Segitiga tidak sejajar",
    body: "Penanda segitiga emas di pojok CPU harus searah dengan penanda di socket. Putar CPU (tombol Putar atau R), lalu coba lagi.",
  },
  "cpu.placed": { tone: "info", title: "CPU duduk di socket", body: "CPU masuk tanpa ditekan, karena takik di sisinya cocok dengan socket. Sekarang turunkan dan kunci tuasnya." },
  "cpu.picked": { tone: "info", title: "{name} dipegang", body: "Socket {socket}. Pegang dari sisi, jangan sentuh kontak di bawahnya." },

  /* ---------- Paste and cooler ---------- */
  "paste.needsCpu": { tone: "info", title: "Pasta dioles di atas CPU", body: "Pasang CPU dan kunci tuasnya dulu." },
  "paste.sedikit": {
    tone: "danger",
    title: "Pasta terlalu sedikit",
    body: "Ada celah udara antara CPU dan cooler, jadi panas tidak tersalur dan CPU cepat panas. Bersihkan, lalu oles sebesar butir kacang polong.",
  },
  "paste.pas": { tone: "success", title: "Pasta pas", body: "Sebesar butir kacang polong di tengah. Tekanan cooler akan meratakannya sendiri." },
  "paste.banyak": {
    tone: "danger",
    title: "Pasta kebanyakan",
    body: "Kelebihannya akan meluber ke tepi saat cooler ditekan. Hasilnya berantakan dan tidak membuat lebih dingin. Bersihkan, lalu oles secukupnya.",
  },
  "paste.prePasted": {
    tone: "danger",
    title: "Cooler ini sudah membawa pasta",
    body: "Pasta tambahan di atas pasta bawaan malah menumpuk. Bersihkan pasta dari CPU, lalu pasang cooler apa adanya.",
  },
  "paste.wiped": { tone: "info", title: "Pasta dibersihkan", body: "Permukaan CPU bersih lagi." },
  "plastic.peeled": { tone: "success", title: "Plastik pelindung dikupas", body: "Plastik ini melindungi dasar cooler selama pengiriman dan harus dilepas, kalau tidak panas tertahan." },
  "cooler.needsCpu": { tone: "danger", title: "CPU belum siap", body: "Pasang CPU dan kunci tuas socket dulu sebelum memasang cooler." },
  "cooler.needsPaste": { tone: "danger", title: "Belum ada pasta termal", body: "Tanpa pasta, panas dari CPU tidak tersalur ke cooler. Pilih alat Pasta lalu klik CPU." },
  "cooler.badPaste": { tone: "danger", title: "Jumlah pasta belum pas", body: "Bersihkan dan oles ulang sebelum memasang cooler." },
  "cooler.plastic": {
    tone: "danger",
    title: "Plastik pelindung masih menempel",
    body: "Plastik di dasar cooler menghalangi panas dan bisa meleleh. Klik cooler di meja untuk mengupasnya dulu.",
  },
  "cooler.placed": { tone: "info", title: "Cooler di atas CPU", body: "Sekarang kencangkan bautnya bersilang, sedikit demi sedikit, supaya tekanannya rata." },

  /* ---------- RAM ---------- */
  "ram.picked": { tone: "info", title: "{name} dipegang", body: "{type}. Arahkan ke slot RAM. Slot hijau siap, slot merah belum." },
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
  "ram.typeMismatch": { tone: "danger", title: "Tipe RAM tidak cocok", body: "Slot ini {slotType}, keping ini {ramType}. Posisi takiknya berbeda." },
  "ram.notRecommended": {
    tone: "danger",
    title: "Bukan slot anjuran",
    body: "Untuk {count} keping, manual board ini menganjurkan slot {slots} supaya berjalan dual-channel. Pindahkan ke slot itu.",
  },
  "ram.notRecommendedFree": { tone: "info", title: "Catatan slot", body: "Manual board menganjurkan slot {slots} untuk {count} keping. Di slot ini RAM tetap jalan, tapi mungkin tidak dual-channel." },
  "ram.inserted": { tone: "info", title: "Keping masuk ke alur slot", body: "Sekarang tekan lurus ke bawah: tahan klik pada keping sampai klipnya menutup." },
  "ram.seated": { tone: "success", title: "Terkunci", body: "Klip menutup sendiri karena keping sudah masuk penuh." },
  "ram.pressNotLatch": { tone: "info", title: "Tekan kepingnya, bukan klipnya", body: "Klip menutup sendiri saat keping masuk penuh. Tahan klik pada keping RAM." },
  "latch.opened": { tone: "info", title: "Klip slot {slot} terbuka", body: "Slot ini siap menerima keping." },
  "latch.openedEject": { tone: "info", title: "Klip slot {slot} terbuka", body: "Keping terdorong naik sedikit. Klik keping untuk mengambilnya, atau tahan klik untuk menekannya lagi." },
  "latch.closed": { tone: "info", title: "Klip slot {slot} ditutup", body: "Buka lagi klip ini sebelum memasang keping." },
  "ram.alreadySeated": { tone: "info", title: "Keping sudah terkunci", body: "Untuk melepasnya, buka klip di ujung slot dulu." },

  /* ---------- M.2 ---------- */
  "m2.picked": { tone: "info", title: "{name} dipegang", body: "{size}, key {key}, jalur {iface}. Arahkan ke slot M.2." },
  "m2.slotNoSata": {
    tone: "danger",
    title: "Slot ini tidak mendukung SATA",
    body: "SSD ini memakai jalur SATA. Key-nya pas di slot {slot}, tetapi slot ini hanya PCIe, jadi drive tidak akan terbaca.",
  },
  "m2.length": { tone: "danger", title: "Panjang M.2 tidak didukung", body: "Slot {slot} tidak punya standoff untuk {length}." },
  "m2.angled": { tone: "info", title: "SSD masuk miring", body: "Konektor M.2 menerima SSD dengan sudut kira-kira 30°. Tahan klik pada SSD untuk menekannya rata." },
  "m2.flat": { tone: "success", title: "SSD rata", body: "Ujungnya menempel di standoff. Kunci dengan baut M.2 supaya tidak terangkat lagi." },
  "m2.needsFlat": { tone: "info", title: "SSD belum rata", body: "Tahan klik pada SSD untuk menekannya rata dulu." },

  /* ---------- Case prep ---------- */
  "panel.stillScrewed": { tone: "danger", title: "Panel masih tertahan baut", body: "Lepas semua baut panel dulu supaya kacanya tidak tertekuk dan retak." },
  "panel.removed": { tone: "success", title: "Panel terangkat", body: "Bagian dalam casing terbuka." },
  "panel.unscrewed": { tone: "success", title: "Baut panel lepas", body: "Sekarang panel bisa diangkat dengan tangan." },
  "panel.placed": { tone: "info", title: "Panel terpasang", body: "Kencangkan lagi baut panel." },
  "panel.mustBeOff": { tone: "danger", title: "Panel samping masih terpasang", body: "Lepas panel samping dulu untuk bisa bekerja di dalam casing." },
  "standoff.added": { tone: "info", title: "Standoff dipasang", body: "Lubang ini cocok dengan lubang di board {ff}." },
  "standoff.addedWrong": {
    tone: "danger",
    title: "Board {ff} tidak punya lubang di sini",
    body: "Standoff tanpa lubang di atasnya akan menyentuh jalur di bawah board dan bisa membuat korsleting.",
  },
  "standoff.removed": { tone: "info", title: "Standoff dilepas", body: "Posisi ini tidak dipakai board {ff}." },
  "standoff.removedNeeded": { tone: "danger", title: "Standoff ini dibutuhkan", body: "Board {ff} punya lubang di posisi ini. Tanpa standoff, board melengkung saat dibaut." },
  "fan.size": { tone: "danger", title: "Ukuran kipas tidak pas", body: "Dudukan ini untuk kipas {sizes} mm, kipas ini {size} mm. Jarak lubang bautnya berbeda." },
  "fan.airflow": {
    tone: "danger",
    title: "Arah aliran udara terbalik",
    body: "Kipas di {side} sebaiknya {expected}. Lihat panah di rangka kipas, lalu putar kipasnya (tombol Putar atau R).",
  },
  "fan.placed": { tone: "info", title: "Kipas di dudukannya", body: "Kencangkan 4 bautnya." },

  /* ---------- Major parts ---------- */
  "psu.placed": { tone: "info", title: "PSU di ruangnya", body: "Kencangkan baut PSU dari panel belakang." },
  "board.missingStandoffs": { tone: "danger", title: "Standoff belum lengkap", body: "Masih ada {n} lubang board yang belum punya standoff. Board akan melengkung saat dibaut." },
  "board.extraStandoff": {
    tone: "danger",
    title: "Ada standoff di tempat tanpa lubang board",
    body: "{n} standoff tidak punya pasangan lubang di board {ff}. Standoff itu akan menyentuh bagian bawah board dan bisa membuat korsleting. Lepas dulu.",
  },
  "board.placed": { tone: "success", title: "Board di atas standoff", body: "Lubang board sejajar dengan standoff dan port belakang masuk ke bukaan I/O. Sekarang pasang bautnya." },
  "board.picked": { tone: "info", title: "Board diangkat", body: "Pegang dari tepi. Miringkan ke arah panel belakang dan turunkan ke atas standoff." },
  "board.ioShield": { tone: "info", title: "Catatan I/O shield", body: "Board ini tidak punya I/O shield terpasang. Di casing nyata, shield dipasang dulu di panel belakang sebelum board." },
  "board.locked": { tone: "info", title: "Board sudah di casing", body: "Komponen di board sekarang dikerjakan di dalam casing." },
  "drive.wrongBay": { tone: "danger", title: "Bay tidak cocok", body: "Drive ini {kind}\", bay ini untuk {bay}\"." },
  "drive.placed": { tone: "info", title: "Drive di bay", body: "Kencangkan bautnya ({screw})." },
  "gpu.boardFirst": { tone: "danger", title: "Board belum di casing", body: "VGA dipasang setelah board terpasang di casing, karena bracket-nya dibaut ke panel belakang casing." },
  "gpu.covers": { tone: "danger", title: "Penutup slot belum dilepas", body: "VGA ini memakan {n} slot. Lepas {n} penutup slot di panel belakang yang sejajar dengan slot PCIe pertama." },
  "gpu.x1": { tone: "danger", title: "Slot terlalu pendek", body: "VGA butuh slot PCIe x16. Slot {slot} adalah x1." },
  "gpu.notPrimary": { tone: "danger", title: "Bukan slot utama", body: "Slot {slot} hanya {lanes} jalur. Pasang VGA di slot x16 paling atas supaya mendapat jalur penuh." },
  "gpu.placed": { tone: "info", title: "VGA masuk ke slot", body: "Klip PCIe mengunci. Kencangkan baut bracket ke panel belakang." },
  "cover.removed": { tone: "info", title: "Penutup slot {n} dilepas", body: "Bukaan ini untuk port VGA." },
  "cover.restored": { tone: "info", title: "Penutup slot {n} dipasang lagi", body: "" },

  /* ---------- Cables ---------- */
  "cable.picked": { tone: "info", title: "{name} dipegang", body: "Arahkan ke port yang cocok. Hijau berarti pas." },
  "cable.notYet": { tone: "info", title: "Kabel belum bisa diambil", body: "{reason}" },
  "cable.portBusy": { tone: "danger", title: "Port sudah terisi", body: "Pilih port lain yang masih kosong." },
  "cable.portUnavailable": { tone: "danger", title: "Port belum bisa dijangkau", body: "{reason}" },
  "cable.wrongKind": { tone: "danger", title: "Konektor tidak cocok", body: "Kabel ini {plug}, port ini {port}. Jumlah dan bentuk pinnya berbeda." },
  "cable.pcieIntoEps": {
    tone: "danger",
    title: "Ini kabel PCIe, bukan EPS",
    body: "Bentuknya mirip, tapi keying dan urutan kabelnya berbeda. Memaksa kabel PCIe ke header EPS CPU bisa merusak board atau PSU.",
  },
  "cable.epsIntoPcie": {
    tone: "danger",
    title: "Ini kabel EPS, bukan PCIe",
    body: "Bentuknya mirip, tapi keying dan urutan kabelnya berbeda. Pakai kabel berlabel PCIe untuk VGA.",
  },
  "cable.flipped": { tone: "danger", title: "Orientasi terbalik", body: "Kait di konektor {connector} harus searah dengan tonjolan di port. Putar konektornya (tombol Putar atau R)." },
  "cable.sataDisabled": { tone: "danger", title: "Port {port} sedang mati", body: "Port ini berbagi jalur dengan {slot} yang terisi SSD. Drive di port ini tidak akan terbaca. Pakai port SATA lain." },
  "cable.cpuFanHeader": { tone: "danger", title: "Kipas CPU masuk ke CPU_FAN", body: "Board mengawasi header CPU_FAN. Kalau kipas cooler tidak di sana, board menganggap CPU tanpa pendingin." },
  "cable.caseFanHeader": { tone: "danger", title: "Header CPU_FAN untuk kipas cooler", body: "Colok kipas casing ke header SYS_FAN." },
  "cable.plugged": { tone: "success", title: "{name} tercolok", body: "Masuk sampai kaitnya mengunci." },
  "cable.unplugged": { tone: "info", title: "{name} dicabut", body: "Tekan kaitnya dulu saat mencabut kabel asli." },
  "cable.routed": { tone: "info", title: "Kabel lewat grommet", body: "Kabel yang lewat belakang tray membuat aliran udara lebih lancar dan rakitan lebih rapi." },
  "cable.aim": { tone: "info", title: "Arahkan ke port", body: "Gerakkan konektor ke port yang cocok sampai menyala." },
  "fp.placed": { tone: "success", title: "{plug} tercolok", body: "Di pin {pins}." },
  "fp.wrong": { tone: "danger", title: "{plug} tidak di pin yang benar", body: "{effect} Lihat manual board untuk letak pin {plug}." },
  "fp.wrongPolarity": { tone: "danger", title: "Polaritas LED terbalik", body: "{plug} harus di pin {pins}. LED hanya menyala satu arah, jadi kalau terbalik ia tidak menyala, tetapi tidak rusak." },
  "fp.busy": { tone: "danger", title: "Pin sudah terpakai", body: "Pilih pin lain." },
  "fp.missingPin": { tone: "danger", title: "Pin ini kosong", body: "Posisi pin {pin} sengaja tidak ada pinnya, sebagai kunci arah header." },
  "fp.removed": { tone: "info", title: "{plug} dicabut", body: "" },
  "fp.boardFirst": { tone: "info", title: "Board belum di casing", body: "Kabel front panel datang dari casing. Pasang board di casing dulu, lalu colok kabelnya ke header F_PANEL." },
  "paste.pickTool": { tone: "info", title: "Pilih alat Pasta", body: "Pasta termal dioles dengan alat Pasta di bilah bawah, lalu klik CPU." },
  "tool.paste": { tone: "info", title: "Pasta termal di tangan", body: "Klik CPU yang sudah terkunci di socket untuk memilih jumlah pasta." },
  "power.panelOpen": { tone: "info", title: "Tombol power", body: "Ditekan sekali. Board membaca saklar ini lewat kabel POWER SW di header front panel." },

  /* ---------- Power ---------- */
  "psuSwitch.on": { tone: "info", title: "Saklar PSU menyala (I)", body: "PSU sekarang menyuplai daya standby ke board. Tekan tombol power di casing." },
  "psuSwitch.off": { tone: "info", title: "Saklar PSU mati (O)", body: "" },
  "post.psuOff": { tone: "danger", title: "Tidak ada yang terjadi", body: "Saklar di belakang PSU masih di posisi O (mati)." },
  "post.no24pin": { tone: "danger", title: "PSU tidak menyala", body: "Kabel 24-pin ATX belum tercolok, jadi board tidak bisa menyuruh PSU menyala." },
  "post.noPowerSwitch": {
    tone: "danger",
    title: "Tombol power tidak terhubung",
    body: "Kabel Power SW dari casing belum di pin Power SW header front panel. Tombol di casing hanya saklar; board yang menyalakan PSU.",
  },
  "post.noEps": { tone: "danger", title: "Kipas berputar, tapi tidak ada gambar", body: "Kabel EPS 8-pin untuk CPU belum tercolok. Lampu debug CPU menyala." },
  "post.noCpu": { tone: "danger", title: "Lampu debug CPU menyala", body: "CPU belum terpasang atau tuas socket belum dikunci." },
  "post.noCooler": { tone: "danger", title: "PC mati sendiri setelah beberapa detik", body: "CPU tanpa cooler yang terpasang kencang langsung kepanasan, dan sistem mematikan diri untuk melindungi CPU." },
  "post.noPaste": { tone: "danger", title: "CPU kepanasan", body: "Tanpa pasta termal, panas tidak tersalur ke cooler. Sistem mati untuk melindungi CPU." },
  "post.plastic": { tone: "danger", title: "CPU kepanasan", body: "Plastik pelindung di dasar cooler masih terpasang dan menghalangi panas." },
  "post.lowPaste": { tone: "info", title: "Suhu CPU tinggi", body: "Pastanya terlalu sedikit. PC jalan, tapi CPU lebih panas dari seharusnya." },
  "post.muchPaste": { tone: "info", title: "Pasta meluber", body: "PC jalan, tapi pasta berlebih meluber ke tepi socket." },
  "post.cpuFanError": { tone: "info", title: "Peringatan CPU fan error", body: "Kipas cooler tidak di header CPU_FAN, jadi firmware berhenti dan meminta konfirmasi." },
  "post.noRam": { tone: "danger", title: "Lampu debug DRAM menyala", body: "Tidak ada keping RAM yang terpasang penuh. Board tidak bisa memulai tanpa memori." },
  "post.ramPartial": { tone: "info", title: "Sebagian RAM tidak terbaca", body: "{n} keping belum ditekan sampai klip menutup." },
  "post.gpuNoPower": { tone: "danger", title: "Lampu debug VGA menyala", body: "Kabel daya VGA belum tercolok semua. Kartu tidak bisa menyala hanya dari daya slot." },
  "post.noDisplay": { tone: "danger", title: "Monitor gelap, lampu debug VGA menyala", body: "CPU ini tidak punya grafis terintegrasi dan tidak ada VGA." },
  "post.noBoot": { tone: "info", title: "Tidak ada perangkat boot", body: "Firmware terbuka, tapi tidak ada drive yang terbaca. Cek kabel data dan daya drive." },
  "post.driveMissing": { tone: "info", title: "{name} tidak terbaca", body: "{reason}" },
  "post.fanUnplugged": { tone: "info", title: "{n} kipas casing tidak berputar", body: "Kabelnya belum dicolok ke header SYS_FAN." },
  "post.ledPolarity": { tone: "info", title: "LED {led} tidak menyala", body: "Polaritas kabel LED terbalik atau belum dicolok." },
  "post.noReset": { tone: "info", title: "Tombol reset tidak berfungsi", body: "Kabel Reset SW belum di pin yang benar." },
  "post.frontIo": { tone: "info", title: "Port depan tidak berfungsi", body: "{ports} belum dicolok ke board." },
  "post.usbcOrphan": { tone: "info", title: "USB-C depan tidak berfungsi", body: "Board tidak punya header USB-C, jadi kabelnya tidak bisa dicolok." },
  "post.panelOpen": { tone: "info", title: "Panel samping terbuka", body: "PC jalan, tapi aliran udara casing tidak seperti rancangannya." },
  "post.ok": { tone: "success", title: "PC menyala", body: "Layar firmware muncul. Semua komponen utama terbaca. Kesalahan selama merakit: {mistakes}." },
  "post.fail": { tone: "danger", title: "PC belum berhasil menyala", body: "Periksa temuan di panel hasil, perbaiki, lalu coba lagi." },
} as const satisfies Record<string, MessageTemplate>;

export type MessageKey = keyof typeof MESSAGES;

export function formatMessage(key: MessageKey, params: Record<string, string | number> = {}): MessageTemplate {
  const fill = (text: string) => text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ""));
  const tpl = MESSAGES[key];
  return { tone: tpl.tone, title: fill(tpl.title), body: fill(tpl.body) };
}
