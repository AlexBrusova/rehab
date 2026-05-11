import { BADGE_STYLES } from "../../data/constants";

export default function Badge({ type, children, style }) {
  const s = BADGE_STYLES[type] || BADGE_STYLES.gray;
  return (
    <span
      style={{
        background: s.bg,
        color: s.c,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
        display: "inline-block",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
