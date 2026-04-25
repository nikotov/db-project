const API_PREFIX = "/api/v1";

const DASHBOARD_FALLBACK = {
    lastSundayServiceAttendance: 0,
    lastWeekSmallGroupAttendance: 0,
    income: "$0",
    membersCount: 0,
    familiesCount: 0,
    smallGroupsCount: 0,
    upcomingEventsCount: 0,
};

export async function login(username, password) {
    const response = await fetch(`${API_PREFIX}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) return null;
    return response.json();
}

export async function fetchDashboardMetrics(token) {
    try {
        const response = await fetch(`${API_PREFIX}/members/count`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return DASHBOARD_FALLBACK;

        const payload = await response.json();
        return {
            lastSundayServiceAttendance:
                Number(payload?.lastSundayServiceAttendance) || 0,
            lastWeekSmallGroupAttendance:
                Number(payload?.lastWeekSmallGroupAttendance) || 0,
            income: payload?.income || "$0",
            membersCount: Number(payload?.membersCount) || 0,
            familiesCount: Number(payload?.familiesCount) || 0,
            smallGroupsCount: Number(payload?.smallGroupsCount) || 0,
            upcomingEventsCount: Number(payload?.upcomingEventsCount) || 0,
        };
    } catch {
        return DASHBOARD_FALLBACK;
    }
}

// Generic authenticated fetch helper 

export async function apiFetch(path, token, options = {}) {
    const response = await fetch(`${API_PREFIX}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
    if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw Object.assign(new Error(detail?.detail || response.statusText), { status: response.status });
    }
    if (response.status === 204) return null;
    return response.json();
}

// Members
export const fetchMembers = (token, params = "") =>
    apiFetch(`/members${params}`, token);

// Families 
export const fetchFamilies = (token) => apiFetch("/families", token);

// Member Status 
export const fetchMemberStatuses = (token) => apiFetch("/member-status", token);

// Event Series 
export const fetchEventSeries = (token) => apiFetch("/event-series", token);
export const fetchEventInstances = (token, seriesId) =>
    apiFetch(`/event-instances${seriesId ? `?series_id=${seriesId}` : ""}`, token);

// Event Tags
export const fetchEventTags = (token) => apiFetch("/event-tags", token);

// Small Groups
export const fetchSmallGroups = (token) => apiFetch("/small-groups", token);
export const fetchSmallGroupTags = (token) => apiFetch("/small-group-tags", token);
export const fetchGroupMemberships = (token, groupId) =>
    apiFetch(`/group-memberships${groupId ? `?group_id=${groupId}` : ""}`, token);

// Attendance
export const fetchAttendanceGroups = (token) => apiFetch("/attendance-groups", token);
export const fetchMemberAttendance = (token, instanceId) =>
    apiFetch(`/attendance/members${instanceId ? `?event_instance_id=${instanceId}` : ""}`, token);

// User Logs
export const fetchUserLogs = (token, params = "") =>
    apiFetch(`/user-logs${params}`, token);
export const fetchMyLogs = (token) => apiFetch("/user-logs/me", token);
