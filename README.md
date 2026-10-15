# Rakit PC 3D

Simulator merakit PC di browser. Pengguna melakukan sendiri tiap langkah fisik di meja rakit 3D:
memilih mata obeng yang pas, melepas baut panel, membuka klip RAM, mencocokkan takik, menekan
sampai terkunci, lalu memasang SSD M.2 dengan bautnya. Setiap kesalahan dijelaskan alasannya.

## Menjalankan

```bash
npm install
npm run dev      # buka http://localhost:5173
```

Produksi:

```bash
npm run build
npm start        # http://localhost:3000
```

Butuh Node 20 atau lebih baru.

## Kontrol

| Aksi | Cara |
| --- | --- |
| Ambil komponen, buka/tutup klip, angkat panel | Klik / ketuk |
| Memutar baut, menekan RAM/SSD | Tahan klik / tahan sentuh |
| Memutar kamera | Seret area kosong · zoom dengan gulir atau cubit |
| Putar keping RAM 180° | Tombol **Putar** atau `R` |
| Taruh kembali komponen | Tombol **Taruh** atau `Esc` |
| Pilih alat | Bilah bawah atau `0` (tangan), `1`–`3` (PH0–PH2) |

## Dokumen untuk pengembang

- `CLAUDE.md` — arsitektur, aturan impor, konvensi 3D, cara menambah komponen/aturan/langkah.
- `DESIGN.md` — design token, tipografi, motion, layout HUD, aturan copy.

## Data yang belum dikonfirmasi

Ukuran mata obeng per baut, posisi takik DDR5, posisi M.2 key dan sudut masuk, serta tata letak
board dan lubang sekrup ATX masih bertanda `[BELUM DIKONFIRMASI]` di `app/features/assembly/data/`.
