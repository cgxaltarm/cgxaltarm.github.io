import { describe, expect, it, beforeEach } from "vitest";
import { generateManagedKey, parseManagedKeyString, verifySecret } from "../../src/dailyflo/managedKeys/utils.js";
import { verifyManagedApiKey } from "../../src/dailyflo/managedKeys/verifier.js";
import { createManagedKey } from "../../src/lib/db/repos/managedKeysRepo.js";
import { getAdapter } from "../../src/lib/db/driver.js";

describe("DailyFlo Managed Keys - Verification & Generation", () => {
  it("generates managed key with correct format", () => {
    const key = generateManagedKey();
    expect(key.rawKey).toMatch(/^df_live_[a-f0-9]{32}_[a-f0-9]{64}$/);
    expect(key.publicId).toHaveLength(32);
    expect(key.secret).toHaveLength(64);
    expect(key.digest).toHaveLength(64);
  });

  it("parses valid and invalid key strings", () => {
    const validRaw = "df_live_12345678901234567890123456789012_1234567890123456789012345678901212345678901234567890123456789012";
    const parsed = parseManagedKeyString(validRaw);
    expect(parsed).not.toBeNull();
    expect(parsed.publicId).toBe("12345678901234567890123456789012");

    expect(parseManagedKeyString("invalid_key")).toBeNull();
    expect(parseManagedKeyString("df_live_short_secret")).toBeNull();
  });

  it("verifies secret against digest using HMAC-SHA256", () => {
    const { secret, digest } = generateManagedKey();
    expect(verifySecret(secret, digest)).toBe(true);
    expect(verifySecret("wrong_secret", digest)).toBe(false);
  });

  it("verifies API key record in DB", async () => {
    const generated = generateManagedKey();
    await createManagedKey({
      id: generated.id,
      publicId: generated.publicId,
      secretDigest: generated.digest,
      label: "Unit Test Key",
      status: "active",
      allowedModels: ["gpt-4o"],
    });

    const res = await verifyManagedApiKey(generated.rawKey);
    expect(res.valid).toBe(true);
    expect(res.key.label).toBe("Unit Test Key");

    const invalidRes = await verifyManagedApiKey(generated.rawKey.replace(/.$/, "0"));
    expect(invalidRes.valid).toBe(false);
  });
});
