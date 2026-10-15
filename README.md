# Rakit PC 3D

Simulator merakit PC di browser, dari belanja sampai menyala:

1. **Pilih komponen** dengan anggaran fiktif: CPU, motherboard, RAM, cooler, VGA, SSD/HDD/SSHD/M.2,
   casing, kipas, PSU. Setiap pilihan dicek kecocokannya (socket, tipe RAM, ukuran board, panjang VGA,
   tinggi cooler, daya dan konektor PSU).
2. **Rakit di atas kotak board**: gelang antistatis, tuas socket, segitiga CPU, pasta termal, plastik
   cooler, baut cooler, klip dan takik RAM, SSD M.2.
3. **Rakit di casing**: panel samping, standoff, kipas dan arah alirannya, PSU, board, drive, penutup
   slot, VGA, dan semua kabel (24-pin, EPS, PCIe/12V-2x6, SATA, kipas, USB, audio, pin front panel).
4. **Nyalakan**: saklar PSU, tombol power, lampu debug, layar firmware, dan ringkasan.

Setiap kesalahan dijelaskan alasannya. Mode **Terpandu** menolak kesalahan; mode **Bebas** membiarkan
sebagian lewat dan akibatnya terlihat saat dinyalakan.

## Menjalankan

```bash
npm install
npm run dev      # buka http://localhost:5173
```

Pemeriksaan dan produksi:

```bash
npm run check    # typecheck + uji engine + build
npm start        # http://localhost:3000
```

Butuh Node 20 atau lebih baru.

## Kontrol di meja rakit

| Aksi | Cara |
| --- | --- |
| Ambil komponen atau ujung kabel, buka/tutup klip, tuas, saklar | Klik / ketuk |
| Pasang yang sedang dipegang | Arahkan sampai lingkaran hijau, lalu klik |
| Memutar baut, menekan RAM/SSD M.2 | Tahan klik / tahan sentuh |
| Memutar kamera | Seret area kosong · zoom dengan gulir atau cubit |
| Putar 180° (CPU, RAM, kipas, konektor) | Tombol **Putar** atau `R` |
| Taruh kembali | Tombol **Taruh** atau `Esc` |
| Pilih alat | Bilah bawah, atau `0` tangan, `1`–`3` PH0–PH2, `4` pasta |
| Manual board | Tombol **Manual** atau `M` |

## Dokumen untuk pengembang

- `CLAUDE.md` — arsitektur, aturan impor, cara kerja engine dan scene, cara menambah data/aturan/komponen.
- `DESIGN.md` — design token, tipografi, motion, layout HUD, aturan copy dan visual 3D.

## Data yang belum dikonfirmasi

Posisi fitur di board, grid lubang ATX, pitch slot, posisi takik DDR4/DDR5, posisi key M.2, mata obeng
per baut, ambang cadangan daya PSU, serta harga dan watt fiktif masih bertanda `[BELUM DIKONFIRMASI]`
di `app/shared/hardware/data/` dan `app/features/assembly/constants/layouts.ts`.
