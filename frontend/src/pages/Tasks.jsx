import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckSquare,
  Plus,
  Search,
  CalendarDays,
  User,
  Sparkles,
  Bot,
  Clock,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  X,
  Edit2,
  Trash2,
  Layers,
  ArrowRight,
} from "lucide-react";

import taskService from "../services/taskService";
import { useEvent } from "../context/EventContext";

import TaskCard from "../components/TaskCard";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "medium", // low | medium | high | critical
  status: "pending", // pending | in_progress | completed | overdue | cancelled
  deadline: "",
  assignedTo: "", // user name / ID
  source: "manual",
};

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const urlEventId = searchParams.get("eventId");

  const { events, currentEventId, currentEvent, setCurrentEventId } = useEvent();
  const effectiveEventId = urlEventId || currentEventId;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync URL eventId with context if URL param exists
  useEffect(() => {
    if (urlEventId && urlEventId !== currentEventId) {
      setCurrentEventId(urlEventId);
    }
  }, [urlEventId, currentEventId, setCurrentEventId]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid | table

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null); // null = create
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Details modal
  const [selectedTask, setSelectedTask] = useState(null);

  /* ── Load Tasks ─────────────────────────── */
  const loadTasks = async () => {
    if (!effectiveEventId) {
      setLoading(false);
      setTasks([]);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const result = await taskService.getEventTasks(effectiveEventId);
      const list = result?.data?.tasks || result?.data || result || [];
      setTasks(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [effectiveEventId]);

  /* ── Open Create / Edit ───────────────────── */
  const openCreate = () => {
    setEditTask(null);
    setForm({ ...EMPTY_FORM, eventId: effectiveEventId });
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
      deadline: task.deadline ? task.deadline.slice(0, 16) : "",
      assignedTo:
        typeof task.assignedTo === "object"
          ? task.assignedTo?._id || task.assignedTo?.name || ""
          : task.assignedTo || "",
      source: task.source || "manual",
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
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status,
      deadline: form.deadline || undefined,
      eventId: effectiveEventId,
      source: form.source || "manual",
    };

    if (form.assignedTo && /^[0-9a-fA-F]{24}$/.test(form.assignedTo)) {
      payload.assignedTo = form.assignedTo;
    }

    try {
      if (editTask) {
        const res = await taskService.updateTask(editTask._id || editTask.id, payload);
        const updated = res?.data?.task || res?.data || res;
        setTasks((prev) =>
          prev.map((t) =>
            (t._id || t.id) === (editTask._id || editTask.id) ? updated : t
          )
        );
        if (selectedTask && (selectedTask._id || selectedTask.id) === (editTask._id || editTask.id)) {
          setSelectedTask(updated);
        }
      } else {
        const res = await taskService.createTask(payload);
        const created = res?.data?.task || res?.data || res;
        setTasks((prev) => [created, ...prev]);
      }
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save task.");
    } finally {
      setFormLoading(false);
    }
  };

  /* ── Status Transition ────────────────────── */
  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        (t._id || t.id) === taskId ? { ...t, status: newStatus } : t
      )
    );

    if (selectedTask && (selectedTask._id || selectedTask.id) === taskId) {
      setSelectedTask((prev) => ({ ...prev, status: newStatus }));
    }

    try {
      await taskService.updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  /* ── Delete Task ──────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await taskService.deleteTask(id);
      setTasks((prev) => prev.filter((t) => (t._id || t.id) !== id));
      if (selectedTask && (selectedTask._id || selectedTask.id) === id) {
        setSelectedTask(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to delete task.");
    }
  };

  // Filter computation
  const filteredTasks = tasks.filter((task) => {
    const isOverdue =
      task.status !== "completed" &&
      task.status !== "cancelled" &&
      task.deadline &&
      new Date(task.deadline) < new Date();

    const currentStatus = isOverdue ? "overdue" : task.status || "pending";

    const matchesStatus =
      statusFilter === "all" ||
      currentStatus === statusFilter ||
      task.status === statusFilter;

    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      (typeof task.assignedTo === "object"
        ? task.assignedTo?.name?.toLowerCase().includes(q)
        : task.assignedTo?.toLowerCase().includes(q));

    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (loading && tasks.length === 0) {
    return <Loading type="cards" count={6} message="Loading task workspace..." />;
  }

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className="status-pulse" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Work Coordination
            </span>
          </div>
          <h1>Tasks {currentEvent?.name ? `— ${currentEvent.name}` : ""}</h1>
          <p>Organize, assign, and track operational deliverables across your club.</p>
        </div>

        <div className="page-header-actions">
          <button className="primary-button" onClick={openCreate}>
            <Plus size={15} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadTasks} />}

      {/* ── Filter Bar & Search ── */}
      <div className="filter-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Active Event Context Selector */}
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

          {/* Search */}
          <div className="search-input-wrapper">
            <Search size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search tasks, assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Filters */}
          <div className="filter-pills">
            {["all", "pending", "in_progress", "completed", "overdue", "cancelled"].map((st) => (
              <button
                key={st}
                className={`filter-pill ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Priority Filters */}
          <div className="filter-pills">
            {["all", "low", "medium", "high", "critical"].map((pr) => (
              <button
                key={pr}
                className={`filter-pill ${priorityFilter === pr ? "active" : ""}`}
                onClick={() => setPriorityFilter(pr)}
                style={{ textTransform: "capitalize" }}
              >
                {pr}
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

      {/* ── Task Grid / Table Display ── */}
      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CheckSquare size={24} />
          </div>
          <h3>No tasks found</h3>
          <p>
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
              ? "No tasks match your current filter settings."
              : "Create your first operational task to get work assigned."}
          </p>
          <button className="primary-button" onClick={openCreate}>
            <Plus size={15} />
            <span>New Task</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="card-grid">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id || task.id}
              task={task}
              onEdit={openEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Deadline</th>
                <th>Source</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const id = task._id || task.id;
                const assignee =
                  typeof task.assignedTo === "object"
                    ? task.assignedTo?.name
                    : task.assignedTo;

                return (
                  <tr
                    key={id}
                    onClick={() => setSelectedTask(task)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <strong style={{ color: "var(--text-primary)" }}>{task.title}</strong>
                      {task.description && (
                        <small style={{ display: "block", color: "var(--text-muted)", fontSize: 11.5 }}>
                          {task.description.slice(0, 50)}...
                        </small>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${task.status || "pending"}`}>
                        {task.status || "pending"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${task.priority || "medium"}`}>
                        {task.priority || "medium"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className="user-avatar user-avatar-sm" style={{ width: 20, height: 20, fontSize: 9 }}>
                          {assignee ? assignee[0].toUpperCase() : "?"}
                        </div>
                        <span>{assignee || "Unassigned"}</span>
                      </div>
                    </td>
                    <td>
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}
                    </td>
                    <td>
                      {task.source === "ai_meeting" || task.aiGenerated ? (
                        <span className="badge ai-badge">AI Meeting</span>
                      ) : task.source === "ai_agent" ? (
                        <span className="badge ai-badge">AI Agent</span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Manual</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="ghost-button button-sm"
                        onClick={() => openEdit(task)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="danger-button button-sm"
                        onClick={() => handleDelete(id)}
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

      {/* ── CREATE / EDIT TASK MODAL ── */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editTask ? "Edit Task" : "Create New Task"}</h2>
              <button className="modal-close-btn" onClick={() => setShowForm(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && <div className="error-box">{formError}</div>}

                <label>Task Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Confirm audio-visual equipment setup"
                  required
                />

                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Specific requirements, vendor notes, and checklist..."
                  rows={3}
                />

                <div className="form-row">
                  <div>
                    <label>Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <label>Deadline</label>
                    <input
                      type="datetime-local"
                      value={form.deadline}
                      onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    />
                  </div>

                  <div>
                    <label>Assignee Name</label>
                    <input
                      value={form.assignedTo}
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                      placeholder="e.g. Rahul Patel or Alice Johnson"
                    />
                  </div>
                </div>

                <label>Task Source</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                >
                  <option value="manual">Manual Entry</option>
                  <option value="ai_meeting">AI Meeting Analysis</option>
                  <option value="ai_agent">AI Agent Command</option>
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
                <button type="submit" className="primary-button" disabled={formLoading}>
                  {formLoading ? "Saving..." : editTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TASK DETAILS MODAL / DRAWER ── */}
      {selectedTask && (
        <div className="modal-backdrop" onClick={() => setSelectedTask(null)}>
          <div
            className="modal-container"
            style={{ maxWidth: 620 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`badge ${selectedTask.status || "pending"}`}>
                  {selectedTask.status || "pending"}
                </span>
                <span className={`badge ${selectedTask.priority || "medium"}`}>
                  {selectedTask.priority || "medium"} priority
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTask(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* If generated from AI, show prominent badge */}
              {(selectedTask.source === "ai_meeting" || selectedTask.aiGenerated) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    background: "var(--color-ai-bg)",
                    border: "1px solid var(--color-ai-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-ai-text)",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  <Sparkles size={16} />
                  <span>Generated from AI Meeting Analysis</span>
                </div>
              )}

              {selectedTask.source === "ai_agent" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    background: "var(--color-ai-bg)",
                    border: "1px solid var(--color-ai-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-ai-text)",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  <Bot size={16} />
                  <span>Created by AI Agent</span>
                </div>
              )}

              <h2 style={{ fontSize: 20, margin: "0 0 10px", color: "var(--text-primary)" }}>
                {selectedTask.title}
              </h2>

              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 20px" }}>
                {selectedTask.description || "No detailed description provided."}
              </p>

              {/* Task Properties Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  padding: "16px",
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-default)",
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11.5, marginBottom: 2 }}>
                    Assignee
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="user-avatar user-avatar-sm" style={{ width: 20, height: 20, fontSize: 9 }}>
                      {typeof selectedTask.assignedTo === "object"
                        ? selectedTask.assignedTo?.name?.[0] || "?"
                        : selectedTask.assignedTo?.[0] || "?"}
                    </div>
                    <strong>
                      {typeof selectedTask.assignedTo === "object"
                        ? selectedTask.assignedTo?.name || "Unassigned"
                        : selectedTask.assignedTo || "Unassigned"}
                    </strong>
                  </div>
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11.5, marginBottom: 2 }}>
                    Deadline
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CalendarDays size={14} style={{ color: "var(--color-primary)" }} />
                    <strong>
                      {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleString() : "No deadline"}
                    </strong>
                  </div>
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11.5, marginBottom: 2 }}>
                    Created By
                  </span>
                  <span>{selectedTask.createdBy || "Rahul Patel"}</span>
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: 11.5, marginBottom: 2 }}>
                    Source Type
                  </span>
                  <span style={{ textTransform: "capitalize" }}>
                    {selectedTask.source?.replace("_", " ") || "Manual"}
                  </span>
                </div>
              </div>

              {/* Dependencies section */}
              <div style={{ marginBottom: 20 }}>
                <strong style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                  Dependencies
                </strong>
                {selectedTask.dependencies?.length ? (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)" }}>
                    {selectedTask.dependencies.map((dep, idx) => (
                      <li key={idx}>{dep}</li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    No blocking dependencies assigned.
                  </span>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="secondary-button button-sm"
                  onClick={() =>
                    handleStatusChange(
                      selectedTask._id || selectedTask.id,
                      selectedTask.status === "completed" ? "pending" : "completed"
                    )
                  }
                >
                  <CheckCircle2 size={13} style={{ color: selectedTask.status === "completed" ? "var(--color-success)" : "inherit" }} />
                  {selectedTask.status === "completed" ? "Mark Pending" : "Mark Completed"}
                </button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="secondary-button button-sm"
                  onClick={() => {
                    setSelectedTask(null);
                    openEdit(selectedTask);
                  }}
                >
                  <Edit2 size={13} />
                  Edit Task
                </button>

                <button
                  className="danger-button button-sm"
                  onClick={() => handleDelete(selectedTask._id || selectedTask.id)}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
