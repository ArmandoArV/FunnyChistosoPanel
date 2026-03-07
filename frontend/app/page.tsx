import { cookies } from "next/headers";
import { DashboardContainer } from "@/components/containers/DashboardContainer";
import { getVictims } from "@/lib/api";
import type { Victim } from "@/lib/types";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  let initialVictims: Victim[] = [];
  if (token) {
    try {
      initialVictims = await getVictims(token);
    } catch {
      // Container will handle loading on the client
    }
  }

  return <DashboardContainer initialVictims={initialVictims} />;
}
