import { useEffect, useMemo, useState } from "react";

import {
  createUser,
  deleteUser,
  fetchUserLogs,
  fetchUsers,
  getStoredAccessToken,
  updateUser,
} from "../../../api/client";

const MOCK_USERS = [];
const MOCK_USER_LOGS = [];

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

export default function LogsPage({ token: providedToken }) {
  const token = providedToken || getStoredAccessToken();
  const [view, setView] = useState("users");
  const [users, setUsers] = useState(MOCK_USERS);
  const [logs, setLogs] = useState(MOCK_USER_LOGS);
  const [newUser, setNewUser] = useState(NEW_USER_INITIAL);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const usersById = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user])),
    [users]
  );

  const addUserUsernameWarning = newUser.username.trim().length > 0 && newUser.username.trim().length < 8;
  const addUserPasswordWarning = newUser.password.trim().length > 0 && newUser.password.trim().length < 8;
  const addUserHasWarnings = addUserUsernameWarning || addUserPasswordWarning;

  async function loadData() {
    if (!token) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [usersPayload, logsPayload] = await Promise.all([
        fetchUsers(token),
        fetchUserLogs(token),
      ]);
      setUsers(usersPayload || []);
      setLogs(logsPayload || []);
    } catch (err) {
      setError(err?.message || "Failed to load users/logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleAddUser = async (event) => {
    event.preventDefault();

    const username = newUser.username.trim().toLowerCase();
    const password = newUser.password.trim();
    if (!username || !password) {
      return;
    }

    if (username.length < 8 || password.length < 8) {
      setError("Username and password must be at least 8 characters long.");
      return;
    }

    setError("");
    try {
      const created = await createUser(token, {
        username,
        password,
        role: "member",
      });
      setUsers((current) => [created, ...current]);
      setNewUser(NEW_USER_INITIAL);
      setAddOpen(false);
      await loadData();
    } catch (err) {
      setError(err?.message || "Could not create user.");
    }
  };

  const handleRemoveUser = async (userToRemove) => {
    const confirmed = window.confirm(`Remove user "${userToRemove.username}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setError("");
    try {
      await deleteUser(token, userToRemove.id);
      setUsers((current) => current.filter((user) => user.id !== userToRemove.id));
      setSelectedUser(null);
      setEditForm(null);
      await loadData();
    } catch (err) {
      setError(err?.message || "Could not delete user.");
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      password: "",
      role: user.role || "member",
    });
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    if (!selectedUser || !editForm) {
      return;
    }

    const username = editForm.username.trim().toLowerCase();
    if (!username) {
      return;
    }

    setError("");
    try {
      const payload = {
        username,
        role: editForm.role || "member",
      };
      const trimmedPassword = editForm.password.trim();
      if (trimmedPassword) {
        payload.password = trimmedPassword;
      }
      const updated = await updateUser(token, selectedUser.id, payload);
      setUsers((current) => current.map((user) => (user.id === selectedUser.id ? updated : user)));
      setSelectedUser(updated);
      setEditForm(null);
      await loadData();
    } catch (err) {
      setError(err?.message || "Could not update user.");
    }
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
      {error ? <p className="events-register-empty">{error}</p> : null}

      {view === "users" ? (
        <section className="user-management-card user-management-card-full" aria-label="User management">
          <div className="user-management-card-head">
            <h3>Users</h3>
            <p>{users.length} currently created</p>
          </div>

          <div className="user-management-list" role="list" aria-label="Created users list">
            {loading ? (
              <p className="events-register-empty">Loading users...</p>
            ) : users.length ? (
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
                  <tr key={`${log.user_id}-${log.created_at}-${index}`}>
                    <td>{usersById[log.user_id]?.username || `user#${log.user_id}`}</td>
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
                {addUserUsernameWarning ? <span className="events-register-warning">Use at least 8 characters.</span> : null}
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
                  required
                />
                {addUserPasswordWarning ? <span className="events-register-warning">Use at least 8 characters.</span> : null}
              </label>
              <button type="submit" className="members-primary-button" disabled={addUserHasWarnings}>
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
                <label>
                  Role
                  <select
                    value={editForm.role}
                    onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value }))}
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
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
                <p className="members-detail-item" role="listitem">
                  <span>Role</span>
                  <strong>{selectedUser.role || "member"}</strong>
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