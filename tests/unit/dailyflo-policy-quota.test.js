import { describe, expect, it } from "vitest";
import { createManagedKey } from "../../src/lib/db/repos/managedKeysRepo.js";
import { filterModelsListForManagedKey, isModelAllowedForManagedKey } from "../../src/dailyflo/policy.js";
import { reserveQuota, settleQuota } from "../../src/dailyflo/quota/manager.js";
import { generateManagedKey } from "../../src/dailyflo/managedKeys/utils.js";
import { getAdapter } from "../../src/lib/db/driver.js";

describe("DailyFlo - Policy & Quota Verification", () => {
  it("filters model list according to key allowed models", async () => {
    const keyInfo = generateManagedKey();
    const key = await createManagedKey({
      id: keyInfo.id,
      publicId: keyInfo.publicId,
      secretDigest: keyInfo.digest,
      label: "Policy Test Key",
      allowedModels: ["gpt-4o", "kiro/claude-sonnet-5"],
    });

    const fullList = [
      { id: "gpt-4o" },
      { id: "kiro/claude-sonnet-5" },
      { id: "claude-opus-5" },
    ];

    const filtered = await filterModelsListForManagedKey(key, fullList);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(m => m.id)).toEqual(["gpt-4o", "kiro/claude-sonnet-5"]);

    expect(await isModelAllowedForManagedKey(key, "gpt-4o")).toBe(true);
    expect(await isModelAllowedForManagedKey(key, "claude-opus-5")).toBe(false);
  });

  it("handles quota reservation and atomic settlement", async () => {
    const keyInfo = generateManagedKey();
    const key = await createManagedKey({
      id: keyInfo.id,
      publicId: keyInfo.publicId,
      secretDigest: keyInfo.digest,
      label: "Quota Test Key",
      totalTokenLimit: 10000,
    });

    const res = await reserveQuota({ keyId: key.id, requestId: "req-1", estimatedTokens: 2000 });
    expect(res.success).toBe(true);

    const db = await getAdapter();
    let updatedKey = db.get("SELECT * FROM managed_api_keys WHERE id = ?", [key.id]);
    expect(updatedKey.reserved_tokens).toBe(2000);
    expect(updatedKey.tokens_used).toBe(0);

    const setRes = await settleQuota({
      keyId: key.id,
      requestId: "req-1",
      actualInputTokens: 500,
      actualOutputTokens: 500,
      model: "gpt-4o",
      provider: "openai"
    });
    expect(setRes.success).toBe(true);

    updatedKey = db.get("SELECT * FROM managed_api_keys WHERE id = ?", [key.id]);
    expect(updatedKey.reserved_tokens).toBe(0);
    expect(updatedKey.tokens_used).toBe(1000);
  });
});
