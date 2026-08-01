import { reserveQuota, settleQuota } from "../quota/manager.js";

export async function processDailyFloRequestStart({ apiKey, model, requestId, estimatedTokens = 4096 }) {
  if (!apiKey || !apiKey.startsWith("df_live_")) return null;

  const { verifyManagedApiKey } = await import("../managedKeys/verifier.js");
  const auth = await verifyManagedApiKey(apiKey);
  if (!auth.valid) return { error: "invalid_key", status: 401 };

  const reservation = await reserveQuota({
    keyId: auth.key.id,
    requestId,
    estimatedTokens,
  });

  if (!reservation.success) {
    return { error: reservation.reason || "quota_exceeded", status: 429, detail: reservation };
  }

  return { key: auth.key, reservationId: reservation.reservationId };
}

export async function processDailyFloRequestEnd({ apiKey, requestId, actualUsage = {}, model, provider }) {
  if (!apiKey || !apiKey.startsWith("df_live_")) return;

  const { parseManagedKeyString } = await import("../managedKeys/utils.js");
  const parsed = parseManagedKeyString(apiKey);
  if (!parsed) return;

  const { getManagedKeyByPublicId } = await import("../../lib/db/repos/managedKeysRepo.js");
  const keyRecord = await getManagedKeyByPublicId(parsed.publicId);
  if (!keyRecord) return;

  await settleQuota({
    keyId: keyRecord.id,
    requestId,
    actualInputTokens: actualUsage.prompt_tokens || actualUsage.input_tokens || 0,
    actualOutputTokens: actualUsage.completion_tokens || actualUsage.output_tokens || 0,
    cachedTokens: actualUsage.cached_tokens || 0,
    reasoningTokens: actualUsage.reasoning_tokens || 0,
    model: model || "unknown",
    provider: provider || "unknown",
  });
}
