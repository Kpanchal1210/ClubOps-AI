import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  CheckSquare,
  ShieldAlert,
  Clock,
  Megaphone,
  CalendarDays,
  Sparkles,
  Inbox,
} from "lucide-react";

import notificationService from "../services/notificationService";
import { mockNotifications } from "../mockData";

import NotificationItem from "../components/NotificationItem";
import Loading from "../components/Loading";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all"); // all | unread | tasks | risks | announcements

  /* ── Load Notifications ─────────────────── */
  useEffect(() => {
    if (DEV_MODE) {
      setNotifications(mockNotifications);
      setLoading(false);
      return;
    }

    notificationService
      .getNotifications()
      .then((res) => setNotifications(res?.data || res || mockNotifications))
      .catch(() => setNotifications(mockNotifications))
      .finally(() => setLoading(false));
  }, []);

  /* ── Mark Single Read ───────────────────── */
  const handleMarkRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => ((n._id || n.id) === id ? { ...n, read: true } : n))
    );

    if (DEV_MODE) return;

    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Mark All Read ──────────────────────── */
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    if (DEV_MODE) return;

    notifications
      .filter((n) => !n.read)
      .forEach((n) => {
        notificationService.markAsRead(n._id || n.id).catch(console.error);
      });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Category filter computation
  const filteredNotifications = notifications.filter((n) => {
    if (filterType === "unread") return !n.read;
    if (filterType === "tasks") return n.type === "task_assigned" || n.type === "task_deadline";
    if (filterType === "risks") return n.type === "risk_detected";
    if (filterType === "announcements") return n.type === "announcement" || n.type === "event_update";
    return true; // all
  });

  if (loading && notifications.length === 0) {
    return <Loading type="cards" count={4} message="Fetching notifications..." />;
  }

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className="status-pulse" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Alert Center
            </span>
          </div>
          <h1>Notifications</h1>
          <p>
            {unreadCount > 0
              ? `You have ${unreadCount} unread operational update${unreadCount > 1 ? "s" : ""}.`
              : "You are all caught up on club operations."}
          </p>
        </div>

        {unreadCount > 0 && (
          <div className="page-header-actions">
            <button className="secondary-button" onClick={handleMarkAllRead}>
              <CheckCheck size={15} />
              <span>Mark All as Read</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="filter-bar">
        <div className="filter-pills">
          <button
            className={`filter-pill ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Updates ({notifications.length})
          </button>

          <button
            className={`filter-pill ${filterType === "unread" ? "active" : ""}`}
            onClick={() => setFilterType("unread")}
          >
            Unread ({unreadCount})
          </button>

          <button
            className={`filter-pill ${filterType === "tasks" ? "active" : ""}`}
            onClick={() => setFilterType("tasks")}
          >
            <CheckSquare size={13} style={{ marginRight: 4 }} />
            Tasks & Deadlines
          </button>

          <button
            className={`filter-pill ${filterType === "risks" ? "active" : ""}`}
            onClick={() => setFilterType("risks")}
          >
            <ShieldAlert size={13} style={{ marginRight: 4 }} />
            Risk Alerts
          </button>

          <button
            className={`filter-pill ${filterType === "announcements" ? "active" : ""}`}
            onClick={() => setFilterType("announcements")}
          >
            <Megaphone size={13} style={{ marginRight: 4 }} />
            Announcements
          </button>
        </div>
      </div>

      {/* ── Notifications Feed ── */}
      {filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Inbox size={24} />
          </div>
          <h3>No notifications in this category</h3>
          <p>New task assignments, deadline alerts, and risk detections will appear here.</p>
        </div>
      ) : (
        <div className="notification-list">
          {filteredNotifications.map((item) => (
            <NotificationItem
              key={item._id || item.id}
              notification={item}
              onRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
