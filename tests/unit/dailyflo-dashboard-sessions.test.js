import { describe, expect, it } from "vitest";
import { createManagedKey } from "../../src/lib/db/repos/managedKeysRepo.js";
import { createDashboardSession, verifyDashboardSession } from "../../src/lib/db/repos/dashboardSessionsRepo.js";
import { generateManagedKey } from "../../src/dailyflo/managedKeys/utils.js";

describe("DailyFlo Key Dashboard Sessions", () => {
  it("creates and verifies dashboard session with HttpOnly token hash", async () => {
    const keyInfo = generateManagedKey();
    const key = await createManagedKey({
      id: keyInfo.id,
      publicId: keyInfo.publicId,
      secretDigest: keyInfo.digest,
      label: "Dashboard Session Key",
    });

    const { rawToken } = await createDashboardSession(key.id);
    expect(rawToken).toMatch(/^dfs_[a-f0-9]{48}$/);

    const session = await verifyDashboardSession(rawToken);
    expect(session).not.toBeNull();
    expect(session.key_id).toBe(key.id);

    const invalidSession = await verifyDashboardSession("dfs_invalid_token");
    expect(invalidSession).toBeNull();
  });
});
