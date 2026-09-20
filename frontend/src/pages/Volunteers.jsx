import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  X,
  Mail,
  UserCheck,
  CheckSquare,
} from "lucide-react";

import volunteerService from "../services/volunteerService";
import { useEvent } from "../context/EventContext";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

export default function Volunteers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlEventId = searchParams.get("eventId");
  const { events, currentEventId, currentEvent, setCurrentEventId } = useEvent();
  const effectiveEventId = urlEventId || currentEventId;

  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync URL eventId with context if URL param exists
  useEffect(() => {
    if (urlEventId && urlEventId !== currentEventId) {
      setCurrentEventId(urlEventId);
    }
  }, [urlEventId, currentEventId, setCurrentEventId]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all"); // all | available | busy | unavailable
  const [teamFilter, setTeamFilter] = useState("all");

  // Add Volunteer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    team: "Logistics",
    skills: "",
    availability: "available",
  });

  const loadVolunteers = async () => {
    if (!effectiveEventId) {
      setLoading(false);
      setVolunteers([]);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const result = await volunteerService.getEventVolunteers(effectiveEventId);
      const list = result?.data?.volunteers || result?.data || result || [];
      setVolunteers(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load volunteers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, [effectiveEventId]);

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      const skillsArray = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const payload = {
        eventId: effectiveEventId,
        name: form.name.trim(),
        team: form.team,
        skills: skillsArray,
        availability: form.availability,
      };

      const result = await volunteerService.createVolunteer(payload);
      const created = result?.data?.volunteer || result?.data || result;
      if (created) {
        setVolunteers((prev) => [created, ...prev]);
      }
      setShowAddModal(false);
      setForm({ name: "", team: "Logistics", skills: "", availability: "available" });
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to add volunteer.");
    }
  };

  const handleToggleAvailability = async (volId, newStatus) => {
    setVolunteers((prev) =>
      prev.map((v) =>
        (v._id || v.id) === volId ? { ...v, availability: newStatus } : v
      )
    );

    try {
      await volunteerService.updateVolunteer(volId, { availability: newStatus });
    } catch (err) {
      console.error("Failed to update availability:", err);
    }
  };

  // Filter computation
  const filteredVolunteers = volunteers.filter((vol) => {
    const user = vol.userId;
    const name = user?.name || vol.name || "";
    const team = vol.team || "";
    const skills = Array.isArray(vol.skills) ? vol.skills.join(" ") : "";

    const matchesAvailability =
      availabilityFilter === "all" || vol.availability === availabilityFilter;
    const matchesTeam = teamFilter === "all" || vol.team === teamFilter;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      name.toLowerCase().includes(q) ||
      team.toLowerCase().includes(q) ||
      skills.toLowerCase().includes(q);

    return matchesAvailability && matchesTeam && matchesSearch;
  });

  const teamsList = Array.from(
    new Set(volunteers.map((v) => v.team).filter(Boolean))
  );

  const availableCount = volunteers.filter((v) => v.availability === "available").length;
  const busyCount = volunteers.filter((v) => v.availability === "busy").length;
  const unavailableCount = volunteers.filter((v) => v.availability === "unavailable").length;

  if (loading && volunteers.length === 0) {
    return <Loading type="table" count={5} message="Loading volunteer roster..." />;
  }

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className="status-pulse" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              People & Rosters
            </span>
          </div>
          <h1>Volunteers {currentEvent?.name ? `— ${currentEvent.name}` : ""}</h1>
          <p>Organize committee teams, track skill sets, and balance volunteer task assignments.</p>
        </div>

        <div className="page-header-actions">
          <button className="primary-button" onClick={() => setShowAddModal(true)}>
            <Plus size={15} />
            <span>Add Volunteer</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadVolunteers} />}

      {/* ── Metric Summary Cards ── */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span className="stat-title">Total Volunteers</span>
          <h3 className="stat-value" style={{ fontSize: 24, margin: "4px 0" }}>{volunteers.length}</h3>
          <small style={{ color: "var(--text-muted)", fontSize: 11.5 }}>Registered across teams</small>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span className="stat-title">Available Now</span>
          <h3 className="stat-value" style={{ fontSize: 24, margin: "4px 0", color: "var(--color-success)" }}>{availableCount}</h3>
          <small style={{ color: "var(--text-muted)", fontSize: 11.5 }}>Ready for assignment</small>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span className="stat-title">Busy on Tasks</span>
          <h3 className="stat-value" style={{ fontSize: 24, margin: "4px 0", color: "var(--color-warning)" }}>{busyCount}</h3>
          <small style={{ color: "var(--text-muted)", fontSize: 11.5 }}>Currently allocated</small>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span className="stat-title">Unavailable</span>
          <h3 className="stat-value" style={{ fontSize: 24, margin: "4px 0", color: "var(--text-muted)" }}>{unavailableCount}</h3>
          <small style={{ color: "var(--text-muted)", fontSize: 11.5 }}>Off schedule</small>
        </div>
      </div>

      {/* ── Filter Bar & Search ── */}
      <div className="filter-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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
                height: 32,
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

          <div className="search-input-wrapper">
            <Search size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by volunteer, team, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Availability Pills */}
          <div className="filter-pills">
            {["all", "available", "busy", "unavailable"].map((av) => (
              <button
                key={av}
                className={`filter-pill ${availabilityFilter === av ? "active" : ""}`}
                onClick={() => setAvailabilityFilter(av)}
                style={{ textTransform: "capitalize" }}
              >
                {av}
              </button>
            ))}
          </div>

          {/* Team Filter */}
          {teamsList.length > 0 && (
            <div className="filter-pills">
              <button
                className={`filter-pill ${teamFilter === "all" ? "active" : ""}`}
                onClick={() => setTeamFilter("all")}
              >
                All Teams
              </button>
              {teamsList.map((tm) => (
                <button
                  key={tm}
                  className={`filter-pill ${teamFilter === tm ? "active" : ""}`}
                  onClick={() => setTeamFilter(tm)}
                >
                  {tm}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Volunteers Table ── */}
      {filteredVolunteers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={24} />
          </div>
          <h3>No volunteers found</h3>
          <p>
            {searchQuery || availabilityFilter !== "all" || teamFilter !== "all"
              ? "No volunteers match the current search or filters."
              : "Register your first club volunteer to build your event roster."}
          </p>
          <button className="primary-button" onClick={() => setShowAddModal(true)}>
            <Plus size={15} />
            <span>Add Volunteer</span>
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Volunteer</th>
                <th>Team</th>
                <th>Skills & Tags</th>
                <th>Availability</th>
                <th>Assigned Deliverables</th>
                <th style={{ textAlign: "right" }}>Quick Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVolunteers.map((volunteer) => {
                const id = volunteer._id || volunteer.id;
                const user = volunteer.userId;
                const name = user?.name || volunteer.name || "Unknown Volunteer";
                const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                const skills = Array.isArray(volunteer.skills) ? volunteer.skills : [];
                const tasksCount = volunteer.assignedTasks?.length || 0;

                return (
                  <tr key={id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="user-avatar">{initials}</div>
                        <div>
                          <strong style={{ display: "block", color: "var(--text-primary)" }}>{name}</strong>
                          <small style={{ color: "var(--text-muted)", fontSize: 11.5 }}>
                            Volunteer Lead
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge medium" style={{ fontWeight: 600 }}>
                        {volunteer.team || "General Logistics"}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {skills.length ? (
                          skills.map((sk, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: "2px 8px",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--bg-subtle)",
                                border: "1px solid var(--border-default)",
                                fontSize: 11.5,
                                color: "var(--text-secondary)",
                              }}
                            >
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${volunteer.availability || "available"}`}>
                        {volunteer.availability || "available"}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          color: tasksCount > 0 ? "var(--color-primary)" : "var(--text-muted)",
                        }}
                      >
                        <CheckSquare size={14} />
                        {tasksCount} assigned
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <select
                        value={volunteer.availability || "available"}
                        onChange={(e) => handleToggleAvailability(id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-default)",
                          fontSize: 12,
                          background: "var(--bg-surface)",
                          color: "var(--text-primary)",
                          outline: "none",
                          cursor: "pointer",
                          margin: 0,
                          width: "auto",
                        }}
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ADD VOLUNTEER MODAL ── */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register New Volunteer</h2>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVolunteer}>
              <div className="modal-body">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Maya Lin"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />

                <label>Assigned Team *</label>
                <select
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                >
                  <option value="Logistics">Logistics & Venue</option>
                  <option value="Media">Media & Publicity</option>
                  <option value="Registration">Registration & Desk</option>
                  <option value="Technical">Technical & AV</option>
                  <option value="Hospitality">Hospitality & Catering</option>
                  <option value="Sponsorship">Sponsorship & Finance</option>
                </select>

                <label>Skills & Qualifications (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Photography, Audio Setup, Excel"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />

                <label>Availability Status</label>
                <select
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Volunteer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
