import {
  CalendarDays,
  CheckSquare,
  Clock,
  ShieldAlert,
  Users,
  Activity,
  Layers,
} from "lucide-react";

export default function StatCard({
  title,
  value,
  description,
  trend,
  variant,
  icon: CustomIcon,
}) {
  // Derive icon automatically if not passed
  const getIcon = () => {
    if (CustomIcon) return <CustomIcon size={16} />;
    const t = (title || "").toLowerCase();
    if (t.includes("event")) return <CalendarDays size={16} />;
    if (t.includes("completed")) return <CheckSquare size={16} />;
    if (t.includes("pending") || t.includes("overdue")) return <Clock size={16} />;
    if (t.includes("risk")) return <ShieldAlert size={16} />;
    if (t.includes("volunteer")) return <Users size={16} />;
    if (t.includes("task")) return <CheckSquare size={16} />;
    return <Layers size={16} />;
  };

  const getVariantClass = () => {
    if (variant) return variant;
    const t = (title || "").toLowerCase();
    if (t.includes("completed") || t.includes("active")) return "emerald";
    if (t.includes("pending") || t.includes("overdue")) return "amber";
    if (t.includes("risk")) return "rose";
    return "";
  };

  const variantClass = getVariantClass();

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        <div className={`stat-icon-badge ${variantClass}`}>
          {getIcon()}
        </div>
      </div>

      <h2 className="stat-value">{value ?? 0}</h2>

      {(description || trend) && (
        <div className="stat-meta">
          {trend && (
            <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
              {trend}
            </span>
          )}
          {description && <span>{description}</span>}
        </div>
      )}
    </div>
  );
}