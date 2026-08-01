import crypto from "node:crypto";

const PEPPER = process.env.DAILYFLO_API_KEY_PEPPER || "dailyflo_default_pepper_secret_key_change_in_production";

export function generateManagedKey() {
  const publicId = crypto.randomBytes(16).toString("hex"); // 32 hex chars
  const secret = crypto.randomBytes(32).toString("hex");   // 64 hex chars
  const rawKey = `df_live_${publicId}_${secret}`;
  const digest = hashSecret(secret);
  const id = `mak_${publicId}`;
  return { id, publicId, secret, rawKey, digest };
}

export function hashSecret(secret) {
  return crypto.createHmac("sha256", PEPPER).update(secret).digest("hex");
}

export function parseManagedKeyString(rawKey) {
  if (!rawKey || typeof rawKey !== "string") return null;
  const match = rawKey.match(/^df_live_([a-f0-9]{32})_([a-f0-9]{64})$/);
  if (!match) return null;
  return { publicId: match[1], secret: match[2] };
}

export function verifySecret(secret, expectedDigest) {
  if (!secret || !expectedDigest) return false;
  const actualDigest = hashSecret(secret);
  const bufA = Buffer.from(actualDigest, "utf-8");
  const bufB = Buffer.from(expectedDigest, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
