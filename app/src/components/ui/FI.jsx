import { useState } from "react";
import { C, BADGE_STYLES } from "../../data/constants";

/**
 * Controlled text input. Optional props:
 *   validate(v) → string|null  — null = valid, string = error message shown after blur
 *   hint: string               — shown in blue while field is focused
 * Without validate/hint, behaves exactly as before (backwards compatible).
 */
export default function FI({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  sanitize,
  validate,
  hint,
  title,
  ...rest
}) {
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(null);

  const handle = (e) => {
    let v = e.target.value;
    if (sanitize) v = sanitize(v);
    if (maxLength != null) v = String(v).slice(0, maxLength);
    onChange(v);
    if (touched && validate) setError(validate(v));
  };

  const handleFocus = () => setFocused(true);

  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
    if (validate) setError(validate(value));
  };

  const hasValidation = !!validate;
  const hasHints = hasValidation || !!hint;
  const borderColor = hasValidation && touched
    ? error ? C.red : C.green
    : (hasHints && focused) ? C.blue : C.border;
  const background = hasValidation && touched
    ? error ? BADGE_STYLES.red.bg : BADGE_STYLES.green.bg
    : "#fff";

  return (
    <div>
      <input
        type={type}
        value={value}
        maxLength={maxLength ?? undefined}
        onChange={handle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || ""}
        title={title}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: `1.5px solid ${borderColor}`,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "inherit",
          direction: "ltr",
          boxSizing: "border-box",
          background,
          transition: "border-color 0.15s, background 0.15s",
        }}
        {...rest}
      />
      {hasValidation && (touched || focused) && (
        <div
          style={{
            fontSize: 11,
            marginTop: 3,
            color: touched && error ? C.red : C.blue,
            minHeight: 16,
          }}
        >
          {touched && error ? `⚠ ${error}` : focused && hint ? hint : null}
        </div>
      )}
    </div>
  );
}
