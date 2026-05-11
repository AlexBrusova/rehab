import { C } from "../../data/constants";

export default function Td({ children, style }) {
  return (
    <td
      style={{
        padding: "10px 12px",
        borderBottom: `1px solid ${C.border}`,
        verticalAlign: "middle",
        ...style,
      }}
    >
      {children}
    </td>
  );
}
