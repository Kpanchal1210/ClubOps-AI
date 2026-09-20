import {
  ShieldAlert,
  Sparkles,
  User,
  Activity,
  CheckCircle2,
  ArrowRight,
  Edit2,
} from "lucide-react";

export default function RiskCard({
  risk,
  onEdit,
  onResolve,
}) {
  const isAI = risk.detectedBy === "ai" || risk.detectedBy === "AI";
  const assignedName = typeof risk.assignedTo === "object" ? risk.assignedTo?.name : risk.assignedTo;
  const isResolved = risk.status === "resolved";

  return (
    <div
      className="risk-card"
      style={{
        opacity: isResolved ? 0.75 : 1,
        background: isResolved ? "var(--bg-canvas)" : "var(--bg-surface)",
      }}
    >
      <div className="card-top">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span className={`badge ${risk.severity || "medium"}`}>
              {risk.severity || "medium"}
            </span>
            <span className={`badge ${risk.status || "open"}`}>
              {risk.status || "open"}
            </span>
            {isAI && (
              <span className="badge ai-badge" title="Automatically detected by AI">
                <Sparkles size={11} />
                AI Detected
              </span>
            )}
          </div>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldAlert size={16} style={{ color: "var(--color-slate-500)", flexShrink: 0 }} />
            {risk.title}
          </h3>
        </div>
      </div>

      <p className="card-description">
        {risk.description || "No description provided."}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          padding: "10px 12px",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          fontSize: 12.5,
          margin: "8px 0 14px",
        }}
      >
        <div>
          <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11 }}>Probability</span>
          <strong style={{ textTransform: "capitalize", color: "var(--text-primary)" }}>
            {risk.probability || "Medium"}
          </strong>
        </div>
        <div>
          <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11 }}>Assigned Lead</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <div className="user-avatar user-avatar-sm" style={{ width: 18, height: 18, fontSize: 9 }}>
              {assignedName ? assignedName[0].toUpperCase() : "?"}
            </div>
            <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
              {assignedName || "Unassigned"}
            </span>
          </div>
        </div>
      </div>

      {risk.recommendedAction && (
        <div
          style={{
            padding: "10px 12px",
            background: "var(--color-primary-light)",
            border: "1px solid var(--color-primary-border)",
            borderRadius: "var(--radius-md)",
            fontSize: 12.5,
            lineHeight: 1.45,
            color: "var(--text-primary)",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--color-primary)", fontWeight: 600, fontSize: 11.5, marginBottom: 4 }}>
            <ArrowRight size={12} />
            RECOMMENDED ACTION
          </div>
          <p style={{ margin: 0 }}>{risk.recommendedAction}</p>
        </div>
      )}

      {(onEdit || onResolve) && (
        <div className="card-actions">
          {onResolve && !isResolved && (
            <button
              className="secondary-button button-sm"
              onClick={() => onResolve(risk._id || risk.id)}
            >
              <CheckCircle2 size={13} style={{ color: "var(--color-success)" }} />
              Resolve Risk
            </button>
          )}

          {onEdit && (
            <button
              className="ghost-button button-sm"
              style={{ marginLeft: "auto" }}
              onClick={() => onEdit(risk)}
            >
              <Edit2 size={13} />
              Update
            </button>
          )}
        </div>
      )}
    </div>
  );
}