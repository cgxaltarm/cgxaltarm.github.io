# Free API Finder

Website sederhana untuk **mencari free public API** (termasuk yang menyediakan free API key).

Data diambil otomatis dari [Public API Lists](https://public-api-lists.github.io/public-api-lists/) (787+ API gratis).

## Fitur

- 🔍 Pencarian real-time berdasarkan nama / deskripsi
- 📂 Filter berdasarkan kategori
- 🔑 Filter autentikasi: **No Auth**, **API Key**, OAuth, dll
- 🔒 Filter HTTPS & CORS
- 🎲 Tombol "Acak 10 API"
- Responsive & modern dark UI
- 100% static → cocok untuk **GitHub Pages**

## Cara Deploy ke GitHub Pages

1. Buat repository baru di GitHub (misal: `free-api-finder`)
2. Upload file `index.html` ke root repository
3. Pergi ke **Settings → Pages**
4. Source: **Deploy from a branch**
5. Branch: `main` (atau `master`) → folder `/ (root)`
6. Klik **Save**
7. Tunggu 1-2 menit, website akan live di:
   `https://username.github.io/free-api-finder/`

### Atau pakai GitHub CLI / drag & drop

Cukup drag file `index.html` ke repository baru, lalu aktifkan Pages seperti di atas.

## Catatan Penting

- Website ini **tidak** menyimpan atau memberikan API key rahasia.
- Semua API yang ditampilkan menawarkan free tier / free access.
- Kamu tetap harus daftar di situs resmi masing-masing API untuk mendapatkan key (jika diperlukan).
- Data diambil langsung dari sumber publik setiap kali halaman dibuka.

## Teknologi

- Pure HTML + CSS + JavaScript (no framework)
- Fetch API (client-side)
- Tidak ada backend → gratis selamanya di GitHub Pages

---

Dibuat untuk memudahkan developer mencari free API dengan cepat.
