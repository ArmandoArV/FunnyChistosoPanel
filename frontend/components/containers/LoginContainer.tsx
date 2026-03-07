"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Text,
  Card,
  makeStyles,
  tokens,
  Spinner,
} from "@fluentui/react-components";
import { LockClosedRegular } from "@fluentui/react-icons";
import { useAuth } from "@/lib/auth";

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: {
    width: "400px",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  icon: {
    fontSize: "48px",
    color: tokens.colorBrandForeground1,
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
  },
});

export function LoginContainer() {
  const styles = useStyles();
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <LockClosedRegular className={styles.icon} />
          <Text className={styles.title}>C2 Control Panel</Text>
          <Text className={styles.subtitle}>Sign in to continue</Text>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          {error && <Text className={styles.error}>{error}</Text>}
          <Button
            appearance="primary"
            type="submit"
            disabled={loading}
            icon={loading ? <Spinner size="tiny" /> : undefined}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
