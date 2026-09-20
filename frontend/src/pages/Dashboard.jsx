import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CheckSquare,
  ShieldAlert,
  Users,
  Sparkles,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Bot,
  Activity,
  Plus,
  Layers,
  MapPin,
  Gauge,
  Maximize2,
  Type,
  Paperclip,
  MessageSquare,
} from "lucide-react";

import eventService from "../services/eventService";
import { useAuth } from "../context/AuthContext";
import { useEvent } from "../context/EventContext";
import { safeStorage } from "../utils/storage";

import StatCard from "../components/StatCard";
import TaskCard from "../components/TaskCard";
import RiskCard from "../components/RiskCard";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlEventId = searchParams.get("eventId");
  const { events, currentEventId, currentEvent: activeEventFromCtx, setCurrentEventId } = useEvent();
  const effectiveEventId = urlEventId || currentEventId;

  const [dashboard, setDashboard] = useState(() =>
    effectiveEventId ? safeStorage.getJSON(`dashboard_cache_${effectiveEventId}`) : null
  );
  const [loading, setLoading] = useState(!dashboard);
  const [error, setError] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [aiCommand, setAiCommand] = useState("");

  // Sync URL param with context if provided
  useEffect(() => {
    if (urlEventId && urlEventId !== currentEventId) {
      setCurrentEventId(urlEventId);
    }
  }, [urlEventId, currentEventId, setCurrentEventId]);

  const loadDashboard = async () => {
    if (!effectiveEventId) {
      setLoading(false);
      setDashboard(null);
      return;
    }
    if (!dashboard) setLoading(true);
    setError("");

    try {
      const dashRes = await eventService.getDashboard(effectiveEventId);
      const d = dashRes?.data || dashRes;
      if (d) {
        setDashboard(d);
        safeStorage.setItem(`dashboard_cache_${effectiveEventId}`, d);
      }
    } catch (err) {
      console.warn("Dashboard sync error:", err);
      setError(err.response?.data?.message || err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If effectiveEventId changed, load from cache first
    const cached = effectiveEventId ? safeStorage.getJSON(`dashboard_cache_${effectiveEventId}`) : null;
    if (cached) {
      setDashboard(cached);
      setLoading(false);
    }
    loadDashboard();
  }, [effectiveEventId]);

  const handleRunAgent = (e) => {
    e.preventDefault();
    const cmd = aiCommand.trim() || "Create a high priority task for Rahul to contact sponsors tomorrow";
    navigate(effectiveEventId ? `/agent?eventId=${effectiveEventId}&prompt=${encodeURIComponent(cmd)}` : `/agent?prompt=${encodeURIComponent(cmd)}`);
  };

  const formatDateSafe = (dateStr, fallback = "SCHEDULED") => {
    if (!dateStr) return fallback;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return fallback;
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
    } catch {
      return fallback;
    }
  };

  if (loading && !dashboard) {
    return <Loading message="Connecting to ClubOps API and loading workspace..." />;
  }

  const stats = dashboard?.statistics || {};
  const currentEvent = dashboard?.event || activeEventFromCtx || events.find((e) => (e._id || e.id) === effectiveEventId) || events[0] || null;
  const allTasks = dashboard?.tasks || [];
  const allRisks = dashboard?.risks || [];
  const upcomingEvents = events;

  // Filter tasks
  const filteredTasks = allTasks.filter((task) => {
    if (taskFilter === "all") return true;
    return task.status === taskFilter;
  });

  // Calculate task completion percentage
  const totalTasksCount = allTasks.length;
  const completedTasksCount = allTasks.filter((t) => t.status === "completed").length;
  const completionRate = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 0;

  // Format event title for big editorial display
  const eventNameWords = (currentEvent?.name || "ACTIVE EVENT").toUpperCase().split(" ");
  const titlePart1 = eventNameWords[0] || "ACTIVE";
  const titlePart2 = eventNameWords.slice(1).join(" ") || "OPERATION";

  if (!currentEvent && eventsList.length === 0) {
    return (
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "40px 0" }}>
        <div className="editorial-hero-card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div className="hero-status-pill" style={{ margin: "0 auto 16px" }}>WELCOME TO CLUBOPS</div>
          <h1 className="hero-editorial-title" style={{ fontSize: 36, marginBottom: 16 }}>
            <span>NO ACTIVE</span><br /><span>OPERATIONS</span>
          </h1>
          <p className="hero-editorial-description" style={{ maxWidth: 500, margin: "0 auto 24px" }}>
            You have connected to the backend, but haven't created any events yet. Create your first event to activate task management, meetings, and AI automation.
          </p>
          <Link to="/events" className="primary-button" style={{ display: "inline-flex", margin: "0 auto" }}>
            <Plus size={16} />
            <span>Create First Event</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto" }}>
      {/* ── REFERENCE HERO SECTION (ASYYMETRIC EDITORIAL GRID) ── */}
      <div className="reference-hero-grid">
        {/* Left: Off-white / Cream Hero Panel */}
        <div className="editorial-hero-card">
          <div className="hero-card-header">
            <span className="hero-status-pill">
              CURRENT OPERATION / {(currentEvent?.status || "PLANNING").toUpperCase()}
            </span>
            <div className="radar-target-icon" title="Operational Radar Active">
              <div className="radar-center-dot" />
            </div>
          </div>

          <div className="hero-card-body">
            <h1 className="hero-editorial-title">
              <span>{titlePart1}</span>
              <br />
              <span>{titlePart2}</span>
            </h1>

            <p className="hero-editorial-description">
              {currentEvent?.description ||
                "One operational source for tasks, people, meeting intelligence, risks, documents, and announcements."}
            </p>
          </div>

          <div className="hero-stats-strip">
            <div className="hero-stat-col">
              <span className="hero-stat-number">
                {currentEvent?.expectedParticipants || 300}
              </span>
              <span className="hero-stat-label">ATTENDEES</span>
            </div>
            <div className="hero-stat-col">
              <span className="hero-stat-number">
                {stats.totalVolunteers || 50}
              </span>
              <span className="hero-stat-label">VOLUNTEERS</span>
            </div>
            <div className="hero-stat-col">
              <span className="hero-stat-number">
                24H
              </span>
              <span className="hero-stat-label">DURATION</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action & Status Panels */}
        <div className="editorial-side-panels">
          <div className="editorial-actions-row">
            {/* Panel 1: Hot Red Open Task Board Card */}
            <Link to={effectiveEventId ? `/tasks?eventId=${effectiveEventId}` : "/tasks"} className="brutal-red-action-card">
              <div className="action-icon-square white-bg">
                <Gauge size={18} />
              </div>
              <div className="action-card-text">
                <span>OPEN</span>
                <br />
                <span>TASK BOARD</span>
              </div>
            </Link>

            {/* Panel 2: Off-white Process Meeting Card */}
            <Link to={effectiveEventId ? `/meetings?eventId=${effectiveEventId}` : "/meetings"} className="brutal-light-action-card">
              <div className="action-icon-square red-bg">
                <Sparkles size={18} />
              </div>
              <div className="action-card-text">
                <span>PROCESS</span>
                <br />
                <span>MEETING</span>
              </div>
            </Link>
          </div>

          {/* Panel 3: Black Operations Ready Status Strip */}
          <div className="operations-ready-panel">
            <div className="operations-meta-row">
              <span>{formatDateSafe(currentEvent?.startDate, "10-11 OCT 2026")}</span>
              <span>{(currentEvent?.venue || "DDU AUDITORIUM").toUpperCase()}</span>
            </div>
            <div className="operations-status-row">
              <span className="status-square-green">■</span>
              <span className="operations-status-title">OPERATIONS READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── REFERENCE BOTTOM AI AGENT COMMAND BAR ── */}
      <form className="ai-agent-command-bar" onSubmit={handleRunAgent}>
        <div className="command-bar-left">
          <Bot size={18} className="command-robot-icon" />
          <input
            type="text"
            className="command-bar-input"
            value={aiCommand}
            onChange={(e) => setAiCommand(e.target.value)}
            placeholder="Create a high priority task for Rahul..."
          />
        </div>

        <div className="command-bar-tools">
          <button
            type="button"
            className="tool-chip"
            title="Workspace Context"
            onClick={() => setAiCommand("Analyze current workspace context and risks")}
          >
            <Maximize2 size={13} />
          </button>
          <button
            type="button"
            className="tool-chip"
            title="Task Command"
            onClick={() => setAiCommand("Create a high priority task for Rahul to contact sponsors tomorrow")}
          >
            <Type size={13} />
          </button>
          <button
            type="button"
            className="tool-chip"
            title="Attach Document"
            onClick={() => navigate(`/events/${eventId}?tab=documents`)}
          >
            <Paperclip size={13} />
          </button>
          <button
            type="button"
            className="tool-chip"
            title="Ask AI Assistant"
            onClick={() => navigate("/agent")}
          >
            <MessageSquare size={13} />
          </button>
        </div>

        <button type="submit" className="run-agent-btn">
          <ArrowUpRight size={14} />
          <span>RUN AGENT</span>
        </button>
      </form>

      {/* ── Compact Statistics Row ── */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          title="Total Events"
          value={stats.totalEvents ?? upcomingEvents.length}
          description="Registered on platform"
          icon={CalendarDays}
        />
        <StatCard
          title="Active Events"
          value={stats.activeEvents ?? upcomingEvents.filter((e) => e.status === "planning" || e.status === "ongoing").length}
          description="Planning & ongoing"
          variant="emerald"
          icon={Activity}
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks ?? allTasks.filter((t) => t.status === "pending" || t.status === "in_progress").length}
          description={`${completionRate}% overall completed`}
          variant="amber"
          icon={Clock}
        />
        <StatCard
          title="Open Risks"
          value={stats.openRisks ?? allRisks.filter((r) => r.status === "open" || r.status === "investigating").length}
          description={stats.openRisks > 0 ? "Requires mitigation" : "All risks mitigated"}
          variant="rose"
          icon={ShieldAlert}
        />
      </div>

      {/* ── Main Two-Column Operational Layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24, marginBottom: 28 }}>
        {/* Left Column: Upcoming Events & Tasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Upcoming Events Section */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarDays size={18} style={{ color: "var(--color-primary)" }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: "uppercase" }}>Upcoming Events</h2>
              </div>
              <Link to="/events" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)" }}>
                VIEW ALL <ChevronRight size={13} />
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {upcomingEvents.slice(0, 3).map((evt) => {
                const id = evt._id || evt.id;
                return (
                  <div
                    key={id}
                    className="event-card"
                    style={{ padding: "16px 20px" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span className={`badge ${evt.status || "planning"}`}>
                            {evt.status || "planning"}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            {evt.startDate ? new Date(evt.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "TBD"}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>{evt.name}</h3>
                      </div>

                      <Link
                        to={`/events/${id}`}
                        className="secondary-button button-sm"
                        style={{ flexShrink: 0 }}
                      >
                        Workspace <ArrowUpRight size={12} />
                      </Link>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12.5, color: "var(--text-secondary)", marginTop: 6 }}>
                      {evt.venue && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={13} /> {evt.venue}
                        </span>
                      )}
                      {evt.expectedParticipants > 0 && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Users size={13} /> {evt.expectedParticipants} attendees
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Task Overview Section */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckSquare size={18} style={{ color: "var(--color-primary)" }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: "uppercase" }}>Task Overview</h2>
              </div>

              <div className="filter-pills">
                {["all", "pending", "in_progress", "completed", "overdue"].map((status) => (
                  <button
                    key={status}
                    className={`filter-pill ${taskFilter === status ? "active" : ""}`}
                    onClick={() => setTaskFilter(status)}
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: "36px 20px" }}>
                <p>No tasks match the selected filter.</p>
              </div>
            ) : (
              <div className="card-grid" style={{ gridTemplateColumns: "1fr" }}>
                {filteredTasks.slice(0, 4).map((task) => (
                  <TaskCard
                    key={task._id || task.id}
                    task={task}
                    onClick={() => navigate(effectiveEventId ? `/tasks?eventId=${effectiveEventId}` : "/tasks")}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Risk Overview & Operational Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Risk Overview */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldAlert size={18} style={{ color: "var(--color-danger)" }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: "uppercase" }}>Risk Overview</h2>
              </div>
              <Link to={effectiveEventId ? `/risks?eventId=${effectiveEventId}` : "/risks"} style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)" }}>
                REGISTER <ChevronRight size={13} />
              </Link>
            </div>

            {allRisks.length === 0 ? (
              <div className="empty-state" style={{ padding: "28px 16px" }}>
                <p>No open operational risks.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {allRisks.slice(0, 3).map((risk) => (
                  <RiskCard
                    key={risk._id || risk.id}
                    risk={risk}
                    onClick={() => navigate(effectiveEventId ? `/risks?eventId=${effectiveEventId}` : "/risks")}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Operational AI Assistant Card */}
          <section
            style={{
              padding: 20,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)", marginBottom: 10 }}>
              <Sparkles size={18} />
              <strong style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>Operational AI Agent</strong>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 14px" }}>
              Event intelligence is connected and listening to meeting recordings and notes. Ready to create tasks or detect operational risks.
            </p>

            <Link
              to={effectiveEventId ? `/agent?eventId=${effectiveEventId}` : "/agent"}
              className="primary-button"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <Bot size={14} />
              <span>Launch AI Command Workspace</span>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
