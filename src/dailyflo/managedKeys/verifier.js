import { parseManagedKeyString, verifySecret } from "./utils.js";
import { getManagedKeyByPublicId, updateManagedKey } from "../../lib/db/repos/managedKeysRepo.js";
import { getAdapter } from "../../lib/db/driver.js";

export async function verifyManagedApiKey(rawKey) {
  const parsed = parseManagedKeyString(rawKey);
  if (!parsed) return { valid: false, reason: "invalid_format" };

  const { publicId, secret } = parsed;
  const keyRecord = await getManagedKeyByPublicId(publicId);

  // Uniform timing failure protection
  const dummyDigest = "0".repeat(64);
  const digestToCompare = keyRecord ? keyRecord.secret_digest : dummyDigest;
  const matches = verifySecret(secret, digestToCompare);

  if (!keyRecord || !matches) {
    return { valid: false, reason: "invalid_key" };
  }

  if (keyRecord.status !== "active") {
    return { valid: false, reason: `key_${keyRecord.status}` };
  }

  if (keyRecord.expires_at) {
    const expires = new Date(keyRecord.expires_at).getTime();
    if (Date.now() > expires) {
      return { valid: false, reason: "key_expired" };
    }
  }

  // Update last_used_at non-blocking
  try {
    const db = await getAdapter();
    db.run(`UPDATE managed_api_keys SET last_used_at = ? WHERE id = ?`, [new Date().toISOString(), keyRecord.id]);
  } catch {}

  return {
    valid: true,
    key: keyRecord,
  };
}
