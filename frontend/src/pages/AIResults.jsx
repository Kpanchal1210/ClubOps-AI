import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  CalendarDays,
  User,
  CheckSquare,
  FileText,
  ArrowRight,
  RefreshCw,
  Plus,
  Share2,
  Check,
} from "lucide-react";

import { mockAIResult } from "../mockData";
import { safeStorage } from "../utils/storage";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function AIResults() {
  const navigate = useNavigate();
  // Initialize synchronously with stored result or mockAIResult so it never mounts to null/empty
  const [result, setResult] = useState(() => safeStorage.getJSON("aiResult", mockAIResult));
  const [addedTasks, setAddedTasks] = useState({});
  const [addedRisks, setAddedRisks] = useState({});

  useEffect(() => {
    const saved = safeStorage.getJSON("aiResult");
    if (saved) {
      setResult(saved);
    } else if (DEV_MODE) {
      setResult(mockAIResult);
    }
  }, []);

  const handleAddTaskToRegister = (idx, task) => {
    setAddedTasks((prev) => ({ ...prev, [idx]: true }));
  };

  const handleAddRiskToRegister = (idx, risk) => {
    setAddedRisks((prev) => ({ ...prev, [idx]: true }));
  };

  if (!result) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span className="status-pulse" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Intelligence Engine
              </span>
            </div>
            <h1>AI Meeting Analysis</h1>
            <p>Structured operational assets extracted from meeting recordings and transcripts.</p>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-state-icon">
            <Sparkles size={24} />
          </div>
          <h3>No AI Analysis Result Available</h3>
          <p>Process a meeting transcript in the Meetings tab to let AI extract tasks, risks, and decisions.</p>
          <Link to="/meetings" className="primary-button">
            Go to Meetings
          </Link>
        </div>
      </div>
    );
  }

  const data = result?.analysis || result?.data || result;

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className="status-pulse" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ai-text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              AI Intelligence Pipeline
            </span>
          </div>
          <h1>AI Meeting Analysis</h1>
          <p>Automated breakdown separating conversational understanding from generated system records.</p>
        </div>

        <div className="page-header-actions">
          <Link to="/meetings" className="secondary-button">
            <RefreshCw size={14} />
            <span>Process Another Meeting</span>
          </Link>

          {!DEV_MODE && (
            <button
              className="ghost-button"
              onClick={() => {
                safeStorage.removeItem("aiResult");
                setResult(null);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── SECTION 1: WHAT AI UNDERSTOOD ── */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
            paddingBottom: 8,
            borderBottom: "2px solid var(--color-primary-border)",
          }}
        >
          <Sparkles size={18} style={{ color: "var(--color-primary)" }} />
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-primary)" }}>
            What AI Understood
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
          {/* Executive Summary */}
          <div
            style={{
              padding: "22px 24px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>
              <FileText size={14} />
              Executive AI Summary
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--text-primary)", margin: 0 }}>
              {data?.summary || "Discussion covered venue logistics, speaker confirmations, and volunteer schedules."}
            </p>
          </div>

          {/* Ratified Decisions */}
          <div
            style={{
              padding: "22px 24px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-success-text)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", marginBottom: 10 }}>
              <CheckCircle2 size={15} style={{ color: "var(--color-success)" }} />
              Ratified Decisions
            </div>

            {data?.decisions?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.decisions.map((decision, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: "var(--text-primary)",
                    }}
                  >
                    <span style={{ color: "var(--color-success)", fontWeight: 700, marginTop: 1 }}>✓</span>
                    <span>{decision}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>No definitive decisions recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: WHAT THE SYSTEM CREATED ── */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            paddingBottom: 8,
            borderBottom: "2px solid var(--color-success-border)",
          }}
        >
          <CheckSquare size={18} style={{ color: "var(--color-success)" }} />
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-success-text)" }}>
            What The System Created
          </h2>
        </div>

        {/* Extracted Tasks */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>
              Extracted Actionable Tasks ({data?.tasks?.length || 0})
            </h3>
            <Link to="/tasks" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-primary)" }}>
              View in Task Board →
            </Link>
          </div>

          <div className="card-grid">
            {data?.tasks?.map((task, i) => (
              <div key={i} className="task-card">
                <div className="card-top">
                  <div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      <span className={`badge ${task.priority || "high"}`}>
                        {task.priority || "high"} priority
                      </span>
                      <span className="badge ai-badge">
                        <Sparkles size={11} />
                        Auto-Extracted
                      </span>
                    </div>
                    <h3>{task.title}</h3>
                  </div>
                </div>

                <p className="card-description">
                  {task.description || "Generated from transcript key points."}
                </p>

                <div className="task-meta">
                  <div className="task-meta-row">
                    <span className="task-meta-item">
                      <User size={13} />
                      Lead: <strong>{task.ownerId ? `Assigned (${task.ownerId})` : "Rahul Patel"}</strong>
                    </span>

                    {task.deadline && (
                      <span className="task-meta-item">
                        <CalendarDays size={13} />
                        Due: <strong>{task.deadline}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="secondary-button button-sm"
                    style={{ width: "100%" }}
                    onClick={() => handleAddTaskToRegister(i, task)}
                    disabled={addedTasks[i]}
                  >
                    {addedTasks[i] ? (
                      <>
                        <Check size={13} style={{ color: "var(--color-success)" }} />
                        Synced to Active Tasks
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        Confirm & Save to Tasks
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detected Risks */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>
              Detected Liabilities & Risks ({data?.risks?.length || 0})
            </h3>
            <Link to="/risks" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-primary)" }}>
              View in Risk Register →
            </Link>
          </div>

          <div className="card-grid">
            {data?.risks?.map((risk, i) => (
              <div key={i} className="risk-card">
                <div className="card-top">
                  <div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      <span className={`badge ${risk.severity || "high"}`}>
                        {risk.severity || "high"} severity
                      </span>
                      <span className="badge ai-badge">
                        <ShieldAlert size={11} />
                        AI Flagged
                      </span>
                    </div>
                    <h3>{risk.title}</h3>
                  </div>
                </div>

                <p className="card-description">
                  {risk.description || "Identified from conversation context."}
                </p>

                <div
                  style={{
                    padding: "10px 12px",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    fontSize: 12.5,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "var(--text-muted)" }}>Probability:</span>
                    <strong style={{ textTransform: "capitalize" }}>{risk.probability || "Medium"}</strong>
                  </div>
                  {risk.recommendedAction && (
                    <div>
                      <span style={{ color: "var(--color-primary)", fontWeight: 600, display: "block", fontSize: 11 }}>
                        Recommended Mitigation:
                      </span>
                      <span>{risk.recommendedAction}</span>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    className="secondary-button button-sm"
                    style={{ width: "100%" }}
                    onClick={() => handleAddRiskToRegister(i, risk)}
                    disabled={addedRisks[i]}
                  >
                    {addedRisks[i] ? (
                      <>
                        <Check size={13} style={{ color: "var(--color-success)" }} />
                        Synced to Risk Register
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        Add to Risk Register
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items List */}
        {data?.actionItems?.length > 0 && (
          <div
            style={{
              padding: "20px 24px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <h3 style={{ fontSize: 15, margin: "0 0 12px", fontWeight: 700 }}>
              Immediate Follow-up Action Items
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.actionItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    fontSize: 13,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)" }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
