import { useState } from "react";
import { C } from "./data/constants";
import { login } from "./lib/api";

export default function Login({ onLogin }) {
  const [un, setUn] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!un || !pw) return;
    setLoading(true);
    setErr("");
    try {
      const { token, user } = await login(un, pw);
      onLogin(user, token);
    } catch {
      setErr("Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg,${C.navy} 0%,${C.navyMid} 60%,#0d4a6e 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Heebo','Segoe UI',sans-serif",
        direction: "ltr",
      }}
    >
      <div style={{ width: 400, maxWidth: "90vw" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 68,
              height: 68,
              background: `linear-gradient(135deg,${C.teal},${C.blueLt})`,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              margin: "0 auto 12px",
              boxShadow: "0 8px 32px rgba(13,115,119,0.4)",
            }}
          >
            🏥
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
            Rehab Center
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            Internal Management System
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
            borderRadius: 20,
            padding: 28,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.55)",
                marginBottom: 4,
              }}
            >
              Username
            </label>
            <input
              value={un}
              onChange={(e) => setUn(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handle()}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1.5px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: 13,
                fontFamily: "inherit",
                direction: "ltr",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.55)",
                marginBottom: 4,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handle()}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1.5px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: 13,
                fontFamily: "inherit",
                direction: "ltr",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          {err && (
            <div
              style={{
                background: "rgba(192,57,43,0.2)",
                border: "1px solid rgba(192,57,43,0.4)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                color: "#ff8a80",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {err}
            </div>
          )}
          <button
            onClick={handle}
            disabled={loading}
            style={{
              width: "100%",
              padding: 11,
              borderRadius: 10,
              background: loading
                ? "rgba(45,125,210,0.4)"
                : `linear-gradient(135deg,${C.teal},${C.blueLt})`,
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Connecting..." : "Login to System"}
          </button>
        </div>
      </div>
    </div>
  );
}
