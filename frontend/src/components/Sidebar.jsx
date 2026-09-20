import { X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { safeStorage } from "../utils/storage";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const eventId = safeStorage.getItem("eventId");

  const navigationItems = [
    { label: "OVERVIEW", number: "01", path: "/dashboard" },
    { label: "TASKS", number: "02", path: "/tasks" },
    { label: "RISKS", number: "03", path: "/risks" },
    { label: "VOLUNTEERS", number: "04", path: "/volunteers" },
    { label: "MEETINGS", number: "05", path: "/meetings" },
    { label: "DOCUMENTS", number: "06", path: eventId ? `/events/${eventId}?tab=documents` : "/events", alias: "/documents" },
    { label: "AI AGENT", number: "07", path: "/agent" },
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
              const isActive =
                location.pathname === path ||
                (alias && location.pathname === alias) ||
                (path.includes("tab=documents") && location.search.includes("tab=documents")) ||
                (path === "/dashboard" && location.pathname === "/");

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