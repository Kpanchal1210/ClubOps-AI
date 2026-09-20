import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  Users,
  CheckSquare,
  ShieldAlert,
  MessageSquare,
  FileText,
  Sparkles,
  ArrowUpRight,
  Clock,
  Activity,
  Plus,
  ChevronRight,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  File,
  Filter,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";

import eventService from "../services/eventService";
import taskService from "../services/taskService";
import riskService from "../services/riskService";
import volunteerService from "../services/volunteerService";
import meetingService from "../services/meetingService";
import documentService from "../services/documentService";

import StatCard from "../components/StatCard";
import TaskCard from "../components/TaskCard";
import RiskCard from "../components/RiskCard";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { useEvent } from "../context/EventContext";
import { safeStorage } from "../utils/storage";

export default function EventDetails() {
  const { id, eventId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentEventId: contextEventId, setCurrentEventId } = useEvent();

  const currentEventId = id || eventId || contextEventId;

  // Sync active event ID with EventContext
  useEffect(() => {
    if (currentEventId && currentEventId !== contextEventId) {
      setCurrentEventId(currentEventId);
    }
  }, [currentEventId, contextEventId, setCurrentEventId]);

  // Tab state: overview | tasks | volunteers | risks | meetings | documents
  const activeTab = searchParams.get("tab") || "overview";

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  const getCachedEvent = (eid) => {
    if (!eid) return null;
    const direct = safeStorage.getJSON(`event_details_cache_${eid}`);
    if (direct) return direct;
    const list = safeStorage.getJSON("events_cache") || [];
    return list.find((e) => (e._id || e.id) === eid) || null;
  };

  const [event, setEvent] = useState(() => getCachedEvent(currentEventId));
  const [tasks, setTasks] = useState(() => (currentEventId ? safeStorage.getJSON(`tasks_cache_${currentEventId}`) || [] : []));
  const [risks, setRisks] = useState(() => (currentEventId ? safeStorage.getJSON(`risks_cache_${currentEventId}`) || [] : []));
  const [volunteers, setVolunteers] = useState(() => (currentEventId ? safeStorage.getJSON(`volunteers_cache_${currentEventId}`) || [] : []));
  const [meetings, setMeetings] = useState(() => (currentEventId ? safeStorage.getJSON(`meetings_cache_${currentEventId}`) || [] : []));
  const [documents, setDocuments] = useState(() => (currentEventId ? safeStorage.getJSON(`documents_cache_${currentEventId}`) || [] : []));

  const [loading, setLoading] = useState(() => !getCachedEvent(currentEventId));
  const [error, setError] = useState("");

  // Documents / RAG search state
  const [ragQuery, setRagQuery] = useState("");
  const [ragAnswer, setRagAnswer] = useState(null);
  const [ragLoading, setRagLoading] = useState(false);

  // Upload document modal state
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [uploadDocName, setUploadDocName] = useState("");
  const [uploadDocType, setUploadDocType] = useState("PDF");

  const loadAllEventData = async () => {
    if (!currentEventId) {
      setLoading(false);
      return;
    }
    safeStorage.setItem("eventId", currentEventId);
    if (!event) setLoading(true);
    setError("");

    try {
      const [evtRes, tasksRes, risksRes, volsRes, meetingsRes, docsRes] = await Promise.allSettled([
        eventService.getEvent(currentEventId),
        taskService.getEventTasks(currentEventId),
        riskService.getEventRisks(currentEventId),
        volunteerService.getEventVolunteers(currentEventId),
        meetingService.getEventMeetings(currentEventId),
        documentService.getEventDocuments(currentEventId),
      ]);

      if (evtRes.status === "fulfilled" && evtRes.value) {
        const evtData = evtRes.value?.data?.event || evtRes.value?.data || evtRes.value;
        if (evtData) {
          setEvent(evtData);
          safeStorage.setJSON(`event_details_cache_${currentEventId}`, evtData);
        }
      }
      if (tasksRes.status === "fulfilled" && tasksRes.value) {
        const t = tasksRes.value?.data?.tasks || tasksRes.value?.data || tasksRes.value;
        const taskList = Array.isArray(t) ? t : [];
        setTasks(taskList);
        safeStorage.setJSON(`tasks_cache_${currentEventId}`, taskList);
      }
      if (risksRes.status === "fulfilled" && risksRes.value) {
        const r = risksRes.value?.data?.risks || risksRes.value?.data || risksRes.value;
        const riskList = Array.isArray(r) ? r : [];
        setRisks(riskList);
        safeStorage.setJSON(`risks_cache_${currentEventId}`, riskList);
      }
      if (volsRes.status === "fulfilled" && volsRes.value) {
        const v = volsRes.value?.data?.volunteers || volsRes.value?.data || volsRes.value;
        const volList = Array.isArray(v) ? v : [];
        setVolunteers(volList);
        safeStorage.setJSON(`volunteers_cache_${currentEventId}`, volList);
      }
      if (meetingsRes.status === "fulfilled" && meetingsRes.value) {
        const m = meetingsRes.value?.data?.meetings || meetingsRes.value?.data || meetingsRes.value;
        const meetingList = Array.isArray(m) ? m : [];
        setMeetings(meetingList);
        safeStorage.setJSON(`meetings_cache_${currentEventId}`, meetingList);
      }
      if (docsRes.status === "fulfilled" && docsRes.value) {
        const d = docsRes.value?.data?.documents || docsRes.value?.data || docsRes.value;
        const docList = Array.isArray(d) ? d : [];
        setDocuments(docList);
        safeStorage.setJSON(`documents_cache_${currentEventId}`, docList);
      }
    } catch (err) {
      if (!event) {
        setError(err.response?.data?.message || err.message || "Failed to load event workspace.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentEventId) {
      const cachedEvt = getCachedEvent(currentEventId);
      if (cachedEvt) {
        setEvent(cachedEvt);
        setTasks(safeStorage.getJSON(`tasks_cache_${currentEventId}`) || []);
        setRisks(safeStorage.getJSON(`risks_cache_${currentEventId}`) || []);
        setVolunteers(safeStorage.getJSON(`volunteers_cache_${currentEventId}`) || []);
        setMeetings(safeStorage.getJSON(`meetings_cache_${currentEventId}`) || []);
        setDocuments(safeStorage.getJSON(`documents_cache_${currentEventId}`) || []);
        setLoading(false);
      }
      loadAllEventData();
    }
  }, [currentEventId]);

  // Handle RAG Ask Documents (POST /api/rag/query)
  const handleAskDocuments = async (e) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;

    setRagLoading(true);
    setRagAnswer(null);

    try {
      const response = await documentService.queryRAG({
        query: ragQuery,
        eventId: currentEventId,
      });
      const data = response?.data || response;
      setRagAnswer(data);
    } catch (err) {
      setRagAnswer({
        answer: err.response?.data?.message || err.message || "No relevant answers found in uploaded documents.",
        sources: [],
      });
    } finally {
      setRagLoading(false);
    }
  };

  // Handle Document Upload (POST /api/documents)
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadDocName.trim()) return;

    const newDoc = {
      title: uploadDocName.trim(),
      name: uploadDocName.trim().endsWith(`.${uploadDocType.toLowerCase()}`)
        ? uploadDocName.trim()
        : `${uploadDocName.trim()}.${uploadDocType.toLowerCase()}`,
      fileName: uploadDocName.trim().endsWith(`.${uploadDocType.toLowerCase()}`)
        ? uploadDocName.trim()
        : `${uploadDocName.trim()}.${uploadDocType.toLowerCase()}`,
      fileType: uploadDocType.toLowerCase(),
      type: uploadDocType,
      eventId: currentEventId,
    };

    try {
      const response = await documentService.uploadDocument(newDoc);
      const created = response?.data || response;
      if (created) {
        setDocuments((prev) => {
          const updated = [created, ...prev];
          safeStorage.setJSON(`documents_cache_${currentEventId}`, updated);
          return updated;
        });
      }
      setShowDocUpload(false);
      setUploadDocName("");
    } catch (err) {
      console.error("Document upload failed:", err);
      alert(err.response?.data?.message || "Document upload failed.");
    }
  };

  if (loading && !event) {
    return <Loading type="cards" count={3} message="Loading event workspace..." />;
  }

  if (!event && !loading) {
    return (
      <div className="empty-state" style={{ padding: 40 }}>
        <h2>Event not found</h2>
        <p>This event might have been removed or does not exist.</p>
        <Link to="/events" className="primary-button" style={{ display: "inline-flex", marginTop: 12 }}>
          Back to Events
        </Link>
      </div>
    );
  }

  if (error && !event) {
    return <ErrorMessage message={error} onRetry={loadAllEventData} />;
  }

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const openRisks = risks.filter((r) => r.status === "open").length;
  const availableVols = volunteers.filter((v) => v.availability === "available").length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 40;

  return (
    <div>
      {/* ── Event Workspace Header ── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Link to="/events" style={{ fontSize: 12.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
              Events <ChevronRight size={13} />
            </Link>
            <span className={`badge ${event?.status || "planning"}`}>
              {event?.status || "planning"}
            </span>
          </div>

          <h1 style={{ fontSize: 28, margin: "0 0 6px" }}>{event?.name || "Event Workspace"}</h1>
          <p style={{ maxWidth: 700 }}>{event?.description || "Central operational hub for coordinating tasks, volunteers, risks, and meetings."}</p>
        </div>

        <div className="page-header-actions">
          <button
            className="secondary-button"
            onClick={() => {
              if (activeTab === "documents") setShowDocUpload(true);
              else setTab("tasks");
            }}
          >
            <Plus size={15} />
            <span>{activeTab === "documents" ? "Upload Document" : "Add Task"}</span>
          </button>

          <Link to={currentEventId ? `/agent?eventId=${currentEventId}` : "/agent"} className="primary-button">
            <Sparkles size={15} />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* ── Metadata Summary Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "14px 20px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          marginBottom: 24,
          flexWrap: "wrap",
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        {event?.venue && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <MapPin size={15} style={{ color: "var(--color-primary)" }} />
            <strong>Venue:</strong> {event.venue}
          </span>
        )}

        {event?.startDate && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CalendarDays size={15} style={{ color: "var(--color-primary)" }} />
            <strong>Schedule:</strong> {new Date(event.startDate).toLocaleDateString()} – {event.endDate ? new Date(event.endDate).toLocaleDateString() : ""}
          </span>
        )}

        {event?.expectedParticipants > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Users size={15} style={{ color: "var(--color-primary)" }} />
            <strong>Attendees:</strong> {event.expectedParticipants}
          </span>
        )}

        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <strong style={{ color: "var(--text-primary)" }}>{progressPercentage}% Completed</strong>
          <div style={{ width: 80 }} className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
        </span>
      </div>

      {/* ── Workspace Sub-Tabs ── */}
      <div className="tab-nav">
        {[
          { key: "overview", label: "Overview", icon: Activity },
          { key: "tasks", label: `Tasks (${tasks.length})`, icon: CheckSquare },
          { key: "volunteers", label: `Volunteers (${volunteers.length})`, icon: Users },
          { key: "risks", label: `Risks (${risks.length})`, icon: ShieldAlert },
          { key: "meetings", label: `Meetings (${meetings.length})`, icon: MessageSquare },
          { key: "documents", label: `Documents (${documents.length})`, icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div>
          {/* Top Quick Stats */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <StatCard
              title="Event Progress"
              value={`${progressPercentage}%`}
              description={`${completedTasks} of ${tasks.length} tasks completed`}
              variant="emerald"
            />
            <StatCard
              title="Pending Tasks"
              value={pendingTasks}
              description="Needs action from assignees"
              variant="amber"
            />
            <StatCard
              title="Active Volunteers"
              value={availableVols}
              description={`${volunteers.length} total team leads`}
            />
            <StatCard
              title="Open Risks"
              value={openRisks}
              description={openRisks > 0 ? "Highest severity: High" : "Zero open risks"}
              variant={openRisks > 0 ? "rose" : "emerald"}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
            {/* Left: Upcoming Deadlines & Key Tasks */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>Upcoming Task Deadlines</h3>
                  <button onClick={() => setTab("tasks")} className="secondary-button button-sm">
                    View All Tasks
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tasks.slice(0, 4).map((t) => (
                    <TaskCard key={t._id || t.id} task={t} />
                  ))}
                </div>
              </section>

              {/* Open Risks */}
              <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>Critical & High Risks</h3>
                  <button onClick={() => setTab("risks")} className="secondary-button button-sm">
                    View Risk Register
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {risks.slice(0, 2).map((r) => (
                    <RiskCard key={r._id || r.id} risk={r} />
                  ))}
                </div>
              </section>
            </div>

            {/* Right: AI Insights & Volunteer Availability */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* AI Insights Card */}
              <div
                style={{
                  padding: 18,
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-ai-bg)",
                  border: "1px solid var(--color-ai-border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-ai-text)", marginBottom: 8 }}>
                  <Sparkles size={17} style={{ color: "var(--color-ai)" }} />
                  <strong style={{ fontSize: 13.5 }}>AI Operational Insights</strong>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 10px" }}>
                  AV testing deadline is approaching on Sep 20. Speaker confirmations are running on schedule.
                </p>
                <Link to="/ai-results" className="secondary-button button-sm">
                  View Full Meeting Analysis <ArrowUpRight size={12} />
                </Link>
              </div>

              {/* Volunteer Roster Widget */}
              <div
                style={{
                  padding: 18,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <strong style={{ fontSize: 14 }}>Volunteer Team Roster</strong>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{availableVols} Available</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {volunteers.slice(0, 4).map((vol) => {
                    const user = vol.userId;
                    const name = user?.name || vol.name || "Volunteer";
                    return (
                      <div
                        key={vol._id || vol.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 0",
                          borderBottom: "1px solid var(--border-subtle)",
                          fontSize: 13,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="user-avatar user-avatar-sm" style={{ width: 22, height: 22, fontSize: 10 }}>
                            {name[0].toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ display: "block", fontSize: 13 }}>{name}</strong>
                            <small style={{ color: "var(--text-muted)" }}>{vol.team || "General"}</small>
                          </div>
                        </div>

                        <span className={`badge ${vol.availability || "available"}`}>
                          {vol.availability || "available"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: TASKS ── */}
      {activeTab === "tasks" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Event Tasks</h3>
            <Link to={currentEventId ? `/tasks?eventId=${currentEventId}` : "/tasks"} className="secondary-button button-sm">
              Open Full Task Board <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="card-grid">
            {tasks.map((task) => (
              <TaskCard key={task._id || task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: VOLUNTEERS ── */}
      {activeTab === "volunteers" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Assigned Volunteers</h3>
            <Link to={currentEventId ? `/volunteers?eventId=${currentEventId}` : "/volunteers"} className="secondary-button button-sm">
              Manage All Volunteers <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Team</th>
                  <th>Availability</th>
                  <th>Skills</th>
                  <th>Assigned Tasks</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((vol) => {
                  const user = vol.userId;
                  const name = user?.name || vol.name || "Volunteer";
                  return (
                    <tr key={vol._id || vol.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="user-avatar user-avatar-sm">{name[0]}</div>
                          <strong>{name}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="badge medium">{vol.team || "General"}</span>
                      </td>
                      <td>
                        <span className={`badge ${vol.availability || "available"}`}>
                          {vol.availability || "available"}
                        </span>
                      </td>
                      <td>
                        {Array.isArray(vol.skills) ? vol.skills.join(", ") : "-"}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                          {vol.assignedTasks?.length || 0} tasks
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: RISKS ── */}
      {activeTab === "risks" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Event Risk Registry</h3>
            <Link to={currentEventId ? `/risks?eventId=${currentEventId}` : "/risks"} className="secondary-button button-sm">
              Open Risk Dashboard <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="card-grid">
            {risks.map((risk) => (
              <RiskCard key={risk._id || risk.id} risk={risk} />
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: MEETINGS ── */}
      {activeTab === "meetings" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Meeting Logs & AI Transcripts</h3>
            <Link to={currentEventId ? `/meetings?eventId=${currentEventId}` : "/meetings"} className="primary-button button-sm">
              + Process New Meeting
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {meetings.map((meeting) => (
              <div key={meeting._id} className="event-card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="badge completed" style={{ textTransform: "uppercase", fontSize: 11 }}>
                        AI Processed
                      </span>
                      <small style={{ color: "var(--text-muted)" }}>
                        {new Date(meeting.date).toLocaleDateString()}
                      </small>
                    </div>
                    <h3 style={{ fontSize: 16, margin: 0 }}>{meeting.title}</h3>
                  </div>

                  <Link to="/ai-results" className="secondary-button button-sm">
                    View AI Analysis <ArrowUpRight size={12} />
                  </Link>
                </div>

                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: "6px 0 12px" }}>
                  {meeting.summary}
                </p>

                <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Users size={13} />
                  <span>Participants: {meeting.participants?.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: DOCUMENTS / RAG ── */}
      {activeTab === "documents" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Event Knowledge Base & RAG</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                Upload contracts, venue rules, and schedules. Ask AI questions grounded in your documents.
              </p>
            </div>

            <button className="primary-button" onClick={() => setShowDocUpload(true)}>
              <Upload size={14} />
              <span>Upload Document</span>
            </button>
          </div>

          {/* Ask Documents (RAG) Query Box */}
          <div className="rag-ask-card">
            <div className="rag-ask-header">
              <Sparkles size={16} />
              <span>Ask Documents (Grounded RAG Intelligence)</span>
            </div>

            <form onSubmit={handleAskDocuments} className="rag-ask-form">
              <div className="rag-input-wrapper">
                <Search size={15} className="rag-input-icon" />
                <input
                  type="text"
                  placeholder="Ask anything about event contracts, venue safety rules, or schedule guidelines..."
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  className="rag-ask-input"
                  disabled={ragLoading}
                />
              </div>
              <button className="rag-search-button" disabled={ragLoading || !ragQuery.trim()}>
                {ragLoading ? (
                  <>
                    <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    <span>Search Docs</span>
                  </>
                )}
              </button>
            </form>

            {ragAnswer && (
              <div
                style={{
                  marginTop: 14,
                  padding: "14px 16px",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--color-primary-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-primary)", fontWeight: 600, fontSize: 11.5, marginBottom: 4 }}>
                  <CheckCircle2 size={13} />
                  GROUNDED AI ANSWER
                </div>
                <p style={{ margin: "0 0 8px", color: "var(--text-primary)" }}>{ragAnswer.answer}</p>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  Sources: {ragAnswer.sources.map((s) => (
                    <span key={s} className="badge low" style={{ marginLeft: 6, fontSize: 10.5 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Document Table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Event</th>
                  <th>Uploaded By</th>
                  <th>Processing Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const statusClass =
                    doc.status === "processed"
                      ? "completed"
                      : doc.status === "processing"
                      ? "ongoing"
                      : doc.status === "failed"
                      ? "critical"
                      : "pending";

                  return (
                    <tr key={doc._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <FileText size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: "var(--text-primary)" }}>{doc.name}</strong>
                            <small style={{ display: "block", color: "var(--text-muted)", fontSize: 11 }}>
                              {doc.size || "1.2 MB"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge medium" style={{ fontWeight: 700, fontSize: 10 }}>
                          {doc.type}
                        </span>
                      </td>
                      <td>{doc.event}</td>
                      <td>{doc.uploadedBy}</td>
                      <td>
                        <span className={`badge ${statusClass}`} style={{ textTransform: "capitalize" }}>
                          {doc.status}
                        </span>
                      </td>
                      <td>{new Date(doc.date).toLocaleDateString()}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="ghost-button button-sm"
                          onClick={() => alert(`Viewing metadata for ${doc.name}`)}
                          title="View Document"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Upload Document Modal */}
          {showDocUpload && (
            <div className="modal-backdrop" onClick={() => setShowDocUpload(false)}>
              <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Upload Event Document</h2>
                  <button className="modal-close-btn" onClick={() => setShowDocUpload(false)}>
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUploadDocument}>
                  <div className="modal-body">
                    <label>Document Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Auditorium Safety Guidelines 2026"
                      value={uploadDocName}
                      onChange={(e) => setUploadDocName(e.target.value)}
                      required
                    />

                    <label>Document Format *</label>
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value)}
                    >
                      <option value="PDF">PDF (.pdf)</option>
                      <option value="DOC">Word Document (.doc, .docx)</option>
                      <option value="TXT">Plain Text (.txt)</option>
                    </select>

                    <div
                      style={{
                        border: "2px dashed var(--border-hover)",
                        borderRadius: "var(--radius-md)",
                        padding: "24px 16px",
                        textAlign: "center",
                        background: "var(--bg-subtle)",
                        color: "var(--text-secondary)",
                        fontSize: 13,
                        marginTop: 10,
                      }}
                    >
                      <Upload size={24} style={{ color: "var(--color-primary)", margin: "0 auto 8px" }} />
                      <p style={{ margin: "0 0 4px", fontWeight: 600 }}>Click to browse or drop file here</p>
                      <small style={{ color: "var(--text-muted)" }}>Supports PDF, DOC, TXT up to 25MB</small>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setShowDocUpload(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="primary-button">
                      Upload & Index Document
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
