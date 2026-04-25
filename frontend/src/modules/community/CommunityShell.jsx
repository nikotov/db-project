import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { COMMUNITY_SIDEBAR_ITEMS } from "./sidebarItems";

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

function Sidebar({ isOpen, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <div className="sidebar-topbar">
        <div className="sidebar-brand">
          <h2>Community</h2>
        </div>
        <button
          type="button"
          className="toggle-button sidebar-toggle"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          onClick={onToggleSidebar}
        >
          <MenuIcon />
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Community navigation">
        {COMMUNITY_SIDEBAR_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.key}
              type="button"
              className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
              aria-label={item.label}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-link-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sidebar-link-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default function CommunityShell({
  user,
  isSidebarOpen,
  onToggleSidebar,
  onLogout,
}) {
  const location = useLocation();
  const activeLabel =
    COMMUNITY_SIDEBAR_ITEMS.find((item) => item.path === location.pathname)?.label ?? "Dashboard";

  return (
    <section className={`workspace-shell ${isSidebarOpen ? "workspace-shell-open" : "workspace-shell-closed"}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
      />

      <div className="workspace-main">
        <header className="workspace-header">
          <div className="workspace-header-left">
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

        <Outlet />
      </div>
    </section>
  );
}
