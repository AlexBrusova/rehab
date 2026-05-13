import { C } from "../../data/constants";

export default function Toast({ msg }) {
  return msg ? (
    <div
      data-testid="toast"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: C.navy,
        color: "#fff",
        padding: "11px 20px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 9999,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        pointerEvents: "none",
      }}
    >
      {msg}
    </div>
  ) : null;
}
