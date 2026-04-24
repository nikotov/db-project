const API_PREFIX = "/api/v1";

export async function login(username, password) {
    const response = await fetch(`${API_PREFIX}/auth/login`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        return null;
    }

    return response.json();
}
