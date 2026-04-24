import { useMemo, useState } from "react";

import { login } from "./api/client";

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

    const isLoggedIn = useMemo(() => Boolean(user?.access_token), [user]);

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
        window.sessionStorage.removeItem(USER_STORAGE_KEY);
};

  return (
    <main className="app-shell">
      <section className="card">
        <h1>DB Project</h1>

        {isLoggedIn ? (
          <div className="logged-state">
            <p>
              Logged in as <strong>{user.username}</strong>
            </p>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />

            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
