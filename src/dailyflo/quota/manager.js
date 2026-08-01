import crypto from "node:crypto";
import { getAdapter } from "../../lib/db/driver.js";

export async function reserveQuota({ keyId, requestId, estimatedTokens = 4096 }) {
  const db = await getAdapter();
  const now = new Date().toISOString();
  const reservationId = `res_${crypto.randomBytes(16).toString("hex")}`;

  return db.transaction(() => {
    const key = db.get(`SELECT total_token_limit, tokens_used, reserved_tokens, status FROM managed_api_keys WHERE id = ?`, [keyId]);
    if (!key || key.status !== "active") {
      return { success: false, reason: "key_inactive" };
    }

    if (key.total_token_limit !== null) {
      const available = key.total_token_limit - (key.tokens_used + key.reserved_tokens);
      if (available < estimatedTokens) {
        return { success: false, reason: "insufficient_quota", available, requested: estimatedTokens };
      }
    }

    db.run(
      `INSERT INTO managed_key_quota_reservations (id, key_id, request_id, reserved_tokens, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)`,
      [reservationId, keyId, requestId, estimatedTokens, now]
    );

    db.run(
      `UPDATE managed_api_keys SET reserved_tokens = reserved_tokens + ? WHERE id = ?`,
      [estimatedTokens, keyId]
    );

    return { success: true, reservationId, reservedTokens: estimatedTokens };
  });
}

export async function settleQuota({ keyId, requestId, actualInputTokens = 0, actualOutputTokens = 0, cachedTokens = 0, reasoningTokens = 0, model = "unknown", provider = "unknown" }) {
  const db = await getAdapter();
  const now = new Date().toISOString();
  const chargedTokens = actualInputTokens + actualOutputTokens;

  return db.transaction(() => {
    const reservation = db.get(`SELECT * FROM managed_key_quota_reservations WHERE request_id = ? AND status = 'active'`, [requestId]);
    const reservedTokens = reservation ? reservation.reserved_tokens : 0;

    if (reservation) {
      db.run(
        `UPDATE managed_key_quota_reservations SET status = 'settled', settled_at = ? WHERE id = ?`,
        [now, reservation.id]
      );
    }

    db.run(
      `UPDATE managed_api_keys SET reserved_tokens = MAX(0, reserved_tokens - ?), tokens_used = tokens_used + ? WHERE id = ?`,
      [reservedTokens, chargedTokens, keyId]
    );

    const eventId = `evt_${crypto.randomBytes(16).toString("hex")}`;
    db.run(
      `INSERT OR IGNORE INTO managed_key_usage_events (id, key_id, request_id, model, provider, input_tokens, output_tokens, cached_tokens, reasoning_tokens, charged_tokens, usage_source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'settlement', ?)`,
      [eventId, keyId, requestId, model, provider, actualInputTokens, actualOutputTokens, cachedTokens, reasoningTokens, chargedTokens, now]
    );

    return { success: true, chargedTokens };
  });
}
