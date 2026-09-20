import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Search,
  Plus,
  LayoutGrid,
  List,
  MapPin,
  Users,
  CheckSquare,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  Sparkles,
  X,
} from "lucide-react";

import eventService from "../services/eventService";
import { safeStorage } from "../utils/storage";
import { useEvent } from "../context/EventContext";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const EMPTY_FORM = {
  name: "",
  description: "",
  venue: "",
  startDate: "",
  endDate: "",
  expectedParticipants: "",
  expectedVolunteers: "",
  status: "planning", // planning | ongoing | completed | cancelled
};

export default function Events() {
  const navigate = useNavigate();
  const { setCurrentEventId, refreshEvents } = useEvent();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | planning | ongoing | completed | cancelled
  const [viewMode, setViewMode] = useState("grid"); // grid | table

  // Create form modal
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  /* ── Load events ──────────────────────────── */
  const loadEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await eventService.getAllEvents();
      const list = result?.data?.events || result?.data || result || [];
      setEvents(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  /* ── Open event ───────────────────────────── */
  const handleOpen = (id) => {
    setCurrentEventId(id);
    navigate(`/events/${id}`);
  };

  /* ── Create event ─────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const newEventData = {
      ...form,
      expectedParticipants: Number(form.expectedParticipants) || 0,
      expectedVolunteers: Number(form.expectedVolunteers) || 0,
    };

    try {
      const result = await eventService.createEvent(newEventData);
      const created = result?.data?.event || result?.data || result;
      if (created) {
        setEvents((prev) => [created, ...prev]);
        const newId = created._id || created.id;
        setCurrentEventId(newId);
        refreshEvents();
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to create event.");
    } finally {
      setFormLoading(false);
    }
  };

  // Filter & Search computation
  const filteredEvents = events.filter((evt) => {
    const matchesStatus = statusFilter === "all" || evt.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      evt.name?.toLowerCase().includes(q) ||
      evt.venue?.toLowerCase().includes(q) ||
      evt.description?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const getProgressPercentage = (status) => {
    switch (status) {
      case "completed":
        return 100;
      case "ongoing":
        return 65;
      case "cancelled":
        return 0;
      default:
        return 30; // planning
    }
  };

  if (loading && events.length === 0) {
    return <Loading type="cards" count={3} message="Loading events..." />;
  }

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className="status-pulse" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Project Management
            </span>
          </div>
          <h1>Events</h1>
          <p>Create, manage, and coordinate all operations across club events.</p>
        </div>

        <div className="page-header-actions">
          <button className="primary-button" onClick={() => setShowForm(true)}>
            <Plus size={15} />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={loadEvents} />
      )}

      {/* ── Filter Bar & Controls ── */}
      <div className="filter-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Search */}
          <div className="search-input-wrapper">
            <Search size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by name, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ color: "var(--text-muted)" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Pills */}
          <div className="filter-pills">
            {["all", "planning", "ongoing", "completed", "cancelled"].map((status) => (
              <button
                key={status}
                className={`filter-pill ${statusFilter === status ? "active" : ""}`}
                onClick={() => setStatusFilter(status)}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* View mode toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: "3px",
            gap: "2px",
          }}
        >
          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              color: viewMode === "grid" ? "var(--color-primary)" : "var(--text-muted)",
              background: viewMode === "grid" ? "var(--color-primary-light)" : "transparent",
              display: "flex",
              alignItems: "center",
            }}
            title="Grid View"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode("table")}
            style={{
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              color: viewMode === "table" ? "var(--color-primary)" : "var(--text-muted)",
              background: viewMode === "table" ? "var(--color-primary-light)" : "transparent",
              display: "flex",
              alignItems: "center",
            }}
            title="Table View"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* ── Create Event Modal ── */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Event</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowForm(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {formError && <div className="error-box">{formError}</div>}

                <label>Event Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Annual Tech Fest 2026"
                  required
                />

                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Goals, target audience, and overview of the event"
                  rows={3}
                />

                <label>Venue / Location</label>
                <input
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder="e.g. Main Auditorium, Block A"
                />

                <div className="form-row">
                  <div>
                    <label>Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label>End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <label>Expected Attendees</label>
                    <input
                      type="number"
                      min="0"
                      value={form.expectedParticipants}
                      onChange={(e) => setForm({ ...form, expectedParticipants: e.target.value })}
                      placeholder="e.g. 500"
                    />
                  </div>

                  <div>
                    <label>Volunteers Required</label>
                    <input
                      type="number"
                      min="0"
                      value={form.expectedVolunteers}
                      onChange={(e) => setForm({ ...form, expectedVolunteers: e.target.value })}
                      placeholder="e.g. 40"
                    />
                  </div>
                </div>

                <label>Operational Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="planning">Planning</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={formLoading}
                >
                  {formLoading ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Event List Display ── */}
      {filteredEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CalendarDays size={24} />
          </div>
          <h3>No events found</h3>
          <p>
            {searchQuery || statusFilter !== "all"
              ? "No events match your current filter criteria."
              : "Create your first event to start managing your club operations."}
          </p>
          <button className="primary-button" onClick={() => setShowForm(true)}>
            <Plus size={15} />
            <span>Create Event</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Card View */
        <div className="card-grid">
          {filteredEvents.map((event) => {
            const id = event._id || event.id;
            const progress = getProgressPercentage(event.status);

            return (
              <div key={id} className="event-card">
                <div className="card-top">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className={`badge ${event.status || "planning"}`}>
                        {event.status || "planning"}
                      </span>
                      {event.startDate && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {new Date(event.startDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <h3>{event.name}</h3>
                  </div>
                </div>

                <p className="card-description">
                  {event.description || "No description provided."}
                </p>

                {/* Progress Bar */}
                <div style={{ margin: "6px 0 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)", marginBottom: 4 }}>
                    <span>Operational Progress</span>
                    <strong style={{ color: "var(--text-primary)" }}>{progress}%</strong>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div
                      className={`progress-bar-fill ${progress === 100 ? "success" : ""}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Event Metadata */}
                <div className="task-meta">
                  <div className="task-meta-row">
                    {event.venue && (
                      <span className="task-meta-item">
                        <MapPin size={13} />
                        {event.venue}
                      </span>
                    )}

                    {event.expectedParticipants > 0 && (
                      <span className="task-meta-item">
                        <Users size={13} />
                        {event.expectedParticipants} attendees
                      </span>
                    )}
                  </div>

                  <div className="task-meta-row" style={{ marginTop: 4 }}>
                    <span className="task-meta-item" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                      <CheckSquare size={13} />
                      6 tasks
                    </span>
                    <span className="task-meta-item" style={{ color: "var(--color-danger)", fontWeight: 500 }}>
                      <ShieldAlert size={13} />
                      2 risks
                    </span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="primary-button"
                    style={{ width: "100%" }}
                    onClick={() => handleOpen(id)}
                  >
                    Open Workspace <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High-Density Table View */
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Status</th>
                <th>Dates</th>
                <th>Venue</th>
                <th>Attendees</th>
                <th>Volunteers</th>
                <th>Progress</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const id = event._id || event.id;
                const progress = getProgressPercentage(event.status);

                return (
                  <tr key={id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {event.name}
                      </div>
                      <small style={{ color: "var(--text-muted)", fontSize: 11.5 }}>
                        {event.description?.slice(0, 45)}...
                      </small>
                    </td>
                    <td>
                      <span className={`badge ${event.status || "planning"}`}>
                        {event.status || "planning"}
                      </span>
                    </td>
                    <td>
                      {event.startDate
                        ? new Date(event.startDate).toLocaleDateString()
                        : "TBD"}
                    </td>
                    <td>{event.venue || "TBD"}</td>
                    <td>{event.expectedParticipants || "-"}</td>
                    <td>{event.expectedVolunteers || "-"}</td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-bar-wrapper" style={{ margin: 0 }}>
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{progress}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="secondary-button button-sm"
                        onClick={() => handleOpen(id)}
                      >
                        Open <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
