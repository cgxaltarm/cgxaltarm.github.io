import { verifyDashboardSession } from "@/lib/db/repos/dashboardSessionsRepo";
import { getManagedKeyById, getAllowedModelsForKey } from "@/lib/db/repos/managedKeysRepo";
import { getAdapter } from "@/lib/db/driver";

export async function GET(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/df_session=([^;]+)/);
    const rawToken = match ? match[1] : null;

    if (!rawToken) {
      return Response.json({ error: { message: "Unauthorized", type: "unauthorized" } }, { status: 401 });
    }

    const session = await verifyDashboardSession(rawToken);
    if (!session) {
      return Response.json({ error: { message: "Session expired or invalid", type: "unauthorized" } }, { status: 401 });
    }

    const key = await getManagedKeyById(session.key_id);
    if (!key) {
      return Response.json({ error: { message: "Key not found", type: "not_found" } }, { status: 444 });
    }

    const allowedModels = await getAllowedModelsForKey(key.id);

    const db = await getAdapter();
    const usageEvents = db.all(
      `SELECT model, provider, charged_tokens, created_at FROM managed_key_usage_events WHERE key_id = ? ORDER BY created_at DESC LIMIT 50`,
      [key.id]
    );

    return Response.json({
      label: key.label,
      status: key.status,
      totalTokenLimit: key.total_token_limit,
      tokensUsed: key.tokens_used,
      reservedTokens: key.reserved_tokens,
      remainingTokens: key.total_token_limit !== null ? Math.max(0, key.total_token_limit - key.tokens_used - key.reserved_tokens) : null,
      expiresAt: key.expires_at,
      allowedModels,
      recentUsage: usageEvents,
    });
  } catch (error) {
    return Response.json({ error: { message: error.message, type: "server_error" } }, { status: 500 });
  }
}
