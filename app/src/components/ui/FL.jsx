import { C } from "../../data/constants";

export default function FL({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.soft,
          display: "block",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
