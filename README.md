# Claude Clone — Custom AI Chat untuk GitHub Pages

Web chat mirip Claude.ai yang 100% frontend, menggunakan **Base URL** dan **API Key** milikmu sendiri.

Siap di-deploy ke **GitHub Pages** secara gratis.

## Fitur

- UI mirip Claude (bersih, minimalis, light/dark mode)
- Support API OpenAI-compatible (`/v1/chat/completions`)
  - OpenAI, Groq, OpenRouter, Together, Fireworks, DeepSeek, dll.
  - Bisa pakai model Claude via OpenRouter / proxy
- **Preset gaya jawaban**: Claude / ChatGPT / Gabungan (Default)
- Streaming respons real-time
- Markdown + syntax highlighting
- Multi-chat (riwayat disimpan di localStorage)
- System prompt kustom
- Responsive (mobile-friendly)
- Tidak ada backend — API key hanya disimpan di browser-mu

## Cara Deploy ke GitHub Pages

### 1. Buat repository baru di GitHub
- Nama bebas, contoh: `claude-clone` atau `my-ai-chat`
- Centang **Public**

### 2. Upload file-file ini
Upload ketiga file berikut ke root repository:
- `index.html`
- `style.css`
- `app.js`

Atau via Git:

```bash
git clone https://github.com/USERNAME/REPO.git
cd REPO
# copy file-file di atas ke sini
git add .
git commit -m "Initial commit - Claude Clone"
git push
```

### 3. Aktifkan GitHub Pages
1. Buka repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` (atau `master`) → folder `/ (root)`
4. Klik **Save**

Tunggu 1–2 menit, lalu buka:
`https://USERNAME.github.io/REPO/`

## Cara Pakai

1. Buka website yang sudah di-deploy
2. Klik **Pengaturan** (ikon gear di sidebar)
3. Isi:
   - **Base URL**: contoh
     - `https://api.openai.com/v1`
     - `https://api.groq.com/openai/v1`
     - `https://openrouter.ai/api/v1`
     - `https://api.deepseek.com/v1`
   - **API Key**: key milikmu
   - **Model**: contoh `gpt-4o`, `llama-3.1-70b-versatile`, `claude-3-5-sonnet-20241022` (via OpenRouter), dll.
4. Klik **Simpan Pengaturan**
5. Mulai chat!

## Catatan Keamanan

- API Key disimpan **hanya** di `localStorage` browser-mu.
- Tidak ada data yang dikirim ke server manapun selain Base URL yang kamu isi sendiri.
- Karena ini pure frontend di GitHub Pages, API Key terlihat di Network tab browser. Gunakan hanya untuk keperluan pribadi / key yang bisa di-rotate.

## Customisasi

Kamu bisa mengubah warna di `style.css` (cari variabel `--accent`).

## Lisensi

Bebas dipakai & dimodifikasi untuk keperluan pribadi maupun komersial.
