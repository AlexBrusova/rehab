import { C } from "../../data/constants";

export default function Th({ children }) {
  return (
    <th
      style={{
        padding: "8px 12px",
        background: "#f7f9fc",
        fontSize: 11,
        fontWeight: 700,
        color: C.mid,
        textAlign: "right",
        borderBottom: `2px solid ${C.border}`,
      }}
    >
      {children}
    </th>
  );
}
