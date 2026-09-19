import { Loader2 } from "lucide-react";

export default function Loading({
  type = "spinner",
  count = 3,
  message = "Loading...",
}) {
  if (type === "stats") {
    return (
      <div className="stats-grid" aria-busy="true" aria-label="Loading statistics">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="stat-card skeleton-card">
            <div className="skeleton skeleton-title" style={{ width: "40%", height: 14 }} />
            <div className="skeleton" style={{ width: "65%", height: 32, margin: "10px 0" }} />
            <div className="skeleton skeleton-text" style={{ width: "80%", height: 12 }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === "cards") {
    return (
      <div className="card-grid" aria-busy="true" aria-label="Loading items">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-card" style={{ height: 180 }}>
            <div className="skeleton skeleton-title" style={{ width: "70%" }} />
            <div className="skeleton skeleton-text" style={{ width: "90%" }} />
            <div className="skeleton skeleton-text" style={{ width: "60%" }} />
            <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
              <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 20 }} />
              <div className="skeleton" style={{ width: 100, height: 24, borderRadius: 20 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="table-wrapper" aria-busy="true" aria-label="Loading table">
        <div style={{ padding: 18, borderBottom: "1px solid var(--border-default)" }}>
          <div className="skeleton" style={{ width: "25%", height: 18 }} />
        </div>
        <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div className="skeleton" style={{ width: "30%", height: 16 }} />
              <div className="skeleton" style={{ width: "20%", height: 16 }} />
              <div className="skeleton" style={{ width: "25%", height: 16 }} />
              <div className="skeleton" style={{ width: "15%", height: 16 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 260,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "var(--text-secondary)",
      }}
      aria-busy="true"
    >
      <Loader2
        size={28}
        className="spin"
        style={{
          color: "var(--color-primary)",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0 }}>{message}</p>
    </div>
  );
}

