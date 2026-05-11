import { C } from "../../data/constants";

export default function Stat({ label, value, sub, icon, accent }) {
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        padding: "16px 18px",
        position: "relative",
        overflow: "hidden",
        borderRight: `4px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: 11, color: C.soft, fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: C.text, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.soft, marginTop: 3 }}>{sub}</div>
      )}
      <div
        style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 26,
          opacity: 0.1,
        }}
      >
        {icon}
      </div>
    </div>
  );
}
