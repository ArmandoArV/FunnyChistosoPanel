import { redirect } from "next/navigation";

export default function DebugPage() {
  if (process.env.NODE_ENV === "production") {
    redirect("/login");
  }

  // Only load DebugContainer in development
  const { DebugContainer } = require("@/components/containers/DebugContainer");
  return <DebugContainer />;
}

