import { useState } from "react";
import { C } from "./data/constants";

export default function Login({
  users,
  onLogin,
}) {
  const [un, setUn] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = () => {
    setLoading(true);
    setErr("");
    setTimeout(() => {
      const u = users.find(
        (u) => u.username === un && u.password === pw && u.active !== false,
      );
      u
        ? onLogin(u)
        : (setErr("Invalid Username or Password"), setLoading(false));
    }, 500);
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
      {" "}
      <div style={{ width: 400, maxWidth: "90vw" }}>
        {" "}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {" "}
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
          </div>{" "}
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: "#fff",
              marginBottom: 4,
            }}
          >
            Rehab Center
          </div>{" "}
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            Internal Management System
          </div>{" "}
        </div>{" "}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
            borderRadius: 20,
            padding: 28,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {" "}
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
          </div>{" "}
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
          </div>{" "}
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
          )}{" "}
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
          </button>{" "}
        </div>{" "}
        <div
          style={{
            marginTop: 14,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 14,
            padding: 13,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {" "}
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              marginBottom: 8,
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            Quick Demo Login (Password: 1234)
          </div>{" "}
          <div
            style={{
              display: "flex",
              gap: 7,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {" "}
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setUn(u.username);
                  setPw(u.password);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {u.roleLabel}: {u.name.split(" ")[0]}
              </button>
            ))}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
