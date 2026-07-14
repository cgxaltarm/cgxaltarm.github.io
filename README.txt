DAILYFLOW DYNAMIC PROVIDERS

Isi:
- server.js
- index.html
- package.json

Tujuan:
- Nama provider mengikuti data asli yang terbaca dari 9Router
- Semua model dikelompokkan berdasarkan provider
- Topology lebih kecil
- Drag, zoom in/out, scroll zoom, dan reset tersedia
- DailyFlow menjadi node pusat
- Data sensitif tidak dikirim ke dashboard

Instalasi proxy:
1. Salin server.js dan package.json ke:
   C:\dailyflow-9router-usage-proxy
2. Jalankan:
   cd /d C:\dailyflow-9router-usage-proxy
   npm start
3. Pastikan:
   http://127.0.0.1:3031/health
   http://127.0.0.1:3031/public-usage

Cloudflare Tunnel:
router.dailyflo.me harus diarahkan ke:
http://127.0.0.1:3031

GitHub Pages:
Upload index.html ke repository cgxaltarm.github.io.
