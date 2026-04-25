const MOCK_USER_LOGS = [
  {
    username: "admin",
    action_type: "login",
    description: "Successful login from web client",
    created_at: "2026-04-25T08:14:00",
  },
  {
    username: "admin",
    action_type: "create_event_series",
    description: "Created event series: Young Adults Gathering",
    created_at: "2026-04-25T08:26:00",
  },
  {
    username: "mlopez",
    action_type: "update_member",
    description: "Updated member profile: Mariana Lopez",
    created_at: "2026-04-25T09:03:00",
  },
  {
    username: "mlopez",
    action_type: "save_attendance",
    description: "Saved attendance for Sunday Service instance",
    created_at: "2026-04-25T09:20:00",
  },
];

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LogsPage() {
  return (
    <section className="events-page">
      <header className="events-header">
        <div>
          <p className="events-subtitle">Admin log viewer for user actions recorded in the system.</p>
        </div>
      </header>

      <div className="logs-table-card">
        <div className="logs-table-scroll">
          <table className="logs-table" aria-label="User logs table">
            <thead>
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Action Type</th>
                <th scope="col">Description</th>
                <th scope="col">Created At</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USER_LOGS.map((log, index) => (
                <tr key={`${log.username}-${log.created_at}-${index}`}>
                  <td>{log.username}</td>
                  <td>{log.action_type}</td>
                  <td>{log.description || "-"}</td>
                  <td>{formatDateTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="events-count">Showing {MOCK_USER_LOGS.length} logs</p>
    </section>
  );
}
