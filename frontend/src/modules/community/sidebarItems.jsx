function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar-item-icon">
      <path
        d="M4 4h7v7H4V4Zm9 0h7v4h-7V4ZM4 13h7v7H4v-7Zm9 5h7v2h-7v-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar-item-icon">
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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar-item-icon">
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

function EventsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar-item-icon">
      <path
        d="M4 7h16M7 4v6m10-6v6M5 10h14v10H5V10Zm3 3h4m-4 3h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AttendanceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar-item-icon">
      <path
        d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 5h12M9 2v4m6-4v4m-7 6 2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GroupsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar-item-icon">
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

function LogsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar-item-icon">
      <path
        d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 5h8m-8 4h8m-8 4h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const COMMUNITY_SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/community/dashboard", icon: <DashboardIcon /> },
  { key: "members", label: "Members", path: "/community/members", icon: <MembersIcon /> },
  { key: "calendar", label: "Calendar", path: "/community/calendar", icon: <CalendarIcon /> },
  { key: "attendance", label: "Attendance", path: "/community/attendance", icon: <AttendanceIcon /> },
  { key: "events", label: "Events", path: "/community/events", icon: <EventsIcon /> },
  { key: "small-groups", label: "Small Groups", path: "/community/small-groups", icon: <GroupsIcon /> },
  { key: "logs", label: "Logs", path: "/community/logs", icon: <LogsIcon /> },
];
