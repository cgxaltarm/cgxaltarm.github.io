import { describe, expect, it } from "vitest";
import { createManagedKey } from "../../src/lib/db/repos/managedKeysRepo.js";
import { reserveQuota, settleQuota } from "../../src/dailyflo/quota/manager.js";
import { generateManagedKey } from "../../src/dailyflo/managedKeys/utils.js";
import { getAdapter } from "../../src/lib/db/driver.js";

describe("DailyFlo Concurrency & Race Conditions", () => {
  it("handles parallel quota reservations atomically without race conditions", async () => {
    const keyInfo = generateManagedKey();
    const key = await createManagedKey({
      id: keyInfo.id,
      publicId: keyInfo.publicId,
      secretDigest: keyInfo.digest,
      label: "Concurrency Key",
      totalTokenLimit: 10000,
    });

    const requests = Array.from({ length: 5 }, (_, i) =>
      reserveQuota({ keyId: key.id, requestId: `parallel-req-${i}`, estimatedTokens: 2500 })
    );

    const results = await Promise.all(requests);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    expect(successCount).toBe(4);
    expect(failCount).toBe(1);

    const db = await getAdapter();
    const keyRecord = db.get("SELECT * FROM managed_api_keys WHERE id = ?", [key.id]);
    expect(keyRecord.reserved_tokens).toBe(10000);
  });
});
