import { C } from "../../data/constants";

/**
 * Поле ввода: опционально `sanitize(value)` при изменении и `maxLength`.
 * Пробрасывает остальные атрибуты на `<input>` (pattern, inputMode, autoComplete, …).
 */
export default function FI({
  value,
  onChange,
  placeholder,
  type = "text",
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
    <input
      type={type}
      value={value}
      maxLength={maxLength ?? undefined}
      onChange={handle}
      placeholder={placeholder || ""}
      title={title}
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
      {...rest}
    />
  );
}
