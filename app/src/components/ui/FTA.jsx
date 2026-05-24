import PropTypes from "prop-types";
import { C } from "../../data/constants";

export default function FTA({
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  sanitize,
  title,
  dir = "ltr",
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
      dir={dir}
      style={{
        width: "100%",
        padding: "9px 12px",
        border: `1.5px solid ${C.border}`,
        borderRadius: 8,
        fontSize: 13,
        fontFamily: "inherit",
        resize: "vertical",
        boxSizing: "border-box",
      }}
      {...rest}
    />
  );
}

FTA.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  sanitize: PropTypes.func,
  title: PropTypes.string,
  dir: PropTypes.string,
};
