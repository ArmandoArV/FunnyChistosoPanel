"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Text,
  makeStyles,
  tokens,
  Spinner,
  Badge,
  Tooltip,
  Divider,
} from "@fluentui/react-components";
import {
  ArrowUploadRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  GlobeRegular,
  NetworkCheckRegular,
  PersonRegular,
  CopyRegular,
  LinkRegular,
  ServerRegular,
  HomeRegular,
} from "@fluentui/react-icons";
import { useAuth } from "@/lib/auth";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 28px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    gap: "12px",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  body: {
    flex: 1,
    padding: "28px 32px",
    overflowY: "auto",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
    gap: "20px",
    maxWidth: "1400px",
  },
  card: {
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  infoRow: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: "10px",
    padding: "6px 0",
  },
  infoIcon: {
    color: tokens.colorNeutralForeground3,
    display: "flex",
    alignItems: "center",
  },
  infoLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  infoValue: {
    fontFamily: "var(--fontFamilyMonospace)",
    fontSize: "12px",
    wordBreak: "break-all",
  },
  logs: {
    backgroundColor: tokens.colorNeutralBackground5,
    padding: "14px",
    borderRadius: "6px",
    fontFamily: "var(--fontFamilyMonospace)",
    fontSize: "12px",
    whiteSpace: "pre-wrap",
    maxHeight: "360px",
    overflowY: "auto",
    lineHeight: "1.5",
  },
  actions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
});

interface DeployResult {
  status: "success" | "error" | string;
  message?: string;
  logs?: string;
}

interface InfoEntry {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <Tooltip content={copied ? "Copied!" : "Copy"} relationship="label">
      <Button
        appearance="subtle"
        size="small"
        icon={copied ? <CheckmarkCircleRegular color={tokens.colorPaletteGreenForeground1} /> : <CopyRegular />}
        onClick={handleCopy}
      />
    </Tooltip>
  );
}

export function AdminContainer() {
  const styles = useStyles();
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployResult(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/admin/deployment/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      setDeployResult(data);
    } catch (error) {
      setDeployResult({
        status: "error",
        message: error instanceof Error ? error.message : "Deployment failed",
      });
    } finally {
      setDeploying(false);
    }
  };

  if (!user) return null;

  const systemInfo: InfoEntry[] = [
    { icon: <GlobeRegular fontSize={14} />, label: "VM IP", value: "20.42.15.210" },
    { icon: <ServerRegular fontSize={14} />, label: "C2 Port", value: "4444" },
    { icon: <NetworkCheckRegular fontSize={14} />, label: "API Port", value: "8080" },
    {
      icon: <LinkRegular fontSize={14} />,
      label: "Tunnel URL",
      value: "https://controversial-validity-striking-kits.trycloudflare.com",
    },
    {
      icon: <HomeRegular fontSize={14} />,
      label: "Frontend",
      value: "https://funnychistoso-panel.vercel.app",
    },
  ];

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text size={500} weight="semibold">Admin Dashboard</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Deployment &amp; System Controls
          </Text>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Badge appearance="filled" color="brand">{user.username}</Badge>
          <Button size="small" icon={<HomeRegular />} onClick={() => router.push("/")}>
            Dashboard
          </Button>
          <Button size="small" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.grid}>
          {/* Deployment Card */}
          <Card className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleRow}>
                <ArrowUploadRegular fontSize={18} color={tokens.colorBrandForeground1} />
                <Text size={400} weight="semibold">Backend Deployment</Text>
              </div>
              {deployResult && (
                <Badge
                  appearance="filled"
                  color={deployResult.status === "success" ? "success" : "danger"}
                  icon={
                    deployResult.status === "success"
                      ? <CheckmarkCircleRegular />
                      : <DismissCircleRegular />
                  }
                >
                  {deployResult.status}
                </Badge>
              )}
            </div>

            <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
              Rebuild and restart the C2 backend server on the Azure VM.
            </Text>

            <div className={styles.actions}>
              <Button
                appearance="primary"
                icon={deploying ? <Spinner size="tiny" /> : <ArrowUploadRegular />}
                onClick={handleDeploy}
                disabled={deploying}
              >
                {deploying ? "Deploying…" : "Deploy Now"}
              </Button>
              {deployResult?.status === "success" && (
                <Text size={200} style={{ color: tokens.colorPaletteGreenForeground1 }}>
                  ✓ Deployed successfully
                </Text>
              )}
            </div>

            {deployResult?.message && (
              <div>
                <Text size={200} weight="semibold">Message: </Text>
                <Text size={200}>{deployResult.message}</Text>
              </div>
            )}

            {deployResult?.logs && (
              <>
                <Divider />
                <div>
                  <Text size={200} weight="semibold" style={{ display: "block", marginBottom: "8px" }}>
                    Deployment Logs
                  </Text>
                  <div className={styles.logs}>{deployResult.logs}</div>
                </div>
              </>
            )}
          </Card>

          {/* System Info Card */}
          <Card className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleRow}>
                <ServerRegular fontSize={18} color={tokens.colorBrandForeground1} />
                <Text size={400} weight="semibold">System Information</Text>
              </div>
            </div>

            {systemInfo.map(({ icon, label, value }) => (
              <div key={label}>
                <div className={styles.infoRow}>
                  <span className={styles.infoIcon}>{icon}</span>
                  <div>
                    <Text className={styles.infoLabel} style={{ display: "block" }}>{label}</Text>
                    <Text className={styles.infoValue}>{value}</Text>
                  </div>
                  <CopyButton value={value} />
                </div>
                <Divider />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
