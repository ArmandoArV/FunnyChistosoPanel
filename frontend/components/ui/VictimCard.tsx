"use client";

import {
  Card,
  Button,
  Text,
  Badge,
  Tooltip,
  Divider,
  mergeClasses,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  DesktopRegular,
  PlugDisconnectedRegular,
  PersonRegular,
  GlobeRegular,
  InfoRegular,
} from "@fluentui/react-icons";
import type { Victim } from "@/lib/types";

const useStyles = makeStyles({
  card: {
    cursor: "pointer",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: "12px 14px",
    borderRadius: "8px",
    transition: "border-color 0.15s ease, background-color 0.15s ease",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      border: `1px solid ${tokens.colorNeutralStroke1}`,
    },
  },
  selected: {
    border: `2px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
    ":hover": {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  top: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
  },
  topLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
    flex: 1,
  },
  titleBlock: {
    minWidth: 0,
    flex: 1,
  },
  hostname: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "block",
  },
  sessionId: {
    fontFamily: "var(--fontFamilyMonospace)",
    fontSize: "11px",
    color: tokens.colorNeutralForeground3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "block",
  },
  infoRows: {
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: tokens.colorNeutralForeground2,
  },
  infoValue: {
    fontFamily: "var(--fontFamilyMonospace)",
    fontSize: "11px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  footer: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastSeen: {
    fontSize: "11px",
    color: tokens.colorNeutralForeground4,
  },
});

interface VictimCardProps {
  victim: Victim;
  selected: boolean;
  onSelect: (v: Victim) => void;
  onDisconnect: (v: Victim) => void;
}

function getField(info: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (info[key]) return info[key];
  }
  return "";
}

function getRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function VictimCard({ victim, selected, onSelect, onDisconnect }: VictimCardProps) {
  const styles = useStyles();

  const ip = victim.id.split(":")[0];
  const hostname = getField(victim.info, "hostname", "host") || ip;
  const username = getField(victim.info, "username", "user");
  const os = getField(victim.info, "os", "platform", "system");
  const arch = getField(victim.info, "architecture", "arch");
  const osLabel = [os, arch].filter(Boolean).join(" / ");

  return (
    <Card
      className={mergeClasses(styles.card, selected && styles.selected)}
      onClick={() => onSelect(victim)}
    >
      {/* Top row: icon + title + status + disconnect */}
      <div className={styles.top}>
        <div className={styles.topLeft}>
          <DesktopRegular
            fontSize={20}
            color={selected ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground2}
          />
          <div className={styles.titleBlock}>
            <Tooltip content={hostname} relationship="label">
              <Text className={styles.hostname}>{hostname}</Text>
            </Tooltip>
            <Tooltip content={victim.id} relationship="label">
              <Text className={styles.sessionId}>{victim.id}</Text>
            </Tooltip>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          <Badge size="extra-small" color="success" shape="circular" />
          <Button
            appearance="subtle"
            size="small"
            icon={<PlugDisconnectedRegular />}
            title="Disconnect"
            onClick={(e) => {
              e.stopPropagation();
              onDisconnect(victim);
            }}
          />
        </div>
      </div>

      {/* Info rows */}
      {(username || ip || osLabel) && (
        <>
          <Divider style={{ margin: "8px 0 0" }} />
          <div className={styles.infoRows}>
            {username && (
              <div className={styles.infoRow}>
                <PersonRegular fontSize={12} />
                <Text className={styles.infoValue}>{username}</Text>
              </div>
            )}
            {ip && (
              <div className={styles.infoRow}>
                <GlobeRegular fontSize={12} />
                <Text className={styles.infoValue}>{ip}</Text>
              </div>
            )}
            {osLabel && (
              <div className={styles.infoRow}>
                <InfoRegular fontSize={12} />
                <Text className={styles.infoValue}>{osLabel}</Text>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer: last seen */}
      <div className={styles.footer}>
        <Text className={styles.lastSeen}>{getRelativeTime(victim.lastSeen)}</Text>
      </div>
    </Card>
  );
}
