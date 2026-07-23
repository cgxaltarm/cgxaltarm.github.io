# Plan: 9Router Usage Dashboard & Secure Proxy Helper

## Context
The goal is to build a modern, responsive, mobile-friendly web dashboard hosted on **GitHub Pages** (static site) for users to check their individual **9Router** API key status and usage metrics.

### Key Audit Findings & Architectural Decision:
1. **9Router Service & Local Database**: 9Router runs locally on port 20128 (`http://127.0.0.1:20128`). Its SQLite database is located at `C:\Users\win11srvii\AppData\Roaming\9router\db\data.sqlite`.
2. **Missing Self-Service Key API**: 9Router does **NOT** provide a public, key-authenticated self-service usage endpoint for end-user API keys. Its built-in endpoint (`/api/usage/stats`) is global/admin-only and lacks key-level scoping or individual key authentication.
3. **Public Exposure & Security**: Cloudflare currently routes public traffic to 9Router via `api.dailyflo.me`. Passing admin secrets to GitHub Pages or exposing raw SQLite/admin endpoints is strictly forbidden.
4. **Chosen Architecture (Option B)**:
   - **Frontend Dashboard**: A clean Vite + HTML/JS/CSS client built in `9router-usage-dashboard/` deployed to GitHub Pages.
   - **Backend Proxy (`9router-usage-helper`)**: A minimal, isolated Node.js/Express service running locally on `127.0.0.1:20129`. It reads `data.sqlite` in **read-only mode**, validates the user's `Authorization: Bearer <key>`, and returns *only* that specific key's metrics (status, requests, tokens, cost, daily history).
   - **Cloudflare Ingress**: Add a dedicated subdomain `usage.api.dailyflo.me` in `cloudflared` mapping to `127.0.0.1:20129`.

---

## Key Principles & Security Rules
- **Zero Master Credentials in Frontend**: No admin token, database password, or secret key will be embedded in frontend code or repository.
- **Strict Key Scoping**: The user's input API Key is passed via `Authorization: Bearer` and validated against `apiKeys`. SQL queries strictly filter by `apiKey = <authenticated_user_key>`.
- **Read-Only Database Access**: The local helper opens SQLite with read-only flags.
- **In-Memory Key Handling**: The frontend retains the API key only in client memory for the active tab session. Never save to `localStorage`, `sessionStorage`, cookies, query parameters, or external telemetry.
- **CORS Allowed Origins**: Strict CORS configuration permitting `https://*.github.io`. No wildcard `*` headers on authenticated routes.

---

## Component Details & Implementation Steps

### 1. Local Backend Proxy Helper (`9router-usage-helper`)
Directory: `C:\Dev\WebUsage\9router-usage-helper`

- **Dependencies**: `express`, `better-sqlite3`, `cors`, `dotenv`.
- **Endpoints**:
  - `GET /health`: Health check endpoint.
  - `GET /api/key/usage`: Accepts `Authorization: Bearer <sk-...>`.
    - Validates key existence and `isActive` state in `apiKeys`.
    - Queries `usageHistory` filtering strictly by `apiKey = ?`.
    - Aggregates status, requests count, tokens, cost, and daily history.

### 2. Frontend Dashboard (`9router-usage-dashboard`)
Directory: `C:\Dev\WebUsage\9router-usage-dashboard`

- **Tech Stack**: Vite + HTML/CSS/JS (vanilla UI).
- **Features & UI**:
  - Dark-themed responsive UI matching user style preferences.
  - Metrics display: Total requests, used cost ($), tokens metrics, status indicator.
  - Wipe-memory clear button.
- **Deployment**:
  - GitHub Actions config under `.github/workflows/deploy.yml` for automated GitHub Pages deployment.

---

## Verification Plan
1. Test local helper connectivity using a valid 9Router API key.
2. Confirm CORS preflight returns correct parameters.
3. Test layout and end-to-end usage retrieval under simulated network states.
