import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { fetchDashboardMetrics, login } from "./api/client";
import LoginView from "./modules/login/LoginView";
import CommunityShell from "./modules/community/CommunityShell";
import DashboardPage from "./modules/community/dashboard/DashboardPage";
import MembersPage from "./modules/community/members/MembersPage";
import FamiliesPage from "./modules/community/families/FamiliesPage";
import CalendarPage from "./modules/community/calendar/CalendarPage";
import EventsPage from "./modules/community/events/EventsPage";
import SmallGroupsPage from "./modules/community/small-groups/SmallGroupsPage";
import AttendancePage from "./modules/community/attendance/AttendancePage";
import LogsPage from "./modules/community/user-logs/LogsPage";

const USER_STORAGE_KEY = "db-project-user";
const INITIAL_DASHBOARD_METRICS = {
  lastSundayServiceAttendance: 0,
  lastWeekSmallGroupAttendance: 0,
  income: "$0",
  membersCount: 0,
  familiesCount: 0,
  smallGroupsCount: 0,
  upcomingEventsCount: 0,
};

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

function RequireAuth({ isLoggedIn, children }) {
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => readStoredUser());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [metrics, setMetrics] = useState(INITIAL_DASHBOARD_METRICS);

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
      navigate("/community/dashboard", { replace: true });
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
    setMetrics(INITIAL_DASHBOARD_METRICS);
    window.sessionStorage.removeItem(USER_STORAGE_KEY);
    navigate("/login", { replace: true });
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <main className="app-shell">
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isLoggedIn ? "/community/dashboard" : "/login"} replace />}
        />

        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/community/dashboard" replace />
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
            )
          }
        />

        <Route
          path="/community"
          element={
            <RequireAuth isLoggedIn={isLoggedIn}>
              <CommunityShell
                user={user}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={handleToggleSidebar}
                onLogout={handleLogout}
              />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={<DashboardPage dashboardLoading={dashboardLoading} metrics={metrics} />}
          />
          <Route path="members" element={<MembersPage />} />
          <Route path="families" element={<FamiliesPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="small-groups" element={<SmallGroupsPage />} />
          <Route path="logs" element={<LogsPage />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/community/dashboard" : "/login"} replace />}
        />
      </Routes>
    </main>
  );
}
