"use client";

import {
  Button,
  Card,
  Text,
  Badge,
  Spinner,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  DesktopRegular,
  PersonRegular,
  GlobeRegular,
  InfoRegular,
  ArrowSyncRegular,
  StorageRegular,
  ClockRegular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "auto",
    gap: "16px",
    padding: "4px",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "12px",
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
    },
  },
  card: {
    padding: "16px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "8px",
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  field: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
  },
  fieldLabel: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
    fontWeight: 500,
  },
  fieldValue: {
    fontSize: "12px",
    fontFamily: "monospace",
    color: tokens.colorNeutralForeground1,
    textAlign: "right" as const,
    maxWidth: "60%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  detailBlock: {
    padding: "12px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: "6px",
    fontFamily: "monospace",
    fontSize: "11px",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    color: tokens.colorNeutralForeground2,
    maxHeight: "200px",
    overflowY: "auto",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "12px",
    color: tokens.colorNeutralForeground4,
    padding: "40px",
  },
});

interface SysInfoData {
  hostname?: string;
  username?: string;
  os?: string;
  arch?: string;
  cpus?: number;
  go_ver?: string;
  cwd?: string;
  pid?: number;
  ips?: string[];
  system_details?: string;
  disks?: string;
  uname?: string;
  uptime?: string;
  memory?: string;
}

interface VictimInfoProps {
  data: SysInfoData | null;
  loading: boolean;
  onRefresh: () => void;
  victimId: string;
}

export function VictimInfo({ data, loading, onRefresh, victimId }: VictimInfoProps) {
  const styles = useStyles();

  const ip = victimId.split(":")[0];

  if (!data && !loading) {
    return (
      <div className={styles.root}>
        <div className={styles.toolbar}>
          <Button appearance="subtle" size="small" icon={<ArrowSyncRegular />} onClick={onRefresh}>
            Load System Info
          </Button>
        </div>
        <div className={styles.empty}>
          <InfoRegular fontSize={40} />
          <Text size={300}>Click to fetch system information</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Button appearance="subtle" size="small" icon={<ArrowSyncRegular />} onClick={onRefresh} disabled={loading}>
          Refresh
        </Button>
        {loading && <Spinner size="tiny" />}
        {data?.os && (
          <Badge appearance="filled" color="brand">
            {data.os} / {data.arch}
          </Badge>
        )}
      </div>

      {/* Info cards grid */}
      <div className={styles.grid}>
        {/* System card */}
        <Card className={styles.card}>
          <div className={styles.cardTitle}>
            <DesktopRegular fontSize={16} color={tokens.colorBrandForeground1} />
            <Text weight="semibold" size={300}>System</Text>
          </div>
          <div className={styles.field}>
            <Text className={styles.fieldLabel}>Hostname</Text>
            <Text className={styles.fieldValue}>{data?.hostname ?? "—"}</Text>
          </div>
          <div className={styles.field}>
            <Text className={styles.fieldLabel}>OS</Text>
            <Text className={styles.fieldValue}>{data?.os ?? "—"}</Text>
          </div>
          <div className={styles.field}>
            <Text className={styles.fieldLabel}>Architecture</Text>
            <Text className={styles.fieldValue}>{data?.arch ?? "—"}</Text>
          </div>
          <div className={styles.field}>
            <Text className={styles.fieldLabel}>CPUs</Text>
            <Text className={styles.fieldValue}>{data?.cpus ?? "—"}</Text>
          </div>
          <div className={styles.field}>
            <Text className={styles.fieldLabel}>Agent PID</Text>
            <Text className={styles.fieldValue}>{data?.pid ?? "—"}</Text>
          </div>
          <div className={styles.field}>
            <Text className={styles.fieldLabel}>Go Version</Text>
            <Text className={styles.fieldValue}>{data?.go_ver ?? "—"}</Text>
          </div>
        </Card>

        {/* User & Network card */}
        <Card className={styles.card}>
          <div className={styles.cardTitle}>
            <PersonRegular fontSize={16} color={tokens.colorBrandForeground1} />
            <Text weight="semibold" size={300}>User & Network</Text>
          </div>
          <div className={styles.field}>
            <Text className={styles.fieldLabel}>Username</Text>
            <Text className={styles.fieldValue}>{data?.username ?? "—"}</Text>
          </div>
          <div className={styles.field}>
            <Text className={styles.fieldLabel}>Working Dir</Text>
            <Text className={styles.fieldValue}>{data?.cwd ?? "—"}</Text>
          </div>
          <div className={styles.field}>
            <Text className={styles.fieldLabel}>Remote IP</Text>
            <Text className={styles.fieldValue}>{ip}</Text>
          </div>
          <Divider style={{ margin: "8px 0" }} />
          <div className={styles.cardTitle}>
            <GlobeRegular fontSize={14} />
            <Text size={200} weight="semibold">Local IPs</Text>
          </div>
          {(data?.ips ?? []).map((ipAddr, i) => (
            <div key={i} className={styles.field}>
              <Text className={styles.fieldValue} style={{ textAlign: "left", maxWidth: "100%" }}>
                {ipAddr}
              </Text>
            </div>
          ))}
          {(!data?.ips || data.ips.length === 0) && (
            <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>No IPs available</Text>
          )}
        </Card>

        {/* Uptime / OS Details card */}
        {(data?.system_details || data?.uname || data?.uptime) && (
          <Card className={styles.card}>
            <div className={styles.cardTitle}>
              <ClockRegular fontSize={16} color={tokens.colorBrandForeground1} />
              <Text weight="semibold" size={300}>OS Details</Text>
            </div>
            {data?.uname && (
              <>
                <Text className={styles.fieldLabel}>Kernel</Text>
                <div className={styles.detailBlock}>{data.uname}</div>
              </>
            )}
            {data?.uptime && (
              <div className={styles.field} style={{ marginTop: "8px" }}>
                <Text className={styles.fieldLabel}>Uptime</Text>
                <Text className={styles.fieldValue}>{data.uptime}</Text>
              </div>
            )}
            {data?.system_details && (
              <>
                <Text className={styles.fieldLabel} style={{ marginTop: "8px" }}>System Info</Text>
                <div className={styles.detailBlock}>{data.system_details}</div>
              </>
            )}
          </Card>
        )}

        {/* Disk & Memory card */}
        {(data?.disks || data?.memory) && (
          <Card className={styles.card}>
            <div className={styles.cardTitle}>
              <StorageRegular fontSize={16} color={tokens.colorBrandForeground1} />
              <Text weight="semibold" size={300}>Storage & Memory</Text>
            </div>
            {data?.disks && (
              <>
                <Text className={styles.fieldLabel}>Disks</Text>
                <div className={styles.detailBlock}>{data.disks}</div>
              </>
            )}
            {data?.memory && (
              <>
                <Text className={styles.fieldLabel} style={{ marginTop: "8px" }}>Memory</Text>
                <div className={styles.detailBlock}>{data.memory}</div>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
