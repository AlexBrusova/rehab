import { C } from "../../data/constants";

export default function Btn({ onClick, color = "blue", size = "md", children, style, disabled }) {
  const bg = {
    blue: C.blue,
    teal: C.teal,
    red: C.red,
    orange: C.orange,
    purple: C.purple,
    green: C.green,
    outline: "transparent",
  }[color];
  const col = { outline: C.mid }[color] || "#fff";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#ccc" : bg,
        color: disabled ? "#888" : col,
        border: color === "outline" ? `1.5px solid ${C.border}` : "none",
        padding: size === "sm" ? "5px 11px" : "8px 16px",
        borderRadius: 8,
        fontSize: size === "sm" ? 12 : 13,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
