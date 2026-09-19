import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Sparkles,
  Plus,
  Users,
  CalendarDays,
  FileText,
  ArrowUpRight,
  Eye,
  CheckCircle2,
  Clock,
  X,
  FileCode,
} from "lucide-react";

import meetingService from "../services/meetingService";
import { mockMeetings, mockAIResult } from "../mockData";
import { safeStorage } from "../utils/storage";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function Meetings() {
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState(mockMeetings);
  const [eventId] = useState(() => safeStorage.getItem("eventId", "mock-event-1"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    date: "",
    eventId: safeStorage.getItem("eventId", "mock-event-1"),
    transcript: "",
  });
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (DEV_MODE) {
      setMeetings(mockMeetings);
      return;
    }

    meetingService
      .getEventMeetings(eventId)
      .then((res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setMeetings(list);
        } else {
          setMeetings(mockMeetings);
        }
      })
      .catch(() => setMeetings(mockMeetings));
  }, [eventId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePreFillDemo = () => {
    setForm({
      title: "Core Logistics & Keynote Speaker Alignment",
      date: new Date().toISOString().slice(0, 16),
      eventId,
      transcript: `Rahul: Hi team, let's align on the Tech Fest schedule.
Alice: We've locked the Main Auditorium for Oct 1st to 3rd. We need David to test the stage PA system and projectors by Sep 22.
Carol: I spoke with Dr. Sharma. Keynote travel is booked, but we must confirm the dietary preferences by Sep 25.
Rahul: Risk check: Catering contract is still pending. We must sign before Sep 24 to avoid delay penalties.
David: I will coordinate the AV team and run sound checks.`,
    });
  };

  const createMeeting = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setFormError("");

    // Dev mode simulation
    if (DEV_MODE) {
      setTimeout(() => {
        const newMeeting = {
          _id: `meeting-${Date.now()}`,
          eventId: form.eventId,
          title: form.title,
          date: form.date || new Date().toISOString(),
          participants: ["Rahul Patel", "Alice Johnson", "David Lee", "Carol White"],
          status: "processed",
          summary: `Discussion covering auditorium setup, keynote travel schedule, and catering contract finalization.`,
          transcript: form.transcript,
        };

        // Store active AI result
        const generatedResult = {
          ...mockAIResult,
          _id: `ai-${Date.now()}`,
          meetingId: newMeeting._id,
          analysis: {
            summary: `Planning meeting finalized Main Auditorium dates and AV testing milestones. Identified critical contract deadline for catering.`,
            tasks: [
              {
                title: "Test stage PA system & projectors",
                description: "Run sound checks and audio testing in Main Auditorium.",
                priority: "high",
                deadline: "2026-09-22",
                ownerId: "user-4",
              },
              {
                title: "Confirm speaker dietary preferences",
                description: "Gather hospitality details for keynote Dr. Sharma.",
                priority: "medium",
                deadline: "2026-09-25",
                ownerId: "user-3",
              },
            ],
            risks: [
              {
                title: "Catering contract penalty risk",
                description: "Contract must be finalized before Sep 24 to secure delivery.",
                severity: "high",
                probability: "medium",
                recommendedAction: "Authorize and execute catering vendor agreement immediately.",
              },
            ],
            decisions: [
              "Auditorium reserved for Oct 1–3.",
              "David will lead AV coordination.",
            ],
            actionItems: [
              "David to run AV tests by Sep 22.",
              "Carol to confirm hospitality by Sep 25.",
            ],
          },
        };

        safeStorage.setItem("aiResult", JSON.stringify(generatedResult));
        setMeetings((prev) => [newMeeting, ...prev]);
        setProcessing(false);
        setShowSubmitModal(false);
        navigate("/ai-results");
      }, 700);
      return;
    }

    try {
      const response = await meetingService.createMeeting({
        title: form.title,
        date: form.date || undefined,
        eventId: form.eventId,
        transcript: form.transcript,
      });

      const data = response?.data || response;
      const meetingId = data?._id || data?.id;

      if (meetingId) {
        const processResponse = await meetingService.processMeeting(meetingId);
        const processed = processResponse?.data || processResponse;
        safeStorage.setItem("aiResult", JSON.stringify(processed));
      }

      setMeetings((prev) => [data, ...prev]);
      setShowSubmitModal(false);
      navigate("/ai-results");
    } catch (err) {
      setFormError(err.response?.data?.message || "Meeting analysis failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className="status-pulse" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Meeting Intelligence
            </span>
          </div>
          <h1>Meetings</h1>
          <p>Extract actionable tasks, detect hidden risks, and preserve key organizational decisions from transcripts.</p>
        </div>

        <div className="page-header-actions">
          <button className="primary-button" onClick={() => setShowSubmitModal(true)}>
            <Plus size={15} />
            <span>Process New Meeting</span>
          </button>
        </div>
      </div>

      {/* ── Meetings List ── */}
      {meetings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MessageSquare size={24} />
          </div>
          <h3>No meetings logged yet</h3>
          <p>Paste a meeting transcript to let AI extract tasks, risks, and decisions automatically.</p>
          <button className="primary-button" onClick={() => setShowSubmitModal(true)}>
            <Plus size={15} />
            <span>Process Meeting</span>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {meetings.map((m) => {
            const isProcessed = m.status === "processed" || true;

            return (
              <div
                key={m._id}
                className="event-card"
                style={{ padding: "20px 24px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className="badge completed" style={{ textTransform: "uppercase", fontSize: 11 }}>
                        <Sparkles size={11} /> AI Processed
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(m.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h2 style={{ fontSize: 17, margin: 0, fontWeight: 700 }}>
                      {m.title}
                    </h2>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      className="secondary-button button-sm"
                      onClick={() => setSelectedTranscript(m)}
                    >
                      <Eye size={13} />
                      View Transcript
                    </button>

                    <Link to="/ai-results" className="primary-button button-sm">
                      <Sparkles size={13} />
                      View Analysis
                    </Link>
                  </div>
                </div>

                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55, margin: "8px 0 14px" }}>
                  {m.summary}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border-subtle)",
                    fontSize: 12.5,
                    color: "var(--text-muted)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Users size={14} />
                    <span>
                      Participants:{" "}
                      <strong style={{ color: "var(--text-primary)" }}>
                        {m.participants ? m.participants.join(", ") : "Rahul Patel, Alice Johnson"}
                      </strong>
                    </span>
                  </div>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={14} style={{ color: "var(--color-success)" }} />
                    <span>Tasks Extracted</span>
                  </div>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={14} style={{ color: "var(--color-success)" }} />
                    <span>Risks Flagged</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PROCESS NEW MEETING MODAL ── */}
      {showSubmitModal && (
        <div className="modal-backdrop" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-container" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Meeting for AI Analysis</h2>
              <button className="modal-close-btn" onClick={() => setShowSubmitModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={createMeeting}>
              <div className="modal-body">
                {formError && <div className="error-box">{formError}</div>}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ margin: 0 }}>Meeting Title *</label>
                  <button
                    type="button"
                    onClick={handlePreFillDemo}
                    style={{ fontSize: 11.5, color: "var(--color-primary)", fontWeight: 600, textDecoration: "underline" }}
                  >
                    Paste Sample Transcript
                  </button>
                </div>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Tech Fest Budget & Venue Sync"
                  required
                />

                <div className="form-row">
                  <div>
                    <label>Meeting Date</label>
                    <input
                      type="datetime-local"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label>Event ID</label>
                    <input
                      name="eventId"
                      value={form.eventId}
                      onChange={handleChange}
                      placeholder="Event Context ID"
                      required
                    />
                  </div>
                </div>

                <label>Meeting Transcript *</label>
                <textarea
                  name="transcript"
                  value={form.transcript}
                  onChange={handleChange}
                  placeholder="Paste the full meeting transcript, chat log, or speaker notes. AI will extract tasks, risks, deadlines, and key decisions."
                  rows={8}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={processing || !form.transcript.trim()}>
                  {processing ? (
                    <>
                      <Sparkles size={14} className="spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Run AI Analysis
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW TRANSCRIPT MODAL ── */}
      {selectedTranscript && (
        <div className="modal-backdrop" onClick={() => setSelectedTranscript(null)}>
          <div className="modal-container" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedTranscript.title}</h2>
                <small style={{ color: "var(--text-muted)" }}>
                  Transcript Log · {new Date(selectedTranscript.date).toLocaleString()}
                </small>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTranscript(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  padding: 16,
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-default)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  maxHeight: 350,
                  overflowY: "auto",
                }}
              >
                {selectedTranscript.transcript || "No raw transcript recorded."}
              </div>
            </div>

            <div className="modal-footer">
              <Link to="/ai-results" className="primary-button button-sm">
                <Sparkles size={13} />
                View Extracted Results
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
