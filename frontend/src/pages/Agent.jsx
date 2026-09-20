import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { useEvent } from "../context/EventContext";
import Loading from "../components/Loading";
import { safeStorage } from "../utils/storage";

export default function Agent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlEventId = searchParams.get("eventId");
  const promptParam = searchParams.get("prompt");
  const { events, currentEventId, currentEvent, setCurrentEventId } = useEvent();
  const effectiveEventId = urlEventId || currentEventId;

  const [command, setCommand] = useState("");

  // Sync URL eventId with context if URL param exists
  useEffect(() => {
    if (urlEventId && urlEventId !== currentEventId) {
      setCurrentEventId(urlEventId);
    }
  }, [urlEventId, currentEventId, setCurrentEventId]);

  // Pre-fill prompt from URL query if provided
  useEffect(() => {
    if (promptParam) {
      setCommand(promptParam);
    }
  }, [promptParam]);

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

  // History & execution state
  const [actions, setActions] = useState(() =>
    effectiveEventId ? safeStorage.getJSON(`agent_actions_${effectiveEventId}`) || [] : []
  );
  const [historyLoading, setHistoryLoading] = useState(() =>
    effectiveEventId ? !(safeStorage.getJSON(`agent_actions_${effectiveEventId}`)?.length) : false
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // chat | history

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingProposal]);

  /* ── Load Action History ─────────────────── */
  useEffect(() => {
    if (!effectiveEventId) {
      setHistoryLoading(false);
      setActions([]);
      return;
    }
    const cached = safeStorage.getJSON(`agent_actions_${effectiveEventId}`);
    if (cached && cached.length > 0) {
      setActions(cached);
    } else {
      setHistoryLoading(true);
    }

    agentService
      .getActions(effectiveEventId)
      .then((res) => {
        const list = res?.data || res || [];
        const validList = Array.isArray(list) ? list : [];
        setActions(validList);
        safeStorage.setJSON(`agent_actions_${effectiveEventId}`, validList);
      })
      .catch((err) => {
        console.warn("Failed to load agent actions:", err);
      })
      .finally(() => setHistoryLoading(false));
  }, [effectiveEventId]);

  /* ── Parse User Command into Proposal ──── */
  /* ── Parse User Command into Proposal or Direct Answer ──── */
  const handleSendCommand = async (e) => {
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

    const lower = trimmed.toLowerCase();

    // 1. Check if user is saying a greeting or conversational phrase
    const isGreeting =
      lower === "hi" ||
      lower === "hello" ||
      lower === "hey" ||
      lower === "help" ||
      /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|howdy|sup|yo)\b/i.test(lower) ||
      lower.startsWith("who are you") ||
      lower.startsWith("what can you do");

    // 2. Check if user is asking a question or querying event status / documents
    const isQuestion =
      isGreeting ||
      lower.startsWith("who") ||
      lower.startsWith("what") ||
      lower.startsWith("where") ||
      lower.startsWith("when") ||
      lower.startsWith("why") ||
      lower.startsWith("how") ||
      lower.startsWith("which") ||
      lower.startsWith("can you") ||
      lower.startsWith("tell me") ||
      lower.startsWith("is ") ||
      lower.startsWith("are ") ||
      lower.startsWith("list ") ||
      lower.startsWith("show ") ||
      lower.endsWith("?") ||
      lower.includes("status of") ||
      lower.includes("who done") ||
      lower.includes("who completed") ||
      lower.includes("who is") ||
      lower.includes("who was") ||
      lower.includes("who has") ||
      lower.includes("assigned to") ||
      lower.includes("according to") ||
      lower.includes("guideline") ||
      lower.includes("rules") ||
      lower.includes("policy") ||
      lower.includes("contract") ||
      lower.includes("document");

    if (isQuestion) {
      try {
        const res = await agentService.sendCommand(trimmed, effectiveEventId);
        const action = res?.data || res;
        setActions((prev) => [action, ...prev]);

        const answerText =
          action.result?.answer ||
          action.result?.message ||
          "I checked the event records and found no matching details.";

        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: "assistant",
            text: answerText,
            actionDetail: action,
            sources: action.result?.sources || [],
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: "assistant",
            text: `Error: ${err.response?.data?.message || err.message || "Failed to query AI assistant."}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // 2. Action Proposals (Allow user to confirm before mutating database)
    setTimeout(async () => {
      // Notification / Announcement
      if (lower.includes("notif") || lower.includes("announc") || lower.includes("broadcast") || lower.includes("alert")) {
        setIsProcessing(false);
        const recipientMatch = trimmed.match(/to\s+([A-Za-z0-9_\s]+?)(?:\s+that|\s+about|\s+to|$)/i);
        const recipient = recipientMatch ? recipientMatch[1].trim() : (lower.includes("all") ? "all" : "team");
        const messageMatch = trimmed.match(/(?:that|about|message:?)\s+(.+)$/i);
        const messageText = messageMatch ? messageMatch[1].trim() : trimmed;

        const proposal = {
          id: `prop-${Date.now()}`,
          type: "notification",
          title: `Announcement to ${recipient}`,
          recipient,
          message: messageText,
          priority: lower.includes("critical") ? "Critical" : lower.includes("high") ? "High" : "Medium",
          originalCommand: trimmed,
        };

        setPendingProposal(proposal);
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: "assistant",
            text: `I prepared an operational notification to dispatch to ${recipient}:`,
            proposal,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else if (lower.startsWith("mark") || lower.startsWith("update") || (lower.includes("task") && lower.includes("complet"))) {
        // Update Task
        setIsProcessing(false);
        const proposal = {
          id: `prop-${Date.now()}`,
          type: "update_task",
          title: trimmed.replace(/^mark (the )?/i, "").replace(/ task (as )?/i, " → "),
          status: lower.includes("complete") ? "completed" : lower.includes("progress") ? "in_progress" : "pending",
          priority: lower.includes("high") ? "High" : lower.includes("critical") ? "Critical" : undefined,
          originalCommand: trimmed,
        };

        setPendingProposal(proposal);
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: "assistant",
            text: "I analyzed your task modification request. Please confirm before applying updates to the task roster:",
            proposal,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else if (lower.includes("risk") || lower.includes("flag")) {
        // Create Risk
        setIsProcessing(false);
        const proposal = {
          id: `prop-${Date.now()}`,
          type: "risk",
          title: trimmed.replace(/flag a |create a |report /i, ""),
          severity: lower.includes("high") ? "High" : lower.includes("critical") ? "Critical" : "Medium",
          probability: "Medium",
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
      } else if (lower.includes("create task") || lower.includes("assign ") || lower.includes("add task")) {
        // Create Task
        setIsProcessing(false);
        const assigneeMatch = trimmed.match(/for\s+([A-Za-z]+)/i) || trimmed.match(/assign\s+([A-Za-z]+)/i);
        const assignee = assigneeMatch ? assigneeMatch[1] : "Organizer";

        const proposal = {
          id: `prop-${Date.now()}`,
          type: "task",
          title: trimmed.replace(/^create a (high priority |medium priority )?task (for \w+ )?(to )?|^assign \w+ (to )?/i, ""),
          priority: lower.includes("high") ? "High" : lower.includes("critical") ? "Critical" : "Medium",
          deadline: lower.includes("tomorrow") ? "Tomorrow, 6:00 PM" : lower.includes("today") ? "Today, 11:59 PM" : "Upcoming",
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
      } else {
        // 3. Fallback: Send directly to backend AI agent
        try {
          const res = await agentService.sendCommand(trimmed, effectiveEventId);
          const action = res?.data || res;
          setActions((prev) => [action, ...prev]);

          const resultText =
            action.result?.answer ||
            action.result?.message ||
            `✓ Executed ${action.tool || "action"}. System records updated.`;

          setMessages((prev) => [
            ...prev,
            {
              id: `asst-${Date.now()}`,
              sender: "assistant",
              text: resultText,
              actionDetail: action,
              sources: action.result?.sources || [],
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        } catch (err) {
          setMessages((prev) => [
            ...prev,
            {
              id: `asst-${Date.now()}`,
              sender: "assistant",
              text: `Error executing command: ${err.response?.data?.message || err.message || "Failed to reach agent service."}`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        } finally {
          setIsProcessing(false);
        }
      }
    }, 400);
  };

  /* ── Confirm Proposed Action ─────────────── */
  const handleConfirmProposal = async (proposal) => {
    setIsProcessing(true);

    try {
      const res = await agentService.sendCommand(proposal.originalCommand, effectiveEventId);
      const action = res?.data || res;
      setActions((prev) => [action, ...prev]);
      setPendingProposal(null);

      let successText = `✓ Successfully executed: "${proposal.title}". System records updated.`;
      if (action.intent === "QUERY_KNOWLEDGE" && action.result?.answer) {
        successText = action.result.answer;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          text: successText,
          actionDetail: action,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          text: `Error executing command: ${err.response?.data?.message || err.message || "Failed to reach agent service."}`,
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
          <h1>AI Assistant Workspace {currentEvent?.name ? `— ${currentEvent.name}` : ""}</h1>
          <p>Issue conversational commands to manage schedules, create deliverables, and evaluate club liabilities.</p>
        </div>

        <div className="page-header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Active Event Selector */}
          {events.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "2px 8px",
                height: 36,
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: "0.05em",
                }}
              >
                EVENT:
              </span>
              <select
                value={effectiveEventId || ""}
                onChange={(e) => {
                  const newId = e.target.value;
                  setCurrentEventId(newId);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("eventId", newId);
                    return next;
                  });
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {events.map((evt) => (
                  <option key={evt._id || evt.id} value={evt._id || evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.text}</p>

                    {/* Sources Badge if RAG / Knowledge intent or direct question */}
                    {((msg.actionDetail?.intent === "QUERY_KNOWLEDGE" && msg.actionDetail.result?.sources?.length > 0) || (msg.sources && msg.sources.length > 0)) && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop: "1px dashed var(--border-default)",
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <strong style={{ color: "var(--color-primary)", display: "block", marginBottom: 4 }}>
                          Grounded in Event Records & Documents:
                        </strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {(msg.sources || msg.actionDetail.result.sources).map((s, idx) => (
                            <span key={idx} className="badge low" style={{ fontSize: 11 }}>
                              {s.type === "task" ? `✓ Task: ${s.title}` : `📄 ${s.fileName || s.title || `Document ${idx + 1}`}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Proposal Confirmation Card */}
                    {msg.proposal && (
                      <div className="ai-confirm-card">
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span className={`badge ${msg.proposal.priority ? msg.proposal.priority.toLowerCase() : msg.proposal.severity ? msg.proposal.severity.toLowerCase() : "medium"}`}>
                            {msg.proposal.type ? msg.proposal.type.toUpperCase().replace("_", " ") : "PROPOSAL"}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                            {msg.proposal.title}
                          </span>
                        </div>

                        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 4 }}>
                          {msg.proposal.recipient && (
                            <div>
                              Recipient: <strong>{msg.proposal.recipient}</strong>
                            </div>
                          )}
                          {msg.proposal.message && (
                            <div>
                              Message: <em>"{msg.proposal.message}"</em>
                            </div>
                          )}
                          {msg.proposal.status && (
                            <div>
                              New Status: <strong>{msg.proposal.status}</strong>
                            </div>
                          )}
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
                              {msg.proposal.type === "knowledge"
                                ? "Confirm & Search Documents"
                                : msg.proposal.type === "notification"
                                ? "Confirm & Dispatch"
                                : msg.proposal.type === "update_task"
                                ? "Confirm & Update"
                                : msg.proposal.type === "risk"
                                ? "Confirm & Report Risk"
                                : "Confirm & Create Task"}
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
            <form onSubmit={handleSendCommand} className="agent-ask-container">
              <div className="agent-input-wrapper">
                <Sparkles size={16} className="agent-input-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder='Ask a question, say "hi", or issue a command (e.g. "Create a task for Rahul to contact sponsors tomorrow")...'
                  disabled={isProcessing}
                  className="agent-ask-input"
                />
              </div>
              <button
                type="submit"
                className="agent-send-button"
                disabled={isProcessing || !command.trim()}
              >
                {isProcessing ? (
                  <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <Send size={15} />
                )}
                <span>Send</span>
              </button>
            </form>
          </div>

          {/* Right Sidebar: Active Scope & Governance */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Active Scope Card */}
            <div
              style={{
                padding: 20,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Bot size={17} style={{ color: "var(--color-primary)" }} />
                <strong style={{ fontSize: 14 }}>Operational Context</strong>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
                    Active Event
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {currentEvent?.name || "All Events Scope"}
                  </span>
                </div>

                {currentEvent?.venue && (
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
                      Venue
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>{currentEvent.venue}</span>
                  </div>
                )}

                {currentEvent?.status && (
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>
                      Status
                    </span>
                    <span className={`badge ${currentEvent.status === "completed" ? "completed" : currentEvent.status === "ongoing" ? "high" : "medium"}`} style={{ fontSize: 11 }}>
                      {currentEvent.status.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-default)" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                  Capabilities
                </span>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.6 }}>
                  <li>Autonomous Task Dispatch</li>
                  <li>Operational Risk Register</li>
                  <li>Direct Document Grounding (RAG)</li>
                  <li>Committee Announcements</li>
                </ul>
              </div>
            </div>

            {/* Guardrails & Governance Card */}
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
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <ShieldAlert size={15} style={{ color: "var(--color-primary)" }} />
                <strong style={{ color: "var(--color-primary)" }}>
                  Guardrails & Governance
                </strong>
              </div>
              For any action that modifies club data or creates obligations, the AI presents a structured preview and requires your confirmation before execution.
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
