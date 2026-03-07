"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  Input,
  Button,
  Text,
  Badge,
  Tooltip,
  ToolbarButton,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  CodeBlockRegular,
  DeleteRegular,
  SendRegular,
  PersonRegular,
  GlobeRegular,
} from "@fluentui/react-icons";
import type { Victim } from "@/lib/types";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  output: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px",
    fontFamily: "'Cascadia Code', 'Consolas', 'Courier New', monospace",
    fontSize: "13px",
    lineHeight: "1.6",
    backgroundColor: "#0c0c0c",
    margin: "0 16px",
    borderRadius: "4px",
    minHeight: 0,
  },
  lineDefault: { color: "#00e676", whiteSpace: "pre-wrap", wordBreak: "break-all" },
  lineCommand: { color: "#80d8ff", whiteSpace: "pre-wrap", fontWeight: "600" },
  lineError: { color: "#ff5252", whiteSpace: "pre-wrap" },
  lineSystem: { color: "#9e9e9e", whiteSpace: "pre-wrap", fontStyle: "italic" },
  inputRow: {
    display: "flex",
    gap: "8px",
    padding: "12px 16px 16px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontFamily: "monospace",
  },
  prompt: {
    color: tokens.colorNeutralForeground3,
    fontFamily: "monospace",
  },
  headerMeta: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: tokens.colorNeutralForeground3,
  },
});

interface TerminalProps {
  victim: Victim;
  output: string[];
  onCommand: (cmd: string) => void;
  onClear: () => void;
}

export function Terminal({ victim, output, onCommand, onClear }: TerminalProps) {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const styles = useStyles();

  const ip = victim.id.split(":")[0];
  const hostname = victim.info.hostname || victim.info.host || ip;
  const username = victim.info.username || victim.info.user || "";

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  function submit() {
    const cmd = command.trim();
    if (!cmd) return;
    setHistory((h) => [cmd, ...h.slice(0, 49)]);
    setHistIdx(-1);
    onCommand(cmd);
    setCommand("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setCommand(history[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setCommand(next === -1 ? "" : history[next]);
    }
  }

  function lineClass(line: string) {
    if (line.startsWith("$ ")) return styles.lineCommand;
    if (line.startsWith("[error]") || line.startsWith("[!]")) return styles.lineError;
    if (line.startsWith("[+]")) return styles.lineSystem;
    return styles.lineDefault;
  }

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<CodeBlockRegular fontSize={20} color={tokens.colorBrandForeground1} />}
        header={
          <div className={styles.headerMeta}>
            <Tooltip content={victim.id} relationship="label">
              <Text weight="semibold" style={{ fontFamily: "monospace", fontSize: "13px" }}>
                {hostname}
              </Text>
            </Tooltip>
            {username && (
              <div className={styles.metaItem}>
                <PersonRegular fontSize={12} />
                <Text size={100}>{username}</Text>
              </div>
            )}
            <div className={styles.metaItem}>
              <GlobeRegular fontSize={12} />
              <Text size={100}>{ip}</Text>
            </div>
            {output.length > 0 && (
              <Badge appearance="tint" color="informative" size="small">
                {output.length} lines
              </Badge>
            )}
          </div>
        }
        action={
          <ToolbarButton
            icon={<DeleteRegular />}
            onClick={onClear}
            title="Clear terminal"
          />
        }
      />

      <div ref={outputRef} className={styles.output}>
        {output.length === 0 ? (
          <span style={{ color: "#555" }}>Session opened. Type a command below.</span>
        ) : (
          output.map((line, i) => (
            <div key={i} className={lineClass(line)}>
              {line}
            </div>
          ))
        )}
      </div>

      <div className={styles.inputRow}>
        <Input
          className={styles.input}
          value={command}
          onChange={(_, d) => setCommand(d.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command…  (↑↓ history)"
          contentBefore={<Text className={styles.prompt}>$</Text>}
        />
        <Button
          appearance="primary"
          icon={<SendRegular />}
          onClick={submit}
          disabled={!command.trim()}
        >
          Send
        </Button>
      </div>
    </Card>
  );
}
