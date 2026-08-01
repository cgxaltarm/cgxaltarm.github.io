import { verifyManagedApiKey } from "@/dailyflo/managedKeys/verifier";
import { createDashboardSession } from "@/lib/db/repos/dashboardSessionsRepo";

export async function POST(request) {
  try {
    const body = await request.json();
    const { key: rawKey } = body || {};

    if (!rawKey) {
      return Response.json({ error: { message: "Missing API key", type: "invalid_request_error" } }, { status: 400 });
    }

    const auth = await verifyManagedApiKey(rawKey);
    if (!auth.valid) {
      return Response.json({ error: { message: "Invalid API key", type: "invalid_request_error" } }, { status: 401 });
    }

    const { rawToken, expiresAt } = await createDashboardSession(auth.key.id);

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `df_session=${rawToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );

    return Response.json({ success: true, expiresAt }, { headers });
  } catch (error) {
    return Response.json({ error: { message: error.message, type: "server_error" } }, { status: 500 });
  }
}
