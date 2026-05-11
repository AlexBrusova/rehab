export default function CT({ icon, bg, children, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
        fontWeight: 800,
        fontSize: 13,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: bg || "#e8f0fb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <span style={{ flex: 1 }}>{children}</span>
      {right}
    </div>
  );
}
