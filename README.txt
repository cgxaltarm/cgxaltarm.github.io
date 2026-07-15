DAILYFLOW PROFESSIONAL DASHBOARD
================================

STRUKTUR
-------
index.html
css/
  dashboard.css
  topology.css
  animation.css
js/
  api.js
  topology.js
  charts.js
  ui.js
  app.js

FITUR
-----
- Header status 9Router
- KPI requests, token, latency, provider aktif
- DailyFlow sebagai node pusat
- Provider dinamis berdasarkan /public-usage
- Model dikelompokkan berdasarkan provider
- Layout radial otomatis
- Drag, zoom in/out, scroll zoom, reset
- Garis routing bergerak
- Detail provider dan daftar model
- Aktivitas terbaru
- Grafik request dan token
- Responsif
- Dark/light mode
- Demo otomatis jika endpoint belum aktif
- Penyaringan field sensitif

INSTALASI GITHUB PAGES
----------------------
1. Ekstrak ZIP.
2. Upload seluruh isi folder ke root repository cgxaltarm.github.io.
3. Pastikan struktur folder css/ dan js/ tetap sama.
4. Commit ke branch main.
5. Tunggu Pages deployment selesai.
6. Buka:
   https://dailyflo.me/?v=professional1

ENDPOINT
--------
Frontend membaca:
https://router.dailyflo.me/public-usage

Agar live, endpoint harus mengembalikan format yang kompatibel dengan server.js proxy yang sudah dibuat sebelumnya.

KEAMANAN
--------
Frontend menyaring field:
- apiKey
- accessToken
- refreshToken
- authorization
- secret
- password
- credential
- cookie
- prompt
- message
- content

Jangan meneruskan respons admin 9Router mentah ke browser.
