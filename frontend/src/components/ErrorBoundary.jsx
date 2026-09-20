import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem("eventId");
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#080808",
            color: "#ffffff",
            padding: "24px",
            fontFamily: "var(--font-sans, sans-serif)",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              background: "#111111",
              border: "1px solid #333333",
              padding: "36px",
              boxShadow: "8px 8px 0px #ff2948",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 10px",
                background: "rgba(255, 41, 72, 0.15)",
                color: "#ff2948",
                border: "1px solid #ff2948",
                fontSize: "11px",
                fontWeight: 800,
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.08em",
                marginBottom: "20px",
                textTransform: "uppercase",
              }}
            >
              <AlertCircle size={14} />
              SYSTEM RECOVERY ACTIVE
            </div>

            <h1
              style={{
                fontSize: "22px",
                fontWeight: 800,
                margin: "0 0 12px",
                letterSpacing: "-0.02em",
                color: "#ffffff",
              }}
            >
              Workspace View Interrupted
            </h1>

            <p
              style={{
                fontSize: "13.5px",
                color: "#a3a3a3",
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              An unexpected render issue occurred while loading this view. Your data is safe.
              You can instantly reload the workspace or reset the operational state.
            </p>

            {this.state.error?.message && (
              <pre
                style={{
                  background: "#000000",
                  border: "1px solid #222222",
                  padding: "12px",
                  fontSize: "11.5px",
                  color: "#ff8090",
                  fontFamily: "var(--font-mono, monospace)",
                  overflowX: "auto",
                  margin: "0 0 24px",
                }}
              >
                {this.state.error.message}
              </pre>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  background: "#ff2948",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "12px",
                  fontFamily: "var(--font-mono, monospace)",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                <RefreshCw size={14} />
                RELOAD DASHBOARD
              </button>

              <button
                onClick={() => {
                  window.location.href = "/login";
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  background: "transparent",
                  color: "#e5e5e5",
                  border: "1px solid #333333",
                  fontWeight: 700,
                  fontSize: "12px",
                  fontFamily: "var(--font-mono, monospace)",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                <Home size={14} />
                SIGN IN SCREEN
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
