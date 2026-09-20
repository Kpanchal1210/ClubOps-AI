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
  Copy,
  Check,
  Layers,
  BookOpen,
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

  // Document details / preview modal state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loadingDocDetails, setLoadingDocDetails] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState("content"); // 'content' | 'chunks'

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
        clubId: event?.clubId?._id || (typeof event?.clubId === "string" ? event.clubId : undefined),
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

  // Handle Opening Document Details & Transcript Modal
  const handleOpenDocument = async (doc) => {
    if (!doc) return;
    setSelectedDoc(doc);
    setLoadingDocDetails(true);
    setActiveDocTab("content");
    setCopiedContent(false);

    try {
      const docId = doc._id || doc.id;
      if (docId) {
        const res = await documentService.getDocument(docId);
        const fetchedDoc = res?.data || res;
        if (fetchedDoc) {
          setSelectedDoc(fetchedDoc);
        }
      }
    } catch (err) {
      console.error("Failed to fetch full document details:", err);
    } finally {
      setLoadingDocDetails(false);
    }
  };

  // Handle Copying Transcript or Raw Document Content
  const handleCopyDocContent = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  // Handle Asking AI about this specific document
  const handleAskAboutDoc = (doc) => {
    const docName = doc.title || doc.fileName || "this document";
    const promptQuery = `Summarize the operational directives and decisions in "${docName}"`;
    setRagQuery(promptQuery);
    setSelectedDoc(null);
    setTimeout(() => {
      const ragInput = document.getElementById("event-rag-input");
      if (ragInput) {
        ragInput.focus();
        ragInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  // Handle Deleting Document
  const handleDeleteDocument = async (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${docTitle}"? This will also remove its indexed vector chunks.`)) {
      return;
    }
    try {
      await documentService.deleteDocument(docId);
      setDocuments((prev) => {
        const updated = prev.filter((d) => (d._id || d.id) !== docId);
        safeStorage.setJSON(`documents_cache_${currentEventId}`, updated);
        return updated;
      });
      if (selectedDoc && (selectedDoc._id || selectedDoc.id) === docId) {
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert(err.response?.data?.message || "Failed to delete document");
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
                  id="event-rag-input"
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
                  padding: "16px 18px",
                  background: "var(--bg-subtle, #090a0f)",
                  border: "1px solid var(--color-primary-border, rgba(99, 102, 241, 0.3))",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-primary)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    <CheckCircle2 size={14} />
                    <span>Grounded Document Intelligence</span>
                  </div>
                  <button
                    type="button"
                    className="ghost-button button-sm"
                    onClick={() => setRagAnswer(null)}
                    style={{ fontSize: 11, padding: "2px 6px", color: "var(--text-muted)" }}
                    title="Dismiss answer"
                  >
                    ✕ Dismiss
                  </button>
                </div>

                <div style={{ 
                  color: "var(--text-primary)", 
                  whiteSpace: "pre-wrap", 
                  wordBreak: "break-word",
                  lineHeight: 1.65,
                  fontSize: 13 
                }}>
                  {ragAnswer.answer}
                </div>

                {/* Sources list */}
                {((ragAnswer.sourceFiles && ragAnswer.sourceFiles.length > 0) || (ragAnswer.sources && ragAnswer.sources.length > 0)) && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-default, rgba(255, 255, 255, 0.08))", fontSize: 11.5, color: "var(--text-muted)", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>Sources:</span>
                    {(ragAnswer.sourceFiles || ragAnswer.sources).map((s, idx) => {
                      const label = typeof s === "string" ? s : (s.title || s.fileName || `Doc ${idx + 1}`);
                      const key = typeof s === "string" ? `${s}-${idx}` : (s.documentId ? `${s.documentId}-${idx}` : idx);
                      return (
                        <span key={key} className="badge low" style={{ fontSize: 10.5, padding: "2px 8px" }}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}
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
                  const docTitle = doc.title || doc.name || doc.fileName || "Document";
                  const docType = (doc.fileType || doc.type || "TXT").toUpperCase();
                  const isProcessed = doc.processed || doc.status === "processed";
                  const statusClass = isProcessed
                    ? "completed"
                    : doc.status === "processing"
                    ? "ongoing"
                    : doc.status === "failed"
                    ? "critical"
                    : "pending";

                  const uploaderName = doc.uploadedBy?.name || doc.uploadedBy?.email || (typeof doc.uploadedBy === "string" ? doc.uploadedBy : "Organizer");
                  const eventDisplayName = doc.eventId?.name || doc.event || event?.name || "General";
                  const docDate = doc.createdAt || doc.date || new Date();

                  return (
                    <tr key={doc._id}>
                      <td>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                          onClick={() => handleOpenDocument(doc)}
                          title="Click to view document details & transcript"
                        >
                          <FileText size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: "var(--text-primary)" }}>{docTitle}</strong>
                            <small style={{ display: "block", color: "var(--text-muted)", fontSize: 11 }}>
                              {doc.fileName ? `${doc.fileName} • ` : ""}{doc.size || (doc.content ? `${doc.content.length} chars` : "1.2 MB")}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge medium" style={{ fontWeight: 700, fontSize: 10 }}>
                          {docType}
                        </span>
                      </td>
                      <td>{eventDisplayName}</td>
                      <td>{uploaderName}</td>
                      <td>
                        <span className={`badge ${statusClass}`} style={{ textTransform: "capitalize" }}>
                          {isProcessed ? "Processed" : doc.status || "Pending"}
                        </span>
                      </td>
                      <td>{new Date(docDate).toLocaleDateString()}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            className="ghost-button button-sm"
                            onClick={() => handleOpenDocument(doc)}
                            title="View Document Details & Content"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px" }}
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          <button
                            className="ghost-button button-sm"
                            onClick={() => handleDeleteDocument(doc._id, docTitle)}
                            title="Delete Document"
                            style={{ color: "var(--text-muted)", padding: "4px 6px" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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

          {/* Document Preview & Details Modal */}
          {selectedDoc && (
            <div className="modal-backdrop" onClick={() => setSelectedDoc(null)}>
              <div
                className="modal-container doc-viewer-container"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="modal-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 6,
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <FileText size={20} />
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <h2 style={{ margin: 0, fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {selectedDoc.title || selectedDoc.fileName || "Document Details"}
                      </h2>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap", fontSize: 11.5, color: "var(--text-muted)" }}>
                        <span>{selectedDoc.fileName || "document.txt"}</span>
                        <span>•</span>
                        <span className="badge medium" style={{ fontSize: 10, padding: "2px 6px" }}>
                          {(selectedDoc.fileType || "TXT").toUpperCase()}
                        </span>
                        <span>•</span>
                        <span className={`badge ${selectedDoc.processed ? "completed" : "pending"}`} style={{ fontSize: 10, padding: "2px 6px" }}>
                          {selectedDoc.processed ? "RAG Indexed" : "Pending Ingestion"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="modal-close-btn" onClick={() => setSelectedDoc(null)}>
                    ✕
                  </button>
                </div>

                {/* Metadata Grid */}
                <div className="doc-viewer-meta-grid">
                  <div>
                    <span className="doc-viewer-meta-label">Event Context</span>
                    <span className="doc-viewer-meta-val">{selectedDoc.eventId?.name || event?.name || "General"}</span>
                  </div>
                  <div>
                    <span className="doc-viewer-meta-label">Uploaded By</span>
                    <span className="doc-viewer-meta-val">{selectedDoc.uploadedBy?.name || selectedDoc.uploadedBy?.email || "Organizer"}</span>
                  </div>
                  <div>
                    <span className="doc-viewer-meta-label">Upload Date</span>
                    <span className="doc-viewer-meta-val">{new Date(selectedDoc.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="doc-viewer-meta-label">RAG Vector Chunks</span>
                    <span className="doc-viewer-meta-val" style={{ color: selectedDoc.chunks?.length ? "#10b981" : "var(--text-muted)" }}>
                      {selectedDoc.chunks?.length ? `${selectedDoc.chunks.length} Chunks Embedded` : "0 Chunks"}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="doc-viewer-tabs">
                  <button
                    type="button"
                    className={`doc-viewer-tab-btn ${activeDocTab === "content" ? "active" : ""}`}
                    onClick={() => setActiveDocTab("content")}
                  >
                    <BookOpen size={14} />
                    <span>Document Transcript / Content</span>
                  </button>
                  <button
                    type="button"
                    className={`doc-viewer-tab-btn ${activeDocTab === "chunks" ? "active" : ""}`}
                    onClick={() => setActiveDocTab("chunks")}
                  >
                    <Layers size={14} />
                    <span>Indexed RAG Chunks ({selectedDoc.chunks?.length || 0})</span>
                  </button>
                </div>

                {/* Body Content */}
                <div className="modal-body" style={{ flex: 1, overflowY: "auto", padding: "18px 24px" }}>
                  {loadingDocDetails && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 36, color: "var(--text-muted)" }}>
                      <Loader2 size={18} className="spin-slow" />
                      <span>Loading complete document details...</span>
                    </div>
                  )}

                  {!loadingDocDetails && activeDocTab === "content" && (() => {
                    const docText = selectedDoc.content || (selectedDoc.chunks && selectedDoc.chunks.length > 0 ? selectedDoc.chunks.map((c) => c.text).join("\n\n") : "");
                    return (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            Document Content Stream ({docText ? `${docText.length} characters` : "No text extracted"})
                          </span>
                          {docText && (
                            <button
                              type="button"
                              className="secondary-button button-sm"
                              onClick={() => handleCopyDocContent(docText)}
                              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 8px" }}
                            >
                              {copiedContent ? <Check size={13} style={{ color: "#10b981" }} /> : <Copy size={13} />}
                              <span>{copiedContent ? "Copied!" : "Copy Content"}</span>
                            </button>
                          )}
                        </div>

                        {docText ? (
                          <pre className="doc-content-pre">
                            {docText}
                          </pre>
                        ) : (
                          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                            <FileText size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                            <p style={{ margin: 0, fontSize: 14 }}>No extracted text available for this document.</p>
                            <small style={{ color: "var(--text-muted)" }}>This file may be binary or pending text extraction.</small>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {!loadingDocDetails && activeDocTab === "chunks" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {(!selectedDoc.chunks || selectedDoc.chunks.length === 0) ? (
                        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                          <Layers size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                          <p style={{ margin: 0, fontSize: 14 }}>No RAG chunks indexed yet.</p>
                          <small style={{ color: "var(--text-muted)" }}>Trigger processing to generate semantic vector embeddings for this document.</small>
                        </div>
                      ) : (
                        selectedDoc.chunks.map((chunk, idx) => (
                          <div key={chunk._id || idx} className="doc-chunk-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }}>
                                Chunk #{chunk.chunkIndex !== undefined ? chunk.chunkIndex + 1 : idx + 1}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                {chunk.text ? `${chunk.text.length} chars` : ""}
                              </span>
                            </div>
                            <p style={{
                              margin: 0,
                              fontSize: 12.5,
                              lineHeight: 1.55,
                              color: "var(--text-secondary)",
                              whiteSpace: "pre-wrap",
                              fontFamily: "var(--font-mono, monospace)",
                            }}>
                              {chunk.text}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px" }}>
                  <button
                    type="button"
                    className="primary-button button-sm"
                    onClick={() => handleAskAboutDoc(selectedDoc)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Sparkles size={14} />
                    <span>Ask AI About This Document</span>
                  </button>

                  <button
                    type="button"
                    className="secondary-button button-sm"
                    onClick={() => setSelectedDoc(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
