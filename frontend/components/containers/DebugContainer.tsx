"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  Text,
  Badge,
  Button,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowClockwiseRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  card: { marginBottom: "12px" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  mono: { fontFamily: "monospace", fontSize: "12px" },
  pre: {
    backgroundColor: "#0c0c0c",
    color: "#00e676",
    fontFamily: "monospace",
    fontSize: "12px",
    padding: "8px",
    borderRadius: "4px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    marginTop: "6px",
    maxHeight: "160px",
    overflowY: "auto",
  },
});

type CheckStatus = "pending" | "ok" | "fail";

interface Check {
  label: string;
  url: string;
  status: CheckStatus;
  detail: string;
}

function StatusChip({ status }: { status: CheckStatus }) {
  return (
    <Badge
      color={status === "ok" ? "success" : status === "fail" ? "danger" : "informative"}
      appearance="tint"
    >
      {status === "ok" ? "✓ OK" : status === "fail" ? "✗ FAIL" : "…"}
    </Badge>
  );
}

export function DebugContainer() {
  const styles = useStyles();
  const [apiUrl, setApiUrl] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [checks, setChecks] = useState<Check[]>([]);
  const [wsStatus, setWsStatus] = useState<CheckStatus>("pending");
  const [wsDetail, setWsDetail] = useState("Not tested yet");

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    const ws = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws";
    setApiUrl(api);
    setWsUrl(ws);
    setChecks([
      { label: "Health", url: `${api}/health`, status: "pending", detail: "" },
      { label: "Victims API", url: `${api}/api/victims`, status: "pending", detail: "" },
    ]);
  }, []);

  async function runChecks() {
    if (!apiUrl) return;

    setChecks((prev) =>
      prev.map((c) => ({ ...c, status: "pending" as CheckStatus, detail: "Checking…" }))
    );

    const updated = await Promise.all(
      checks.map(async (c) => {
        try {
          const res = await fetch(c.url, { cache: "no-store" });
          const body = await res.text();
          return {
            ...c,
            status: (res.ok ? "ok" : "fail") as CheckStatus,
            detail: body.slice(0, 300),
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          return { ...c, status: "fail" as CheckStatus, detail: `Network error: ${msg}` };
        }
      })
    );
    setChecks(updated);

    setWsStatus("pending");
    setWsDetail("Connecting…");
    try {
      const ws = new WebSocket(wsUrl);
      const timer = setTimeout(() => {
        ws.close();
        setWsStatus("fail");
        setWsDetail("Timed out after 5s — server not reachable or port blocked");
      }, 5000);
      ws.onopen = () => {
        clearTimeout(timer);
        setWsStatus("ok");
        setWsDetail("101 Switching Protocols — WebSocket connected successfully ✓");
        setTimeout(() => ws.close(), 300);
      };
      ws.onerror = () => {
        clearTimeout(timer);
        setWsStatus("fail");
        setWsDetail("Connection error — check browser console (F12) for details");
      };
    } catch (e: unknown) {
      setWsStatus("fail");
      setWsDetail(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return (
    <div style={{ padding: "24px", maxWidth: "680px", margin: "0 auto" }}>
      <Text size={600} weight="semibold" block style={{ marginBottom: "4px" }}>
        🔧 Debug Dashboard
      </Text>
      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>
        Open this page at <code>http://localhost:3000/debug</code>
      </Text>
      <div style={{ marginBottom: "16px" }} />

      {/* Env */}
      <Card className={styles.card}>
        <CardHeader header={<Text weight="semibold">Resolved URLs</Text>} />
        <div style={{ padding: "0 16px 12px" }}>
          <div className={styles.row}>
            <Text className={styles.mono}>API</Text>
            <Text className={styles.mono}>{apiUrl || "loading…"}</Text>
          </div>
          <div className={styles.row} style={{ borderBottom: "none" }}>
            <Text className={styles.mono}>WebSocket</Text>
            <Text className={styles.mono}>{wsUrl || "loading…"}</Text>
          </div>
        </div>
      </Card>

      {/* Connectivity Checks */}
      <Card className={styles.card}>
        <CardHeader
          header={<Text weight="semibold">Connectivity</Text>}
          action={
            <Button
              size="small"
              appearance="subtle"
              icon={<ArrowClockwiseRegular />}
              onClick={runChecks}
            >
              Run checks
            </Button>
          }
        />
        <div style={{ padding: "0 16px 12px" }}>
          {checks.map((c) => (
            <div key={c.url}>
              <div className={styles.row}>
                <div>
                  <Text weight="semibold">{c.label}</Text>
                  <Text
                    className={styles.mono}
                    block
                    style={{ color: tokens.colorNeutralForeground3 }}
                  >
                    {c.url}
                  </Text>
                </div>
                <StatusChip status={c.status} />
              </div>
              {c.detail && c.status !== "pending" && (
                <div className={styles.pre}>{c.detail}</div>
              )}
            </div>
          ))}

          <Divider style={{ margin: "8px 0" }} />

          <div className={styles.row} style={{ borderBottom: "none" }}>
            <div>
              <Text weight="semibold">WebSocket upgrade</Text>
              <Text
                className={styles.mono}
                block
                style={{ color: tokens.colorNeutralForeground3 }}
              >
                {wsUrl}
              </Text>
            </div>
            <StatusChip status={wsStatus} />
          </div>
          <div className={styles.pre}>{wsDetail}</div>
        </div>
      </Card>

      {/* Fix guide */}
      <Card>
        <CardHeader header={<Text weight="semibold">Common fixes</Text>} />
        <div style={{ padding: "0 16px 16px" }}>
          {[
            ["Health FAIL", "Backend isn't running → run: go run backend/main.go from repo root"],
            ["Health OK but WS FAIL", "CORS or port blocked → restart backend with latest code"],
            ["WS times out", "Check backend terminal for errors. Try curl http://localhost:8080/health in terminal"],
            ["Wrong URL shown above", "Create frontend/.env.local with NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL"],
            ["Firefox specific", "DevTools (F12) → Network → WS tab → click the ws:// row → Frames tab for details"],
          ].map(([title, fix]) => (
            <div key={title} style={{ marginBottom: "10px" }}>
              <Text weight="semibold" size={200} block>▸ {title}</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{fix}</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
