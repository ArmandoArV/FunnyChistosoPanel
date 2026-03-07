export interface Victim {
  id: string;
  info: Record<string, string>;
  lastSeen: string;
}

export interface WSMessage {
  type: "victim_connected" | "victim_disconnected" | "shell_output";
  id: string;
  output?: string;
}
