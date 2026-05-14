import { C } from "../../data/constants";

export default function FTA({
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  sanitize,
  title,
  ...rest
}) {
  const handle = (e) => {
    let v = e.target.value;
    if (sanitize) v = sanitize(v);
    if (maxLength != null) v = String(v).slice(0, maxLength);
    onChange(v);
  };
  return (
    <textarea
      value={value}
      maxLength={maxLength ?? undefined}
      onChange={handle}
      placeholder={placeholder || ""}
      rows={rows}
      title={title}
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
      {...rest}
    />
  );
}
