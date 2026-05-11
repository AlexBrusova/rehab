import { C } from "../../data/constants";

export default function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        padding: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
