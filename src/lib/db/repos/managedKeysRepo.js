// DailyFlo Managed API Keys Repository
import { getAdapter } from "../driver.js";

export async function getManagedKeyByPublicId(publicId) {
  const db = await getAdapter();
  return db.get(`SELECT * FROM managed_api_keys WHERE public_id = ?`, [publicId]);
}

export async function getManagedKeyById(id) {
  const db = await getAdapter();
  return db.get(`SELECT * FROM managed_api_keys WHERE id = ?`, [id]);
}

export async function getAllManagedKeys() {
  const db = await getAdapter();
  return db.all(`SELECT * FROM managed_api_keys ORDER BY created_at DESC`);
}

export async function createManagedKey({ id, publicId, secretDigest, label, status = 'active', totalTokenLimit = null, maxOutputTokens = null, requestsPerMinute = null, tokensPerMinute = null, maxConcurrentRequests = null, expiresAt = null, allowedModels = [] }) {
  const db = await getAdapter();
  const now = new Date().toISOString();
  db.transaction(() => {
    db.run(
      `INSERT INTO managed_api_keys (id, public_id, secret_digest, label, status, total_token_limit, max_output_tokens, requests_per_minute, tokens_per_minute, max_concurrent_requests, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, publicId, secretDigest, label, status, totalTokenLimit, maxOutputTokens, requestsPerMinute, tokensPerMinute, maxConcurrentRequests, expiresAt, now, now]
    );
    for (const mId of allowedModels) {
      db.run(`INSERT INTO managed_api_key_models (key_id, model_id) VALUES (?, ?)`, [id, mId]);
    }
  });
  return getManagedKeyById(id);
}

export async function updateManagedKey(id, fields) {
  const db = await getAdapter();
  const now = new Date().toISOString();
  const allowed = ['label', 'status', 'total_token_limit', 'max_output_tokens', 'requests_per_minute', 'tokens_per_minute', 'max_concurrent_requests', 'expires_at'];
  const updates = [];
  const vals = [];

  for (const [k, v] of Object.entries(fields)) {
    if (allowed.includes(k)) {
      updates.push(`${k} = ?`);
      vals.push(v);
    }
  }

  if (updates.length > 0) {
    updates.push(`updated_at = ?`);
    vals.push(now);
    vals.push(id);
    db.run(`UPDATE managed_api_keys SET ${updates.join(', ')} WHERE id = ?`, vals);
  }

  if (Array.isArray(fields.allowedModels)) {
    db.transaction(() => {
      db.run(`DELETE FROM managed_api_key_models WHERE key_id = ?`, [id]);
      for (const mId of fields.allowedModels) {
        db.run(`INSERT INTO managed_api_key_models (key_id, model_id) VALUES (?, ?)`, [id, mId]);
      }
    });
  }
  return getManagedKeyById(id);
}

export async function getAllowedModelsForKey(keyId) {
  const db = await getAdapter();
  const rows = db.all(`SELECT model_id FROM managed_api_key_models WHERE key_id = ?`, [keyId]);
  return rows.map(r => r.model_id);
}
