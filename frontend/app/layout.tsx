import type { Metadata } from "next";
import "./globals.css";
import { FluentProviderWrapper } from "@/components/FluentProviderWrapper";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "C2 Control Panel",
  description: "Command & Control Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ height: "100%", backgroundColor: "#141414" }}>
        <FluentProviderWrapper>
          <AuthProvider>{children}</AuthProvider>
        </FluentProviderWrapper>
      </body>
    </html>
  );
}
