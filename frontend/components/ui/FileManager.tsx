"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Text,
  Spinner,
  Badge,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  FolderRegular,
  DocumentRegular,
  ArrowUpRegular,
  ArrowSyncRegular,
  ArrowDownloadRegular,
  FolderOpenRegular,
  SearchRegular,
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
    flexWrap: "wrap",
  },
  breadcrumbs: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    flex: 1,
    minWidth: "200px",
    overflow: "hidden",
  },
  breadcrumb: {
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
    color: tokens.colorBrandForeground1,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  breadcrumbSep: {
    color: tokens.colorNeutralForeground4,
    fontSize: "12px",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 100px 160px 80px",
    padding: "8px 14px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
    gap: "8px",
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr 70px 60px",
    },
  },
  headerCell: {
    fontSize: "11px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  list: {
    flex: 1,
    overflowY: "auto",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 100px 160px 80px",
    padding: "6px 14px",
    gap: "8px",
    alignItems: "center",
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr 70px 60px",
    },
  },
  fileName: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    overflow: "hidden",
  },
  nameText: {
    fontSize: "13px",
    fontFamily: "monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cellText: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
    fontFamily: "monospace",
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

interface FileEntry {
  name: string;
  is_dir: boolean;
  size: number;
  mod_time: string;
}

interface FileBrowseData {
  path: string;
  count: number;
  files: FileEntry[];
}

interface FileManagerProps {
  data: FileBrowseData | null;
  loading: boolean;
  onNavigate: (path: string) => void;
  onDownload: (path: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function getParentPath(path: string): string {
  const sep = path.includes("\\") ? "\\" : "/";
  const parts = path.split(sep).filter(Boolean);
  if (parts.length <= 1) {
    return path.includes("\\") ? parts[0] + "\\" : "/";
  }
  const parent = parts.slice(0, -1).join(sep);
  return path.startsWith("/") ? "/" + parent : parent;
}

function splitPath(path: string): { parts: string[]; sep: string } {
  const sep = path.includes("\\") ? "\\" : "/";
  const parts = path.split(sep).filter(Boolean);
  return { parts, sep };
}

export function FileManager({ data, loading, onNavigate, onDownload }: FileManagerProps) {
  const styles = useStyles();
  const [search, setSearch] = useState("");

  const currentPath = data?.path ?? "";
  const { parts, sep } = splitPath(currentPath);

  const filtered = (data?.files ?? []).filter(
    (f) => !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  function handleBreadcrumb(index: number) {
    const target = (currentPath.startsWith("/") ? "/" : "") + parts.slice(0, index + 1).join(sep);
    onNavigate(target.endsWith(sep) ? target : target + (sep === "\\" ? "\\" : ""));
  }

  function handleRowClick(file: FileEntry) {
    if (file.is_dir) {
      onNavigate(currentPath + (currentPath.endsWith(sep) ? "" : sep) + file.name);
    }
  }

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Button
          appearance="subtle"
          size="small"
          icon={<ArrowUpRegular />}
          onClick={() => onNavigate(getParentPath(currentPath))}
          title="Parent directory"
          disabled={loading}
        />
        <Button
          appearance="subtle"
          size="small"
          icon={<ArrowSyncRegular />}
          onClick={() => onNavigate(currentPath)}
          title="Refresh"
          disabled={loading}
        />
        <div className={styles.breadcrumbs}>
          <FolderOpenRegular fontSize={14} color={tokens.colorBrandForeground1} />
          {parts.map((part, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center" }}>
              <span className={styles.breadcrumbSep}>{sep}</span>
              <span className={styles.breadcrumb} onClick={() => handleBreadcrumb(i)}>
                {part}
              </span>
            </span>
          ))}
        </div>
        {loading && <Spinner size="tiny" />}
        <Input
          size="small"
          placeholder="Filter…"
          contentBefore={<SearchRegular fontSize={12} />}
          value={search}
          onChange={(_, d) => setSearch(d.value)}
          style={{ width: "140px" }}
        />
      </div>

      {/* Column headers */}
      <div className={styles.tableHeader}>
        <Text className={styles.headerCell}>Name</Text>
        <Text className={styles.headerCell}>Size</Text>
        <Text className={`${styles.headerCell} ${styles.hideOnMobile}`}>Modified</Text>
        <Text className={styles.headerCell}>Action</Text>
      </div>

      {/* File list */}
      <div className={styles.list}>
        {!data && !loading ? (
          <div className={styles.empty}>
            <FolderRegular fontSize={40} />
            <Text size={300}>Click refresh or navigate to load files</Text>
          </div>
        ) : sorted.length === 0 && !loading ? (
          <div className={styles.empty}>
            <Text size={200}>{search ? "No files match filter" : "Empty directory"}</Text>
          </div>
        ) : (
          sorted.map((file, i) => (
            <div key={i} className={styles.row} onClick={() => handleRowClick(file)}>
              <div className={styles.fileName}>
                {file.is_dir ? (
                  <FolderRegular fontSize={16} color="#FFB74D" />
                ) : (
                  <DocumentRegular fontSize={16} color={tokens.colorNeutralForeground3} />
                )}
                <Text className={styles.nameText}>{file.name}</Text>
              </div>
              <Text className={styles.cellText}>{file.is_dir ? "—" : formatSize(file.size)}</Text>
              <Text className={`${styles.cellText} ${styles.hideOnMobile}`}>{formatDate(file.mod_time)}</Text>
              <div>
                {!file.is_dir && (
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowDownloadRegular fontSize={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(currentPath + (currentPath.endsWith(sep) ? "" : sep) + file.name);
                    }}
                    title="Download"
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>
          {currentPath || "—"}
        </Text>
        {data && (
          <Badge appearance="tint" color="informative" size="small">
            {filtered.length} items
          </Badge>
        )}
      </div>
    </div>
  );
}
