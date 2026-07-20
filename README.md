# DailyFlo — AI Chat untuk GitHub Pages

Web chat AI pribadi yang 100% frontend, menggunakan **Base URL** dan **API Key** milikmu sendiri.

Siap di-deploy ke **GitHub Pages** secara gratis. Nama: **DailyFlo**.

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
- Nama bebas, contoh: `dailyflo` atau `my-ai-chat`
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
git commit -m "Initial commit - DailyFlo"
git push
```

### 3. Aktifkan GitHub Pages
1. Buka repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` (atau `master`) → folder `/ (root)`
4. Klik **Save**

Tunggu 1–2 menit, lalu buka:
`https://USERNAME.github.io/REPO/`

## Cara Pakai (khusus 9Router)

1. Buka website yang sudah di-deploy
2. Klik **Pengaturan**
3. Isi:
   - **Base URL**: URL publik 9Router kamu + `/v1`  
     Contoh: `https://abc123.trycloudflare.com/v1`  
     atau `https://rxxxxxx.abc-tunnel.us/v1`
   - **API Key**: API Key dari dashboard 9Router (menu Keys)
   - **Model**: nama model yang tersedia di 9Router (contoh: `cc/claude-sonnet-4.5`, `gpt-4o`, dll)
4. Klik **Simpan Pengaturan**
5. Mulai chat!

## ⚠️ Kenapa "Tidak dapat memanggil API"? (CORS Error)

Ini masalah paling umum. Hampir semua provider AI (OpenAI, Groq, OpenRouter, Anthropic, dll) **memblokir request langsung dari browser** (termasuk GitHub Pages) karena alasan keamanan (CORS policy).

### Solusi Terbaik & Gratis: Cloudflare Workers Proxy

Ikuti langkah ini (hanya 5 menit):

1. Daftar / login ke [Cloudflare](https://dash.cloudflare.com) (gratis)
2. Masuk ke **Workers & Pages** → **Create** → **Create Worker**
3. Hapus semua kode default, lalu **paste kode di bawah ini**:

```js
export default {
  async fetch(request) {
    // Izinkan CORS dari mana saja (karena ini proxy pribadi)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const url = new URL(request.url);
    // Ambil target API dari query parameter ?url=
    const target = url.searchParams.get("url");
    if (!target) {
      return new Response("Missing ?url= parameter", { status: 400 });
    }

    // Clone request dan ganti URL-nya
    const newRequest = new Request(target, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const response = await fetch(newRequest);

    // Tambahkan header CORS ke response
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
```

4. Klik **Deploy**
5. Setelah deploy, copy URL Worker-mu (contoh: `https://nama-worker.username.workers.dev`)

6. Di pengaturan DailyFlo, isi **Base URL** menjadi:

```
https://nama-worker.username.workers.dev/?url=https://api.groq.com/openai/v1
```

(Ganti `https://api.groq.com/openai/v1` sesuai provider yang kamu pakai)

Contoh lengkap:
- Groq → `https://xxx.workers.dev/?url=https://api.groq.com/openai/v1`
- OpenRouter → `https://xxx.workers.dev/?url=https://openrouter.ai/api/v1`
- OpenAI → `https://xxx.workers.dev/?url=https://api.openai.com/v1`

Sekarang API akan berhasil dipanggil!

## Catatan Keamanan

- API Key disimpan **hanya** di `localStorage` browser-mu.
- Tidak ada data yang dikirim ke server manapun selain Base URL yang kamu isi sendiri.
- Karena ini pure frontend di GitHub Pages, API Key terlihat di Network tab browser. Gunakan hanya untuk keperluan pribadi / key yang bisa di-rotate.

## Customisasi

Kamu bisa mengubah warna di `style.css` (cari variabel `--accent`).

## Lisensi

Bebas dipakai & dimodifikasi untuk keperluan pribadi maupun komersial.
