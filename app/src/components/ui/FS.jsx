import { C } from "../../data/constants";

export default function FS({ value, onChange, options, dir = "ltr" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      dir={dir}
      style={{
        width: "100%",
        padding: "9px 12px",
        border: `1.5px solid ${C.border}`,
        borderRadius: 8,
        fontSize: 13,
        fontFamily: "inherit",
      }}
    >
      {options.map((o) => (
        <option key={o.v || o} value={o.v || o}>
          {o.l || o}
        </option>
      ))}
    </select>
  );
}
