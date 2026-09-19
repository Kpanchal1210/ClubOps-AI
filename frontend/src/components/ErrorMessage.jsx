import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorMessage({
  title = "Unable to load data",
  message = "Something went wrong while communicating with the server.",
  onRetry,
}) {
  return (
    <div
      style={{
        padding: "20px 24px",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-danger-bg)",
        border: "1px solid var(--color-danger-border)",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        margin: "16px 0",
      }}
      role="alert"
    >
      <AlertCircle
        size={20}
        style={{ color: "var(--color-danger-text)", flexShrink: 0, marginTop: 2 }}
      />
      <div style={{ flex: 1 }}>
        <h4
          style={{
            margin: "0 0 4px",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--color-danger-text)",
          }}
        >
          {title}
        </h4>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--color-danger-text)",
            lineHeight: 1.45,
          }}
        >
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "var(--bg-surface)",
              border: "1px solid var(--color-danger-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--color-danger-text)",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={13} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

