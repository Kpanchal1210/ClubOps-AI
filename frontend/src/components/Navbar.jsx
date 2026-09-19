import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  Bell,
  Menu,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { mockNotifications, mockEvents } from "../mockData";
import { safeStorage } from "../utils/storage";

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const eventMenuRef = useRef(null);

  const eventId = safeStorage.getItem("eventId", "mock-event-1");
  const activeEvent = mockEvents.find((e) => (e._id || e.id) === eventId) || mockEvents[0];
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (eventMenuRef.current && !eventMenuRef.current.contains(e.target)) {
        setEventMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitials = typeof user?.name === "string" && user.name.trim()
    ? user.name.trim().split(" ").map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "KP"
    : "KP";

  const handleSelectEvent = (id) => {
    safeStorage.setItem("eventId", id);
    setEventMenuOpen(false);
    navigate(0); // Refresh context
  };

  return (
    <header className="navbar-reference">
      <div className="navbar-ref-left">
        {/* Mobile menu toggle button */}
        <button
          className="mobile-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={16} />
        </button>

        {/* Brand Logo & Title */}
        <Link to="/dashboard" className="brand-badge-link">
          <div className="brand-square-logo">C</div>
          <div className="brand-text-block">
            <span className="brand-main-title">CLUBOPS</span>
            <span className="brand-sub-title">OPS DASHBOARD / V1.0</span>
          </div>
        </Link>

        {/* Vertical Divider */}
        <div className="navbar-pipe-divider" />

        {/* Event Context Dropdown */}
        <div style={{ position: "relative" }} ref={eventMenuRef}>
          <button
            type="button"
            className="navbar-event-pill-btn"
            onClick={() => setEventMenuOpen(!eventMenuOpen)}
            title="Switch Event Context"
          >
            <span>CODING CLUB / {activeEvent?.name?.toUpperCase() || "HACKATHON 2026"}</span>
            <ChevronDown size={13} style={{ opacity: 0.7 }} />
          </button>

          {eventMenuOpen && (
            <div className="navbar-event-dropdown">
              <div className="event-dropdown-header">SWITCH EVENT CONTEXT</div>
              {mockEvents.map((evt) => (
                <div
                  key={evt.id || evt._id}
                  onClick={() => handleSelectEvent(evt.id || evt._id)}
                  className={`event-dropdown-item ${(evt.id || evt._id) === eventId ? "active" : ""}`}
                >
                  <span>{evt.name}</span>
                  <span className="event-status-tag">{evt.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-ref-right">
        {/* LIVE EVENT Pill */}
        <Link to="/events" className="live-event-badge">
          LIVE EVENT
        </Link>

        {/* Green Status Square */}
        <div className="status-square-live" title="Systems Active" />

        {/* Notifications Icon with sharp red square count */}
        <Link
          to="/notifications"
          className="navbar-square-action"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={15} />
          {unreadCount > 0 && <span className="square-count-badge">{unreadCount}</span>}
        </Link>

        {/* User Avatar Square with Menu */}
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            type="button"
            className="navbar-avatar-square"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User profile menu"
          >
            {userInitials}
          </button>

          {userMenuOpen && (
            <div className="navbar-user-dropdown">
              <div className="user-dropdown-header">
                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13 }}>
                  {user?.name || "Karan Panchal"}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
                  ROLE: {user?.role?.toUpperCase() || "ORGANIZER"}
                </div>
              </div>

              <Link
                to="/agent"
                onClick={() => setUserMenuOpen(false)}
                className="user-dropdown-link"
              >
                <Sparkles size={13} style={{ color: "var(--color-primary)" }} />
                <span>AI Workspace</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="user-dropdown-link danger"
              >
                <LogOut size={13} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}