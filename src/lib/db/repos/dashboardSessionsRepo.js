import crypto from "node:crypto";
import { getAdapter } from "../driver.js";

const SESSION_PEPPER = process.env.DAILYFLO_SESSION_PEPPER || "dailyflo_session_pepper_secret_key";

export function hashSessionToken(token) {
  return crypto.createHmac("sha256", SESSION_PEPPER).update(token).digest("hex");
}

export async function createDashboardSession(keyId, ttlDays = 7) {
  const db = await getAdapter();
  const rawToken = `dfs_${crypto.randomBytes(24).toString("hex")}`;
  const tokenHash = hashSessionToken(rawToken);
  const id = `sess_${crypto.randomBytes(16).toString("hex")}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  db.run(
    `INSERT INTO managed_key_dashboard_sessions (id, key_id, token_hash, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, keyId, tokenHash, expiresAt, now.toISOString(), now.toISOString()]
  );

  return { rawToken, expiresAt };
}

export async function verifyDashboardSession(rawToken) {
  if (!rawToken || typeof rawToken !== "string") return null;
  const tokenHash = hashSessionToken(rawToken);
  const db = await getAdapter();
  const session = db.get(`SELECT * FROM managed_key_dashboard_sessions WHERE token_hash = ?`, [tokenHash]);
  if (!session) return null;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.run(`DELETE FROM managed_key_dashboard_sessions WHERE id = ?`, [session.id]);
    return null;
  }

  db.run(`UPDATE managed_key_dashboard_sessions SET last_seen_at = ? WHERE id = ?`, [new Date().toISOString(), session.id]);
  return session;
}
