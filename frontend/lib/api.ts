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
  token?: string
): Promise<void> {
  const res = await fetch(
    `${getApiUrl()}/api/victims/${encodeURIComponent(victimId)}/command`,
    {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify({ command }),
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

