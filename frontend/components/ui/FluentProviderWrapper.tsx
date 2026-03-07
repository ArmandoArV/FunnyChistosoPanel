"use client";

import { FluentProvider, webDarkTheme } from "@fluentui/react-components";

interface FluentProviderWrapperProps {
  children: React.ReactNode;
}

export function FluentProviderWrapper({ children }: FluentProviderWrapperProps) {
  return (
    <FluentProvider theme={webDarkTheme} style={{ height: "100%" }}>
      {children}
    </FluentProvider>
  );
}
