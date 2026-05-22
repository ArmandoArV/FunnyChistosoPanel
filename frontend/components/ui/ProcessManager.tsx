"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Text,
  Spinner,
  Badge,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowSyncRegular,
  DismissCircleRegular,
  SearchRegular,
  ArrowSortDownRegular,
  ArrowSortUpRegular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "8px",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "80px 1fr 120px 120px 60px",
    padding: "8px 14px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
    gap: "8px",
    "@media (max-width: 768px)": {
      gridTemplateColumns: "60px 1fr 80px 50px",
    },
  },
  headerCell: {
    fontSize: "11px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    userSelect: "none",
    ":hover": {
      color: tokens.colorNeutralForeground1,
    },
  },
  list: {
    flex: 1,
    overflowY: "auto",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "80px 1fr 120px 120px 60px",
    padding: "5px 14px",
    gap: "8px",
    alignItems: "center",
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    "@media (max-width: 768px)": {
      gridTemplateColumns: "60px 1fr 80px 50px",
    },
  },
  cellText: {
    fontSize: "12px",
    fontFamily: "monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cellPid: {
    fontSize: "12px",
    fontFamily: "monospace",
    color: tokens.colorBrandForeground1,
  },
  hideOnMobile: {
    "@media (max-width: 768px)": {
      display: "none",
    },
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
  statusBar: {
    padding: "6px 14px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

interface ProcessEntry {
  pid: number;
  name: string;
  user?: string;
  memory?: string;
}

interface ProcessData {
  platform: string;
  count: number;
  processes: ProcessEntry[];
}

interface ProcessManagerProps {
  data: ProcessData | null;
  loading: boolean;
  onRefresh: () => void;
  onKill: (pid: number) => void;
}

type SortKey = "pid" | "name" | "user" | "memory";
type SortDir = "asc" | "desc";

export function ProcessManager({ data, loading, onRefresh, onKill }: ProcessManagerProps) {
  const styles = useStyles();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("pid");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [killTarget, setKillTarget] = useState<ProcessEntry | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ArrowSortUpRegular fontSize={10} /> : <ArrowSortDownRegular fontSize={10} />;
  };

  const filtered = (data?.processes ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      String(p.pid).includes(q) ||
      (p.user ?? "").toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "pid":
        cmp = a.pid - b.pid;
        break;
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "user":
        cmp = (a.user ?? "").localeCompare(b.user ?? "");
        break;
      case "memory":
        cmp = (a.memory ?? "").localeCompare(b.memory ?? "");
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Button
          appearance="subtle"
          size="small"
          icon={<ArrowSyncRegular />}
          onClick={onRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
        {loading && <Spinner size="tiny" />}
        <div style={{ flex: 1 }} />
        <Input
          size="small"
          placeholder="Search processes…"
          contentBefore={<SearchRegular fontSize={12} />}
          value={search}
          onChange={(_, d) => setSearch(d.value)}
          style={{ width: "200px" }}
        />
        {data && (
          <Badge appearance="tint" color="informative" size="small">
            {data.platform}
          </Badge>
        )}
      </div>

      {/* Column headers */}
      <div className={styles.tableHeader}>
        <Text className={styles.headerCell} onClick={() => toggleSort("pid")}>
          PID <SortIcon col="pid" />
        </Text>
        <Text className={styles.headerCell} onClick={() => toggleSort("name")}>
          Name <SortIcon col="name" />
        </Text>
        <Text className={`${styles.headerCell} ${styles.hideOnMobile}`} onClick={() => toggleSort("user")}>
          User <SortIcon col="user" />
        </Text>
        <Text className={styles.headerCell} onClick={() => toggleSort("memory")}>
          Memory <SortIcon col="memory" />
        </Text>
        <Text className={styles.headerCell}>Kill</Text>
      </div>

      {/* Process list */}
      <div className={styles.list}>
        {!data && !loading ? (
          <div className={styles.empty}>
            <Text size={300}>Click Refresh to load processes</Text>
          </div>
        ) : sorted.length === 0 && !loading ? (
          <div className={styles.empty}>
            <Text size={200}>{search ? "No processes match" : "No processes"}</Text>
          </div>
        ) : (
          sorted.map((proc, i) => (
            <div key={`${proc.pid}-${i}`} className={styles.row}>
              <Text className={styles.cellPid}>{proc.pid}</Text>
              <Text className={styles.cellText}>{proc.name}</Text>
              <Text className={`${styles.cellText} ${styles.hideOnMobile}`}>{proc.user ?? "—"}</Text>
              <Text className={styles.cellText}>{proc.memory ?? "—"}</Text>
              <Button
                appearance="subtle"
                size="small"
                icon={<DismissCircleRegular fontSize={14} color={tokens.colorPaletteRedForeground1} />}
                onClick={() => setKillTarget(proc)}
                title={`Kill PID ${proc.pid}`}
              />
            </div>
          ))
        )}
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>
          {filtered.length} processes shown
        </Text>
      </div>

      {/* Kill confirmation dialog */}
      <Dialog open={!!killTarget} onOpenChange={(_, d) => !d.open && setKillTarget(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Kill Process?</DialogTitle>
            <DialogContent>
              <Text>
                Terminate <strong>{killTarget?.name}</strong> (PID {killTarget?.pid})?
                This cannot be undone.
              </Text>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                style={{ backgroundColor: tokens.colorPaletteRedBackground3 }}
                onClick={() => {
                  if (killTarget) onKill(killTarget.pid);
                  setKillTarget(null);
                }}
              >
                Kill Process
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
