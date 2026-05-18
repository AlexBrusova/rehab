import { Component } from "react";
import PropTypes from "prop-types";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  static propTypes = {
    children: PropTypes.node.isRequired,
    name: PropTypes.string,
    onRetry: PropTypes.func,
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { name = "модуль", onRetry } = this.props;
    return (
      <div
        style={{
          padding: "24px",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          background: "#fef2f2",
          color: "#991b1b",
          margin: "16px",
        }}
      >
        <strong>Ошибка в модуле «{name}»</strong>
        <p style={{ marginTop: "8px", fontSize: "14px" }}>
          {this.state.error?.message || "Непредвиденная ошибка"}
        </p>
        {onRetry && (
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              onRetry();
            }}
            style={{
              marginTop: "12px",
              padding: "6px 14px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Повторить
          </button>
        )}
      </div>
    );
  }
}
