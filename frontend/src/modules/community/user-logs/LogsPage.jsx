import { useState } from "react";

const MOCK_USERS = [
  {
    id: 1,
    username: "admin",
    last_login: "2026-04-25T08:14:00",
    password: "admin123",
  },
  {
    id: 2,
    username: "mlopez",
    last_login: "2026-04-25T09:20:00",
    password: "mlopez123",
  },
  {
    id: 3,
    username: "jcastro",
    last_login: "2026-04-24T18:42:00",
    password: "jcastro123",
  },
];

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

const NEW_USER_INITIAL = {
  username: "",
  password: "",
};

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

function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function LogsPage() {
  const [view, setView] = useState("users");
  const [users, setUsers] = useState(MOCK_USERS);
  const [logs, setLogs] = useState(MOCK_USER_LOGS);
  const [newUser, setNewUser] = useState(NEW_USER_INITIAL);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const handleAddUser = (event) => {
    event.preventDefault();

    const username = newUser.username.trim().toLowerCase();
    const password = newUser.password.trim();
    if (!username || !password) {
      return;
    }

    const usernameExists = users.some((user) => user.username.toLowerCase() === username);
    if (usernameExists) {
      window.alert("Username already exists.");
      return;
    }

    const createdAt = new Date().toISOString();
    const userToAdd = {
      id: Math.floor(1000 + Math.random() * 9000),
      username,
      last_login: null,
      password,
    };

    setUsers((current) => [userToAdd, ...current]);
    setLogs((current) => [
      {
        username,
        action_type: "create_user",
        description: `Created user account: ${username}`,
        created_at: createdAt,
      },
      ...current,
    ]);
    setNewUser(NEW_USER_INITIAL);
    setAddOpen(false);
  };

  const handleRemoveUser = (userToRemove) => {
    const confirmed = window.confirm(`Remove user "${userToRemove.username}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    const removedAt = new Date().toISOString();
    setUsers((current) => current.filter((user) => user.id !== userToRemove.id));
    setLogs((current) => [
      {
        username: "admin",
        action_type: "remove_user",
        description: `Removed user account: ${userToRemove.username}`,
        created_at: removedAt,
      },
      ...current,
    ]);
    setSelectedUser(null);
    setEditForm(null);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      password: "",
    });
  };

  const handleSaveUser = (event) => {
    event.preventDefault();
    if (!selectedUser || !editForm) {
      return;
    }

    const username = editForm.username.trim().toLowerCase();
    const password = editForm.password.trim();
    if (!username) {
      return;
    }

    const duplicateUsername = users.some(
      (user) => user.id !== selectedUser.id && user.username.toLowerCase() === username
    );
    if (duplicateUsername) {
      window.alert("Username already exists.");
      return;
    }

    const updatedUser = {
      ...selectedUser,
      username,
      password: password || selectedUser.password,
    };

    const updatedAt = new Date().toISOString();
    setUsers((current) => current.map((user) => (user.id === selectedUser.id ? updatedUser : user)));
    setLogs((current) => [
      {
        username: "admin",
        action_type: "update_user",
        description: `Updated user account: ${selectedUser.username} -> ${username}`,
        created_at: updatedAt,
      },
      ...current,
    ]);
    setSelectedUser(updatedUser);
    setEditForm(null);
  };

  return (
    <section className="events-page">
      <header className="events-header">
        <div>
          <p className="events-subtitle">Manage users and review activity logs with full-screen views.</p>
        </div>
        <div className="events-actions">
          <button
            type="button"
            className={view === "users" ? "members-primary-button" : "members-secondary-button"}
            onClick={() => setView("users")}
          >
            Users
          </button>
          <button
            type="button"
            className={view === "logs" ? "members-primary-button" : "members-secondary-button"}
            onClick={() => setView("logs")}
          >
            Logs
          </button>
          {view === "users" ? (
            <button type="button" className="members-primary-button" onClick={() => setAddOpen(true)}>
              Add User
            </button>
          ) : null}
        </div>
      </header>

      {view === "users" ? (
        <section className="user-management-card user-management-card-full" aria-label="User management">
          <div className="user-management-card-head">
            <h3>Users</h3>
            <p>{users.length} currently created</p>
          </div>

          <div className="user-management-list" role="list" aria-label="Created users list">
            {users.length ? (
              users.map((user) => (
                <article key={user.id} className="user-management-row" role="listitem">
                  <button type="button" className="user-management-row-main user-row-button" onClick={() => handleOpenEdit(user)}>
                    <strong>{user.username}</strong>
                    <span>Last login: {formatDateTime(user.last_login)}</span>
                  </button>

                  <div className="events-actions">
                    <button type="button" className="members-secondary-button" onClick={() => handleOpenEdit(user)}>
                      Update
                    </button>
                    <button type="button" className="events-tag-remove-button" onClick={() => handleRemoveUser(user)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="events-register-empty">No users created yet.</p>
            )}
          </div>
        </section>
      ) : (
        <section className="logs-table-card logs-table-card-full" aria-label="User logs">
          <div className="user-management-card-head">
            <h3>User Logs</h3>
            <p>{logs.length} entries</p>
          </div>
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
                {logs.map((log, index) => (
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
        </section>
      )}

      <p className="events-count">
        Showing {users.length} users and {logs.length} logs
      </p>

      {addOpen ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={() => setAddOpen(false)} role="presentation">
          <aside className="events-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>Add User</h3>
              <button type="button" className="members-text-button" onClick={() => setAddOpen(false)}>
                Close
              </button>
            </div>
            <form className="members-add-form" onSubmit={handleAddUser}>
              <label>
                Username
                <input
                  value={newUser.username}
                  onChange={(event) => setNewUser((current) => ({ ...current, username: event.target.value }))}
                  placeholder="e.g. jrivera"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </label>
              <button type="submit" className="members-primary-button">
                Save User
              </button>
            </form>
          </aside>
        </div>
      ) : null}

      {selectedUser ? (
        <div
          className="members-drawer-backdrop events-modal-backdrop"
          onClick={() => {
            setSelectedUser(null);
            setEditForm(null);
          }}
          role="presentation"
        >
          <aside className="events-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>{selectedUser.username}</h3>
              <button
                type="button"
                className="members-text-button"
                onClick={() => {
                  setSelectedUser(null);
                  setEditForm(null);
                }}
              >
                Close
              </button>
            </div>
            {editForm ? (
              <form className="members-add-form" onSubmit={handleSaveUser}>
                <label>
                  Username
                  <input
                    value={editForm.username}
                    onChange={(event) => setEditForm((current) => ({ ...current, username: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Leave blank to keep current password"
                  />
                </label>
                <button type="submit" className="members-primary-button">
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="members-detail-grid" role="list" aria-label="Selected user details">
                <p className="members-detail-item" role="listitem">
                  <span>Username</span>
                  <strong>{selectedUser.username}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Last Login</span>
                  <strong>{formatDateTime(selectedUser.last_login)}</strong>
                </p>
              </div>
            )}
            <div className="detail-modal-actions">
              {editForm ? (
                <button type="button" className="members-secondary-button" onClick={() => setEditForm(null)}>
                  Cancel Edit
                </button>
              ) : (
                <button type="button" className="members-secondary-button" onClick={() => handleOpenEdit(selectedUser)}>
                  Update User
                </button>
              )}
              <button type="button" className="events-tag-remove-button" onClick={() => handleRemoveUser(selectedUser)}>
                Delete User
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
