import { C } from "../../data/constants";

export default function Modal({ onClose, title, children, width = 420 }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          width,
          maxWidth: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 17,
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {title}
          <span
            onClick={onClose}
            style={{ cursor: "pointer", color: C.soft, fontSize: 20, lineHeight: 1 }}
          >
            ✕
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
