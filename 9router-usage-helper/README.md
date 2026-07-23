# 9Router Usage Helper

A localhost-only, read-only API for returning a 9Router key's own usage.

## Setup

1. Copy `.env.example` to `.env` and update `ALLOWED_ORIGINS` with the exact GitHub Pages origin.
2. Set the environment variables before launch. PowerShell example:

```powershell
$env:ALLOWED_ORIGINS = 'https://USERNAME.github.io'
node src/server.js
```

3. Test locally without putting a real key in shell history:

```powershell
$headers = @{ Authorization = "Bearer $env:NINE_ROUTER_TEST_KEY" }
Invoke-RestMethod http://127.0.0.1:20129/api/key/usage -Headers $headers
```

The service binds only to `127.0.0.1`. Add a distinct Cloudflare Tunnel hostname only after local verification succeeds.
