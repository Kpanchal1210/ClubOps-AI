import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Sparkles,
  User,
  ShieldAlert,
  CheckSquare,
  AlertCircle,
  Check,
  X,
  History,
  CornerDownLeft,
} from "lucide-react";

import agentService from "../services/agentService";
import { mockAgentActions } from "../mockData";
import { safeStorage } from "../utils/storage";
import Loading from "../components/Loading";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function Agent() {
  const [command, setCommand] = useState("");
  const [eventId] = useState(() => safeStorage.getItem("eventId", "mock-event-1"));

  // Chat conversation state
  const [messages, setMessages] = useState([
    {
      id: "m-welcome",
      sender: "assistant",
      text: "Hello! I am your ClubOps AI Operations Assistant. You can give me natural language instructions to create tasks, flag risks, or notify committee members.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Pending confirmation proposal
  const [pendingProposal, setPendingProposal] = useState(null);

  // History & execution state — populated with mock actions immediately
  const [actions, setActions] = useState(mockAgentActions);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // chat | history

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingProposal]);

  /* ── Load Action History ─────────────────── */
  useEffect(() => {
    if (DEV_MODE) {
      setActions(mockAgentActions);
      setHistoryLoading(false);
      return;
    }

    agentService
      .getActions(eventId)
      .then((res) => setActions(res?.data || res || []))
      .catch(() => setActions(mockAgentActions))
      .finally(() => setHistoryLoading(false));
  }, [eventId]);

  /* ── Parse User Command into Proposal ──── */
  const handleSendCommand = (e) => {
    e.preventDefault();
    const trimmed = command.trim();
    if (!trimmed || isProcessing) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setCommand("");
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const lower = trimmed.toLowerCase();

      // Check if command is to create a risk
      if (lower.includes("risk") || lower.includes("flag")) {
        const proposal = {
          id: `prop-${Date.now()}`,
          type: "risk",
          title: trimmed.replace(/flag a |create a |report /i, ""),
          severity: lower.includes("high") ? "High" : lower.includes("critical") ? "Critical" : "Medium",
          probability: "Medium",
          assignedTo: "Rahul Patel",
          originalCommand: trimmed,
        };
        setPendingProposal(proposal);
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: "assistant",
            text: "I analyzed the operational risk context. Before logging this liability to the register, please confirm the details:",
            proposal,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        // Default: Create Task proposal
        const assigneeMatch = trimmed.match(/for\s+([A-Za-z]+)/i);
        const assignee = assigneeMatch ? assigneeMatch[1] : "Rahul Patel";

        const proposal = {
          id: `prop-${Date.now()}`,
          type: "task",
          title: trimmed.replace(/^create a (high priority |medium priority )?task (for \w+ )?(to )?/i, ""),
          priority: lower.includes("high") ? "High" : lower.includes("critical") ? "Critical" : "Medium",
          deadline: lower.includes("tomorrow") ? "Tomorrow, 6:00 PM" : "In 3 days",
          assignee: assignee,
          originalCommand: trimmed,
        };

        setPendingProposal(proposal);
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: "assistant",
            text: `I found ${assignee} in the current event roster. I can create the following deliverable:`,
            proposal,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    }, 550);
  };

  /* ── Confirm Proposed Action ─────────────── */
  const handleConfirmProposal = async (proposal) => {
    setIsProcessing(true);

    if (DEV_MODE) {
      setTimeout(() => {
        const newAction = {
          _id: `act-${Date.now()}`,
          userId: "user-1",
          eventId,
          command: proposal.originalCommand,
          intent: proposal.type === "risk" ? "CREATE_RISK" : "CREATE_TASK",
          tool: proposal.type === "risk" ? "createRisk" : "createTask",
          parameters: {
            title: proposal.title,
            priority: proposal.priority,
            assignee: proposal.assignee,
            deadline: proposal.deadline,
          },
          status: "completed",
          result: { success: true, id: `res-${Date.now()}` },
          createdAt: new Date().toISOString(),
        };

        setActions((prev) => [newAction, ...prev]);
        setPendingProposal(null);
        setIsProcessing(false);

        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: "assistant",
            text: `✓ Confirmed! Successfully created ${proposal.type}: "${proposal.title}". It is now synced to the active event workspace.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }, 500);
      return;
    }

    try {
      const res = await agentService.sendCommand(proposal.originalCommand, eventId);
      const action = res?.data || res;
      setActions((prev) => [action, ...prev]);
      setPendingProposal(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          text: `✓ Successfully executed: "${proposal.title}". System records updated.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          text: `Error executing command: ${err.message || "Failed to reach agent service."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── Cancel Proposal ─────────────────────── */
  const handleCancelProposal = () => {
    setPendingProposal(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `asst-${Date.now()}`,
        sender: "assistant",
        text: "Operation cancelled. No changes were made to your club records.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className="status-pulse" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ai-text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Autonomous Operations
            </span>
          </div>
          <h1>AI Assistant Workspace</h1>
          <p>Issue conversational commands to manage schedules, create deliverables, and evaluate club liabilities.</p>
        </div>

        <div className="page-header-actions">
          <div className="filter-pills">
            <button
              className={`filter-pill ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              <Bot size={14} style={{ marginRight: 6 }} />
              Live Workspace
            </button>
            <button
              className={`filter-pill ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <History size={14} style={{ marginRight: 6 }} />
              Audit Trail ({actions.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === "chat" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
          {/* Main Chat Thread */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-xl)",
              display: "flex",
              flexDirection: "column",
              height: "640px",
              boxShadow: "var(--shadow-xs)",
              overflow: "hidden",
            }}
          >
            {/* Chat Messages Stream */}
            <div
              style={{
                flex: 1,
                padding: "24px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`ai-message ${msg.sender}`}>
                  <div className="ai-message-bubble">
                    <p style={{ margin: 0 }}>{msg.text}</p>

                    {/* Proposal Confirmation Card */}
                    {msg.proposal && (
                      <div className="ai-confirm-card">
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span className={`badge ${msg.proposal.priority ? msg.proposal.priority.toLowerCase() : "medium"}`}>
                            {msg.proposal.priority || msg.proposal.severity}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                            {msg.proposal.title}
                          </span>
                        </div>

                        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 4 }}>
                          {msg.proposal.assignee && (
                            <div>
                              Assignee: <strong>{msg.proposal.assignee}</strong>
                            </div>
                          )}
                          {msg.proposal.deadline && (
                            <div>
                              Deadline: <strong>{msg.proposal.deadline}</strong>
                            </div>
                          )}
                          {msg.proposal.severity && (
                            <div>
                              Severity: <strong>{msg.proposal.severity}</strong>
                            </div>
                          )}
                        </div>

                        {pendingProposal && pendingProposal.id === msg.proposal.id && (
                          <div className="ai-confirm-actions">
                            <button
                              className="primary-button button-sm"
                              onClick={() => handleConfirmProposal(msg.proposal)}
                              disabled={isProcessing}
                            >
                              <Check size={13} />
                              Confirm & Create
                            </button>
                            <button
                              className="secondary-button button-sm"
                              onClick={handleCancelProposal}
                              disabled={isProcessing}
                            >
                              <X size={13} />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="ai-message assistant">
                  <div className="ai-message-bubble" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite", color: "var(--color-primary)" }} />
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Analyzing instruction...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendCommand}
              style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder='e.g. "Create a high priority task for Rahul to contact sponsors tomorrow"'
                disabled={isProcessing}
                style={{
                  flex: 1,
                  margin: 0,
                  background: "var(--bg-canvas)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                className="primary-button"
                disabled={isProcessing || !command.trim()}
                style={{ padding: "9px 16px" }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>

          {/* Right Sidebar: Quick Prompts & Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                padding: 20,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Sparkles size={16} style={{ color: "var(--color-ai)" }} />
                <strong style={{ fontSize: 14 }}>Sample Voice & Text Commands</strong>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Create a high priority task for Rahul to contact sponsors tomorrow",
                  "Flag a high severity risk — auditorium confirmation pending",
                  "Create a task for Alice to test AV sound equipment by Sep 22",
                  "Report a medium risk: insufficient volunteer drivers for logistics",
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCommand(prompt);
                      inputRef.current?.focus();
                    }}
                    style={{
                      textAlign: "left",
                      padding: "9px 12px",
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-md)",
                      fontSize: 12.5,
                      lineHeight: 1.4,
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: 16,
                background: "var(--color-primary-light)",
                border: "1px solid var(--color-primary-border)",
                borderRadius: "var(--radius-lg)",
                fontSize: 12.5,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: "var(--color-primary)", display: "block", marginBottom: 4 }}>
                Guardrails & Governance
              </strong>
              For any action that modifies club data or creates obligations, the AI will present a structured preview and require your confirmation before execution.
            </div>
          </div>
        </div>
      ) : (
        /* Action Audit Trail Tab */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {historyLoading ? (
            <Loading type="table" count={4} message="Loading agent action audit log..." />
          ) : actions.length === 0 ? (
            <div className="empty-state">No agent actions recorded yet.</div>
          ) : (
            actions.map((act) => {
              const id = act._id || act.id;
              return (
                <div
                  key={id}
                  style={{
                    padding: "16px 20px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="badge completed" style={{ fontSize: 10.5 }}>
                        {act.intent}
                      </span>
                      <small style={{ color: "var(--text-muted)" }}>
                        {act.createdAt ? new Date(act.createdAt).toLocaleString() : ""}
                      </small>
                    </div>

                    <strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                      "{act.command}"
                    </strong>

                    <small style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4, display: "block" }}>
                      Executed tool: <code>{act.tool}</code>
                    </small>
                  </div>

                  <span className="badge completed">
                    <CheckCircle size={12} />
                    {act.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
