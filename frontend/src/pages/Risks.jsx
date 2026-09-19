import { useEffect, useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  Plus,
  Filter,
  Sparkles,
  CheckCircle2,
  X,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  ArrowRight,
  User,
} from "lucide-react";

import riskService from "../services/riskService";
import { mockRisks } from "../mockData";
import { safeStorage } from "../utils/storage";

import RiskCard from "../components/RiskCard";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

const EMPTY_FORM = {
  title: "",
  description: "",
  severity: "medium", // low | medium | high | critical
  probability: "medium", // low | medium | high
  status: "open", // open | investigating | resolved | ignored
  detectedBy: "manual",
  recommendedAction: "",
  assignedTo: "",
};

export default function Risks() {
  // Initialize with mockRisks directly to eliminate blank screens on cold starts
  const [risks, setRisks] = useState(mockRisks);
  const [eventId] = useState(() => safeStorage.getItem("eventId", "mock-event-1"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detectedFilter, setDetectedFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid | table

  // Create / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editRisk, setEditRisk] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  /* ── Load Risks ─────────────────────────── */
  const loadRisks = async () => {
    if (DEV_MODE) {
      setRisks(mockRisks);
      setLoading(false);
      return;
    }

    try {
      const result = await riskService.getEventRisks(eventId);
      const list = result?.data || result || [];
      setRisks(list.length ? list : mockRisks);
    } catch (err) {
      setRisks(mockRisks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRisks();
  }, [eventId]);

  /* ── Open Create / Edit ───────────────────── */
  const openCreate = () => {
    setEditRisk(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (risk) => {
    setEditRisk(risk);
    setForm({
      title: risk.title || "",
      description: risk.description || "",
      severity: risk.severity || "medium",
      probability: risk.probability || "medium",
      status: risk.status || "open",
      detectedBy: risk.detectedBy || "manual",
      recommendedAction: risk.recommendedAction || "",
      assignedTo:
        typeof risk.assignedTo === "object"
          ? risk.assignedTo?.name || ""
          : risk.assignedTo || "",
    });
    setFormError("");
    setShowForm(true);
  };

  /* ── Submit Form ──────────────────────────── */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const payload = {
      ...form,
      eventId,
      assignedTo: form.assignedTo ? { name: form.assignedTo } : null,
    };

    if (DEV_MODE) {
      const mockId = editRisk ? editRisk._id || editRisk.id : `r${Date.now()}`;
      const saved = { ...payload, _id: mockId };

      if (editRisk) {
        setRisks((prev) =>
          prev.map((r) => ((r._id || r.id) === mockId ? saved : r))
        );
      } else {
        setRisks((prev) => [saved, ...prev]);
      }
      setShowForm(false);
      setFormLoading(false);
      return;
    }

    try {
      if (editRisk) {
        const res = await riskService.updateRisk(editRisk._id || editRisk.id, payload);
        const updated = res?.data || res;
        setRisks((prev) =>
          prev.map((r) =>
            (r._id || r.id) === (editRisk._id || editRisk.id) ? updated : r
          )
        );
      } else {
        const res = await riskService.createRisk(payload);
        const created = res?.data || res;
        setRisks((prev) => [created, ...prev]);
      }
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save risk.");
    } finally {
      setFormLoading(false);
    }
  };

  /* ── Resolve Risk ─────────────────────────── */
  const handleResolve = async (id) => {
    setRisks((prev) =>
      prev.map((r) => ((r._id || r.id) === id ? { ...r, status: "resolved" } : r))
    );

    if (DEV_MODE) return;

    try {
      await riskService.updateRisk(id, { status: "resolved" });
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Delete Risk ──────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this risk?")) return;

    setRisks((prev) => prev.filter((r) => (r._id || r.id) !== id));

    if (DEV_MODE) return;

    try {
      await riskService.deleteRisk(id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete risk.");
    }
  };

  // Severity counts
  const criticalCount = risks.filter((r) => r.severity === "critical").length;
  const highCount = risks.filter((r) => r.severity === "high").length;
  const mediumCount = risks.filter((r) => r.severity === "medium").length;
  const lowCount = risks.filter((r) => r.severity === "low").length;

  // Filter computation
  const filteredRisks = risks.filter((risk) => {
    const matchesSeverity =
      severityFilter === "all" || risk.severity === severityFilter;
    const matchesStatus =
      statusFilter === "all" || risk.status === statusFilter;
    const matchesDetected =
      detectedFilter === "all" ||
      (detectedFilter === "ai" && (risk.detectedBy === "ai" || risk.detectedBy === "AI")) ||
      (detectedFilter === "manual" && risk.detectedBy !== "ai" && risk.detectedBy !== "AI");

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      risk.title?.toLowerCase().includes(q) ||
      risk.description?.toLowerCase().includes(q) ||
      risk.recommendedAction?.toLowerCase().includes(q);

    return matchesSeverity && matchesStatus && matchesDetected && matchesSearch;
  });

  if (loading && risks.length === 0) {
    return <Loading type="cards" count={4} message="Loading risk register..." />;
  }

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className="status-pulse" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Risk Assessment & Governance
            </span>
          </div>
          <h1>Risk Dashboard</h1>
          <p>Identify, monitor, and mitigate operational blockers and event liabilities.</p>
        </div>

        <div className="page-header-actions">
          <button className="primary-button" onClick={openCreate}>
            <Plus size={15} />
            <span>Report Risk</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadRisks} />}

      {/* ── Severity Metric Cards ── */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: "16px 20px" }}>
          <span className="stat-title">Critical Severity</span>
          <h3 className="stat-value" style={{ fontSize: 26, margin: "4px 0", color: "var(--color-danger)" }}>
            {criticalCount}
          </h3>
          <small style={{ color: "var(--text-muted)", fontSize: 11.5 }}>Requires immediate mitigation</small>
        </div>

        <div className="stat-card" style={{ padding: "16px 20px" }}>
          <span className="stat-title">High Severity</span>
          <h3 className="stat-value" style={{ fontSize: 26, margin: "4px 0", color: "#c2410c" }}>
            {highCount}
          </h3>
          <small style={{ color: "var(--text-muted)", fontSize: 11.5 }}>Active monitoring required</small>
        </div>

        <div className="stat-card" style={{ padding: "16px 20px" }}>
          <span className="stat-title">Medium Severity</span>
          <h3 className="stat-value" style={{ fontSize: 26, margin: "4px 0", color: "var(--color-warning-text)" }}>
            {mediumCount}
          </h3>
          <small style={{ color: "var(--text-muted)", fontSize: 11.5 }}>Contingency planned</small>
        </div>

        <div className="stat-card" style={{ padding: "16px 20px" }}>
          <span className="stat-title">Low Severity</span>
          <h3 className="stat-value" style={{ fontSize: 26, margin: "4px 0", color: "var(--color-success)" }}>
            {lowCount}
          </h3>
          <small style={{ color: "var(--text-muted)", fontSize: 11.5 }}>Minor impact items</small>
        </div>
      </div>

      {/* ── Filter Bar & Search ── */}
      <div className="filter-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="search-input-wrapper">
            <Search size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search risks, actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Severity Filters */}
          <div className="filter-pills">
            {["all", "critical", "high", "medium", "low"].map((sev) => (
              <button
                key={sev}
                className={`filter-pill ${severityFilter === sev ? "active" : ""}`}
                onClick={() => setSeverityFilter(sev)}
                style={{ textTransform: "capitalize" }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="filter-pills">
            {["all", "open", "investigating", "resolved"].map((st) => (
              <button
                key={st}
                className={`filter-pill ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
                style={{ textTransform: "capitalize" }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Detection Source Filters */}
          <div className="filter-pills">
            <button
              className={`filter-pill ${detectedFilter === "all" ? "active" : ""}`}
              onClick={() => setDetectedFilter("all")}
            >
              All Sources
            </button>
            <button
              className={`filter-pill ${detectedFilter === "ai" ? "active" : ""}`}
              onClick={() => setDetectedFilter("ai")}
            >
              <Sparkles size={11} style={{ marginRight: 4 }} />
              AI Detected
            </button>
            <button
              className={`filter-pill ${detectedFilter === "manual" ? "active" : ""}`}
              onClick={() => setDetectedFilter("manual")}
            >
              Manual
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
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

      {/* ── Risks Display ── */}
      {filteredRisks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ShieldAlert size={24} />
          </div>
          <h3>No risks detected</h3>
          <p>
            {searchQuery || severityFilter !== "all" || statusFilter !== "all"
              ? "No risks match your filter parameters."
              : "All systems operational with zero active risks logged."}
          </p>
          <button className="primary-button" onClick={openCreate}>
            <Plus size={15} />
            <span>Report Risk</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="card-grid">
          {filteredRisks.map((risk) => (
            <RiskCard
              key={risk._id || risk.id}
              risk={risk}
              onEdit={openEdit}
              onResolve={handleResolve}
            />
          ))}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Risk Title</th>
                <th>Severity</th>
                <th>Probability</th>
                <th>Status</th>
                <th>Detected By</th>
                <th>Assigned Lead</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.map((risk) => {
                const id = risk._id || risk.id;
                const assigned =
                  typeof risk.assignedTo === "object"
                    ? risk.assignedTo?.name
                    : risk.assignedTo;
                const isAI = risk.detectedBy === "ai" || risk.detectedBy === "AI";

                return (
                  <tr key={id}>
                    <td>
                      <strong style={{ color: "var(--text-primary)" }}>{risk.title}</strong>
                      {risk.recommendedAction && (
                        <small style={{ display: "block", color: "var(--text-muted)", fontSize: 11.5 }}>
                          Action: {risk.recommendedAction.slice(0, 50)}...
                        </small>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${risk.severity || "medium"}`}>
                        {risk.severity || "medium"}
                      </span>
                    </td>
                    <td>
                      <span style={{ textTransform: "capitalize", fontSize: 13 }}>
                        {risk.probability || "Medium"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${risk.status || "open"}`}>
                        {risk.status || "open"}
                      </span>
                    </td>
                    <td>
                      {isAI ? (
                        <span className="badge ai-badge">
                          <Sparkles size={11} /> AI
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Manual</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className="user-avatar user-avatar-sm" style={{ width: 18, height: 18, fontSize: 9 }}>
                          {assigned ? assigned[0].toUpperCase() : "?"}
                        </div>
                        <span>{assigned || "Unassigned"}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {risk.status !== "resolved" && (
                        <button
                          className="secondary-button button-sm"
                          onClick={() => handleResolve(id)}
                          style={{ marginRight: 6 }}
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        className="ghost-button button-sm"
                        onClick={() => openEdit(risk)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="danger-button button-sm"
                        onClick={() => handleDelete(id)}
                        style={{ marginLeft: 4 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── REPORT / EDIT RISK MODAL ── */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editRisk ? "Update Risk Assessment" : "Report Operational Risk"}</h2>
              <button className="modal-close-btn" onClick={() => setShowForm(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && <div className="error-box">{formError}</div>}

                <label>Risk Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Venue sound licensing confirmation pending"
                  required
                />

                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe potential impact and likelihood factors..."
                  rows={3}
                />

                <div className="form-row">
                  <div>
                    <label>Severity Level</label>
                    <select
                      value={form.severity}
                      onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    >
                      <option value="low">Low Impact</option>
                      <option value="medium">Medium Impact</option>
                      <option value="high">High Severity</option>
                      <option value="critical">Critical Severity</option>
                    </select>
                  </div>

                  <div>
                    <label>Probability</label>
                    <select
                      value={form.probability}
                      onChange={(e) => setForm({ ...form, probability: e.target.value })}
                    >
                      <option value="low">Low Probability</option>
                      <option value="medium">Medium Probability</option>
                      <option value="high">High Probability</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <label>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="open">Open</option>
                      <option value="investigating">Under Investigation</option>
                      <option value="resolved">Resolved</option>
                      <option value="ignored">Ignored</option>
                    </select>
                  </div>

                  <div>
                    <label>Assigned Lead</label>
                    <input
                      value={form.assignedTo}
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                      placeholder="e.g. Rahul Patel"
                    />
                  </div>
                </div>

                <label>Recommended Mitigation Action *</label>
                <textarea
                  value={form.recommendedAction}
                  onChange={(e) => setForm({ ...form, recommendedAction: e.target.value })}
                  placeholder="Concrete steps required to eliminate or mitigate this risk..."
                  rows={2}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={formLoading}>
                  {formLoading ? "Saving..." : editRisk ? "Save Changes" : "Log Risk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
