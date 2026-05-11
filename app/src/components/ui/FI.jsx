import { C } from "../../data/constants";

export default function FI({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || ""}
      style={{
        width: "100%",
        padding: "8px 12px",
        border: `1.5px solid ${C.border}`,
        borderRadius: 8,
        fontSize: 13,
        fontFamily: "inherit",
        direction: "ltr",
        boxSizing: "border-box",
      }}
    />
  );
}
