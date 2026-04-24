import { useEffect, useMemo, useState } from "react";

import { fetchDashboardMetrics, login } from "./api/client";
import LoginView from "./modules/login/LoginView";
import CommunityShell from "./modules/community/CommunityShell";

const USER_STORAGE_KEY = "db-project-user";

function readStoredUser() {
  const raw = window.sessionStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(() => readStoredUser());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [metrics, setMetrics] = useState({ membersCount: 0 });

  const isLoggedIn = useMemo(() => Boolean(user?.access_token), [user]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!user?.access_token) {
        return;
      }

      setDashboardLoading(true);
      const data = await fetchDashboardMetrics(user.access_token);

      if (active) {
        setMetrics(data);
        setDashboardLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(username, password);
      if (!result?.access_token) {
        setError("Invalid username or password.");
        return;
      }

      const nextUser = { username, ...result };
      setUser(nextUser);
      window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      setPassword("");
    } catch {
      setError("Unexpected error while contacting the backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername("");
    setPassword("");
    setError("");
    setActivePage("dashboard");
    setMetrics({ membersCount: 0 });
    window.sessionStorage.removeItem(USER_STORAGE_KEY);
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <main className="app-shell">
      {isLoggedIn ? (
        <CommunityShell
          user={user}
          activePage={activePage}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onSelectPage={setActivePage}
          onLogout={handleLogout}
          dashboardLoading={dashboardLoading}
          metrics={metrics}
        />
      ) : (
        <LoginView
          username={username}
          password={password}
          error={error}
          loading={loading}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}
