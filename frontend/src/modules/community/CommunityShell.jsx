import { COMMUNITY_SIDEBAR_ITEMS } from "./sidebarItems";
import DashboardPage from "./dashboard/DashboardPage";
import MembersPage from "./members/MembersPage";
import CalendarPage from "./calendar/CalendarPage";
import EventsPage from "./events/EventsPage";
import SmallGroupsPage from "./small-groups/SmallGroupsPage";

function MenuIcon() {
  return (
    <svg className="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Sidebar({ activePage, isOpen, onSelectPage }) {
  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <div className="sidebar-brand">
        <h2>Community</h2>
      </div>
      <nav className="sidebar-nav" aria-label="Community navigation">
        {COMMUNITY_SIDEBAR_ITEMS.map((item) => {
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
              onClick={() => onSelectPage(item.key)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function resolvePage(activePage, dashboardLoading, metrics) {
  switch (activePage) {
    case "dashboard":
      return <DashboardPage dashboardLoading={dashboardLoading} metrics={metrics} />;
    case "members":
      return <MembersPage />;
    case "calendar":
      return <CalendarPage />;
    case "events":
      return <EventsPage />;
    case "small-groups":
      return <SmallGroupsPage />;
    default:
      return null;
  }
}

export default function CommunityShell({
  user,
  activePage,
  isSidebarOpen,
  onToggleSidebar,
  onSelectPage,
  onLogout,
  dashboardLoading,
  metrics,
}) {
  const activeLabel =
    COMMUNITY_SIDEBAR_ITEMS.find((item) => item.key === activePage)?.label ?? "Dashboard";

  return (
    <section className={`workspace-shell ${isSidebarOpen ? "workspace-shell-open" : "workspace-shell-closed"}`}>
      <Sidebar activePage={activePage} isOpen={isSidebarOpen} onSelectPage={onSelectPage} />

      <div className="workspace-main">
        <header className="workspace-header">
          <div className="workspace-header-left">
            <button type="button" className="toggle-button" onClick={onToggleSidebar}>
              <MenuIcon />
            </button>
            <h1>{activeLabel}</h1>
          </div>

          <div className="header-actions">
            <p>
              Session: <strong>{user.username}</strong>
            </p>
            <button type="button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        {resolvePage(activePage, dashboardLoading, metrics)}
      </div>
    </section>
  );
}
