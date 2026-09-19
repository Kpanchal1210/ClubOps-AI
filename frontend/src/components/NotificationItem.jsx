import {
  Bell,
  CheckSquare,
  Clock,
  ShieldAlert,
  Megaphone,
  CalendarDays,
  Check,
} from "lucide-react";

export default function NotificationItem({
  notification,
  onRead,
}) {
  const id = notification._id || notification.id;

  const getIconAndClass = () => {
    switch (notification.type) {
      case "task_assigned":
        return { icon: <CheckSquare size={16} />, className: "" };
      case "task_deadline":
        return { icon: <Clock size={16} />, className: "warning" };
      case "risk_detected":
        return { icon: <ShieldAlert size={16} />, className: "danger" };
      case "announcement":
        return { icon: <Megaphone size={16} />, className: "" };
      case "event_update":
        return { icon: <CalendarDays size={16} />, className: "" };
      default:
        return { icon: <Bell size={16} />, className: "" };
    }
  };

  const { icon, className } = getIconAndClass();

  const formattedTime = notification.createdAt
    ? new Date(notification.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className={`notification-item ${
        notification.read ? "read" : "unread"
      }`}
    >
      <div className={`notification-icon ${className}`}>
        {icon}
      </div>

      <div className="notification-content">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
          <h3>{notification.title}</h3>
          <small>{formattedTime}</small>
        </div>

        <p>{notification.message}</p>
      </div>

      {!notification.read && onRead && (
        <button
          className="ghost-button button-sm"
          onClick={() => onRead(id)}
          title="Mark as read"
          style={{ alignSelf: "center", flexShrink: 0 }}
        >
          <Check size={13} />
          Mark read
        </button>
      )}
    </div>
  );
}