import {
  CalendarDays,
  User,
  Clock,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onClick,
}) {
  const taskId = task._id || task.id;

  const isOverdue =
    task.status !== "completed" &&
    task.status !== "cancelled" &&
    task.deadline &&
    new Date(task.deadline) < new Date();

  const effectiveStatus = isOverdue ? "overdue" : (task.status || "pending");

  const getSourceBadge = () => {
    if (task.source === "ai_meeting" || (task.aiGenerated && task.source !== "ai_agent")) {
      return (
        <span className="badge ai-badge" title="Extracted from AI Meeting Analysis">
          <Sparkles size={11} />
          AI Meeting
        </span>
      );
    }
    if (task.source === "ai_agent") {
      return (
        <span className="badge ai-badge" title="Created by AI Agent">
          <Bot size={11} />
          AI Agent
        </span>
      );
    }
    return null;
  };

  const getAssigneeName = () => {
    if (!task.assignedTo) return "Unassigned";
    if (typeof task.assignedTo === "object") return task.assignedTo.name || "Unassigned";
    return task.assignedTo;
  };

  const assigneeName = getAssigneeName();
  const initials = assigneeName !== "Unassigned"
    ? assigneeName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div
      className="task-card"
      onClick={() => onClick && onClick(task)}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="card-top">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span className={`badge ${effectiveStatus}`}>
              {effectiveStatus.replace("_", " ")}
            </span>
            <span className={`badge ${task.priority || "medium"}`}>
              {task.priority || "medium"}
            </span>
            {getSourceBadge()}
          </div>
          <h3>{task.title}</h3>
        </div>
      </div>

      {task.description && (
        <p className="card-description">{task.description}</p>
      )}

      <div className="task-meta">
        <div className="task-meta-row">
          <div className="task-meta-item">
            <div className="user-avatar user-avatar-sm" title={assigneeName}>
              {initials}
            </div>
            <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
              {assigneeName}
            </span>
          </div>

          {task.deadline && (
            <div
              className="task-meta-item"
              style={{
                color: isOverdue ? "var(--color-danger)" : "var(--text-secondary)",
                fontWeight: isOverdue ? 600 : 400,
              }}
            >
              <CalendarDays size={13} />
              <span>{new Date(task.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {(onEdit || onDelete || onStatusChange) && (
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          {onStatusChange && (
            <button
              className="secondary-button button-sm"
              onClick={() =>
                onStatusChange(
                  taskId,
                  task.status === "completed" ? "pending" : "completed"
                )
              }
              title={task.status === "completed" ? "Mark incomplete" : "Mark completed"}
            >
              <CheckCircle2 size={13} style={{ color: task.status === "completed" ? "var(--color-success)" : "inherit" }} />
              {task.status === "completed" ? "Completed" : "Complete"}
            </button>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {onEdit && (
              <button
                className="ghost-button button-sm"
                onClick={() => onEdit(task)}
                title="Edit task"
              >
                <Edit2 size={13} />
                Edit
              </button>
            )}

            {onDelete && (
              <button
                className="danger-button button-sm"
                onClick={() => onDelete(taskId)}
                title="Delete task"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}