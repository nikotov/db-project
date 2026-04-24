function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="metric-icon">
      <path
        d="M7.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm9 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-12 8v-1.2c0-2.2 1.9-3.8 4.3-3.8h1.4c2.4 0 4.3 1.6 4.3 3.8V20M14 20v-.8c0-1.8 1.5-3.2 3.4-3.2h.8c1.9 0 3.3 1.3 3.3 3.2v.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChurchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="metric-icon">
      <path
        d="M8 21v-6h8v6M4 21h16M6 12l6-5 6 5M12 7V3m0 0 2 2m-2-2-2 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="metric-icon">
      <path
        d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20v-1c0-2.2 1.8-4 4-4h1m13 5v-1c0-2.2-1.8-4-4-4h-1M9 20v-1c0-2.2 1.8-4 4-4s4 1.8 4 4v1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="metric-icon">
      <path
        d="M12 3v18m4-14.5c0-1.9-1.8-3.5-4-3.5s-4 1.6-4 3.5S9.8 10 12 10s4 1.6 4 3.5S14.2 17 12 17s-4-1.6-4-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="metric-icon">
      <path
        d="M7 3v3m10-3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({ icon, title, value, note, emphasis = "normal" }) {
  return (
    <article className={`metric-card ${emphasis === "primary" ? "metric-card-primary" : ""}`}>
      <div className="metric-head">
        <span className="metric-badge" aria-hidden="true">
          {icon}
        </span>
        <h2>{title}</h2>
      </div>
      <p className="metric-value">{value}</p>
      <p className="metric-note">{note}</p>
    </article>
  );
}

export default function DashboardPage({ dashboardLoading, metrics }) {
  return (
    <section className="dashboard-layout">
      <article className="primary-dashboard-card">
        <div className="metric-head primary-head">
          <span className="metric-badge metric-badge-large" aria-hidden="true">
            <ChurchIcon />
          </span>
          <div>
            <h2>Primary Dashboard</h2>
            <p className="metric-note">High-level view of the community</p>
          </div>
        </div>

        <div className="primary-dashboard-content">
          <div className="primary-metric-block">
            <span className="primary-label">Last Sunday Service Attendance</span>
            <p className="primary-value">{dashboardLoading ? "..." : metrics.lastSundayServiceAttendance}</p>
          </div>
          <div className="primary-metric-block">
            <span className="primary-label">Last Week Small Group Attendance</span>
            <p className="primary-value">{dashboardLoading ? "..." : metrics.lastWeekSmallGroupAttendance}</p>
          </div>
          <div className="primary-metric-block">
            <span className="primary-label">Income</span>
            <p className="primary-value">{dashboardLoading ? "..." : metrics.income}</p>
          </div>
        </div>
      </article>

      <section className="dashboard-summary-grid">
        <MetricCard
          icon={<UsersIcon />}
          title="Members"
          value={dashboardLoading ? "..." : metrics.membersCount}
          note="Total registered members"
        />
        <MetricCard
          icon={<ChurchIcon />}
          title="Families"
          value={dashboardLoading ? "..." : metrics.familiesCount}
          note="Family units in the community"
        />
        <MetricCard
          icon={<GroupIcon />}
          title="Small Groups"
          value={dashboardLoading ? "..." : metrics.smallGroupsCount}
          note="Active small groups"
        />
        <MetricCard
          icon={<CalendarIcon />}
          title="Upcoming Events"
          value={dashboardLoading ? "..." : metrics.upcomingEventsCount}
          note="Events scheduled ahead"
        />
      </section>
    </section>
  );
}
