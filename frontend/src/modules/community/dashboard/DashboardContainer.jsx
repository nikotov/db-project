
import { useState, useEffect } from 'react';
import DashboardPage from './DashboardPage';
import { fetchDashboardMetrics, getStoredAccessToken } from '../../../api/client';

const DASHBOARD_FALLBACK = {
  lastSundayServiceAttendance: 0,
  lastWeekSmallGroupAttendance: 0,
  income: "$0",
  membersCount: 0,
  familiesCount: 0,
  smallGroupsCount: 0,
  upcomingEventsCount: 0,
};

export default function DashboardContainer() {
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [metrics, setMetrics] = useState(DASHBOARD_FALLBACK);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMetrics() {
      setDashboardLoading(true);
      setError(null);
      try {
        const token = getStoredAccessToken();
        if (!token) {
          setError('No access token found. Please log in.');
          setDashboardLoading(false);
          return;
        }
        const data = await fetchDashboardMetrics(token);
        setMetrics(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard metrics.');
      } finally {
        setDashboardLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (error) {
    return <div className="dashboard-error">Error loading dashboard: {error}</div>;
  }

  return <DashboardPage dashboardLoading={dashboardLoading} metrics={metrics} />;
}