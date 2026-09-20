import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Bell,
  Menu,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEvent } from "../context/EventContext";
import notificationService from "../services/notificationService";

export default function Navbar({ onMenuToggle }) {
  const { user, club, logout } = useAuth();
  const { events, currentEventId, currentEvent, setCurrentEventId } = useEvent();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuRef = useRef(null);
  const eventMenuRef = useRef(null);

  useEffect(() => {
    notificationService.getNotifications()
      .then((res) => {
        const notifs = res?.data || res || [];
        if (Array.isArray(notifs)) {
          setUnreadCount(notifs.filter((n) => !n.read).length);
        }
      })
      .catch(() => {});
  }, []);

  const activeEvent = currentEvent || events.find((e) => (e._id || e.id) === currentEventId) || events[0];

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
    ? user.name.trim().split(" ").map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "CO"
    : "CO";

  const handleSelectEvent = (id) => {
    setCurrentEventId(id);
    setEventMenuOpen(false);

    // Update query parameters on contextual pages
    const pathname = location.pathname;
    if (pathname.startsWith("/events/")) {
      navigate(`/events/${id}`);
    } else if (pathname === "/tasks") {
      navigate(`/tasks?eventId=${id}`);
    } else if (pathname === "/risks") {
      navigate(`/risks?eventId=${id}`);
    } else if (pathname === "/volunteers") {
      navigate(`/volunteers?eventId=${id}`);
    } else if (pathname === "/agent") {
      navigate(`/agent?eventId=${id}`);
    } else if (pathname === "/dashboard") {
      navigate(`/dashboard?eventId=${id}`);
    }
  };

  const clubName = club?.name ? club.name.toUpperCase() : "CLUBOPS";

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
            <span>
              {(activeEvent?.clubId?.name || clubName).toUpperCase()} / {activeEvent?.name?.toUpperCase() || "SELECT EVENT"}
            </span>
            <ChevronDown size={13} style={{ opacity: 0.7 }} />
          </button>

          {eventMenuOpen && (
            <div className="navbar-event-dropdown">
              <div className="event-dropdown-header">SWITCH EVENT CONTEXT</div>
              {events.length > 0 ? (
                events.map((evt) => {
                  const evtId = evt._id || evt.id;
                  const isSelected = evtId === currentEventId;
                  const evtClub = evt.clubId?.name || "";
                  return (
                    <div
                      key={evtId}
                      onClick={() => handleSelectEvent(evtId)}
                      className={`event-dropdown-item ${isSelected ? "active" : ""}`}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "8px 12px" }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
                        {evtClub && (
                          <span style={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            {evtClub}
                          </span>
                        )}
                        <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: 13, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {evt.name}
                        </span>
                      </div>
                      <span className="event-status-tag" style={{ flexShrink: 0, textTransform: "capitalize" }}>
                        {evt.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="event-dropdown-item" style={{ opacity: 0.6, cursor: "default" }}>
                  <span>No events created yet</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-ref-right">
        {/* LIVE EVENT Link */}
        <Link
          to={activeEvent ? `/events/${activeEvent._id || activeEvent.id}` : "/events"}
          className="live-event-badge"
          title={`View Workspace for ${activeEvent?.name || "Event"}`}
        >
          LIVE EVENT: {activeEvent?.name ? activeEvent.name.slice(0, 18) + (activeEvent.name.length > 18 ? "..." : "") : "ACTIVE"}
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
                  {user?.name || "Krish Patel"}
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