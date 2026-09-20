import { X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useEvent } from "../context/EventContext";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { currentEventId } = useEvent();

  const navigationItems = [
    { label: "OVERVIEW", number: "01", path: currentEventId ? `/dashboard?eventId=${currentEventId}` : "/dashboard" },
    { label: "TASKS", number: "02", path: currentEventId ? `/tasks?eventId=${currentEventId}` : "/tasks" },
    { label: "RISKS", number: "03", path: currentEventId ? `/risks?eventId=${currentEventId}` : "/risks" },
    { label: "VOLUNTEERS", number: "04", path: currentEventId ? `/volunteers?eventId=${currentEventId}` : "/volunteers" },
    { label: "MEETINGS", number: "05", path: currentEventId ? `/meetings?eventId=${currentEventId}` : "/meetings" },
    { label: "DOCUMENTS", number: "06", path: currentEventId ? `/events/${currentEventId}?tab=documents` : "/events", alias: "/documents" },
    { label: "AI AGENT", number: "07", path: currentEventId ? `/agent?eventId=${currentEventId}` : "/agent" },
    { label: "NOTIFICATIONS", number: "08", path: "/notifications" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 90 }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-nav-container">
          <nav className="editorial-nav">
            {navigationItems.map(({ label, number, path, alias }) => {
              const basePath = path.split("?")[0];
              const isActive =
                location.pathname === basePath ||
                (alias && location.pathname === alias) ||
                (path.includes("tab=documents") && location.search.includes("tab=documents")) ||
                (basePath === "/dashboard" && location.pathname === "/");

              return (
                <NavLink
                  key={label}
                  to={path}
                  onClick={onClose}
                  className={`editorial-nav-item ${isActive ? "active" : ""}`}
                >
                  <span className="editorial-nav-label">{label}</span>
                  <span className="editorial-nav-number">{number}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Technical Status */}
        <Link
          to="/agent"
          onClick={onClose}
          className="sidebar-bottom-status"
          style={{ textDecoration: "none", display: "block", cursor: "pointer" }}
        >
          <div className="ai-status-indicator">
            <span className="status-square-green">■</span>
            <span>AI AGENT READY</span>
          </div>
          <p className="ai-status-sub">
            Event intelligence connected to live workspace data.
          </p>
        </Link>
      </aside>
    </>
  );
}