import { describe, expect, it } from "vitest";
import { processDailyFloRequestStart, processDailyFloRequestEnd } from "../../src/dailyflo/usage/bridge.js";
import { createManagedKey } from "../../src/lib/db/repos/managedKeysRepo.js";
import { generateManagedKey } from "../../src/dailyflo/managedKeys/utils.js";
import { getAdapter } from "../../src/lib/db/driver.js";

describe("DailyFlo Usage Bridge & Request Attribution", () => {
  it("reserves quota on start and settles usage on end via usage bridge", async () => {
    const keyInfo = generateManagedKey();
    const key = await createManagedKey({
      id: keyInfo.id,
      publicId: keyInfo.publicId,
      secretDigest: keyInfo.digest,
      label: "Bridge Key",
      totalTokenLimit: 5000,
      allowedModels: ["gpt-4o"],
    });

    const startRes = await processDailyFloRequestStart({
      apiKey: keyInfo.rawKey,
      model: "gpt-4o",
      requestId: "req-bridge-1",
      estimatedTokens: 1000,
    });
    expect(startRes.error).toBeUndefined();
    expect(startRes.reservationId).toBeDefined();

    const db = await getAdapter();
    let keyRecord = db.get("SELECT * FROM managed_api_keys WHERE id = ?", [key.id]);
    expect(keyRecord.reserved_tokens).toBe(1000);

    await processDailyFloRequestEnd({
      apiKey: keyInfo.rawKey,
      requestId: "req-bridge-1",
      actualUsage: { prompt_tokens: 300, completion_tokens: 200 },
      model: "gpt-4o",
      provider: "openai",
    });

    keyRecord = db.get("SELECT * FROM managed_api_keys WHERE id = ?", [key.id]);
    expect(keyRecord.reserved_tokens).toBe(0);
    expect(keyRecord.tokens_used).toBe(500);

    const events = db.all("SELECT * FROM managed_key_usage_events WHERE key_id = ?", [key.id]);
    expect(events).toHaveLength(1);
    expect(events[0].charged_tokens).toBe(500);
    expect(events[0].request_id).toBe("req-bridge-1");
  });
});
