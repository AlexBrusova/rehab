import { C } from "../../data/constants";
import useBreakpoint from "../../hooks/useBreakpoint";

export default function Modal({ onClose, title, children, width = 420 }) {
  const { isMobile } = useBreakpoint();
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          background: "#fff",
          borderRadius: isMobile ? "16px 16px 0 0" : 16,
          padding: isMobile ? "20px 16px" : 28,
          width: isMobile ? "100%" : width,
          maxWidth: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          maxHeight: isMobile ? "90vh" : "85vh",
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
