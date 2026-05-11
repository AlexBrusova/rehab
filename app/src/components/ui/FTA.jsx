import { C } from "../../data/constants";

export default function FTA({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || ""}
      rows={rows}
      style={{
        width: "100%",
        padding: "9px 12px",
        border: `1.5px solid ${C.border}`,
        borderRadius: 8,
        fontSize: 13,
        fontFamily: "inherit",
        direction: "ltr",
        resize: "vertical",
        boxSizing: "border-box",
      }}
    />
  );
}
