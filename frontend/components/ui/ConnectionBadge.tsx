import { Badge } from "@fluentui/react-components";

interface ConnectionBadgeProps {
  connected: boolean;
}

export function ConnectionBadge({ connected }: ConnectionBadgeProps) {
  return (
    <Badge appearance="tint" color={connected ? "success" : "danger"}>
      {connected ? "● Live" : "○ Offline"}
    </Badge>
  );
}
