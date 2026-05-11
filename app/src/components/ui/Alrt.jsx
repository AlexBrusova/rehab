export default function Alrt({ type, icon, children }) {
  const s = {
    orange: { bg: "#fff5e8", b: "#f5c07a", c: "#8b4800" },
    red: { bg: "#fce8e8", b: "#f0a8a8", c: "#7b0000" },
    teal: { bg: "#e3f7f8", b: "#7dd4d7", c: "#054548" },
    purple: { bg: "#f0e8fb", b: "#c9a8f0", c: "#3d1a6b" },
  }[type];
  return (
    <div
      style={{
        background: s.bg,
        border: `1px solid ${s.b}`,
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        gap: 9,
        fontSize: 13,
        fontWeight: 500,
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div style={{ color: s.c }}>{children}</div>
    </div>
  );
}
