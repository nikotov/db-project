const API_PREFIX = "/api/v1";
const USER_STORAGE_KEY = "db-project-user";

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

export function getStoredSessionUser() {
    if (typeof window === "undefined") {
        return null;
    }

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

export function getStoredAccessToken() {
    return getStoredSessionUser()?.access_token ?? "";
}

export async function fetchDashboardMetrics(token) {
    try {
        const response = await fetch(`${API_PREFIX}/dashboard/metrics`, {
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
export async function createMember(token, payload) {
    return apiFetch("/members", token, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function updateMember(token, memberId, payload) {
    return apiFetch(`/members/${memberId}`, token, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
export async function deleteMember(token, memberId) {
    return apiFetch(`/members/${memberId}`, token, {
        method: "DELETE",
    });
}

// Families 
export const fetchFamilies = (token) => apiFetch("/families", token);
export async function createFamily(token, payload) {
    return apiFetch("/families", token, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function updateFamily(token, familyId, payload) {
    return apiFetch(`/families/${familyId}`, token, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
export async function deleteFamily(token, familyId) {
    return apiFetch(`/families/${familyId}`, token, {
        method: "DELETE",
    });
}

// Member Status 
export const fetchMemberStatuses = (token) => apiFetch("/member-status", token);

// Event Series 
export const fetchEventSeries = (token) => apiFetch("/event-series", token);
export async function createEventSeries(token, payload) {
    return apiFetch("/event-series", token, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function updateEventSeries(token, seriesId, payload) {
    return apiFetch(`/event-series/${seriesId}`, token, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
export async function deleteEventSeries(token, seriesId) {
    return apiFetch(`/event-series/${seriesId}`, token, {
        method: "DELETE",
    });
}
export const fetchEventInstances = (token, seriesId) =>
    apiFetch(`/event-instances${seriesId ? `?series_id=${seriesId}` : ""}`, token);
export async function createEventInstance(token, payload) {
    return apiFetch("/event-instances", token, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function updateEventInstance(token, instanceId, payload) {
    return apiFetch(`/event-instances/${instanceId}`, token, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
export async function deleteEventInstance(token, instanceId) {
    return apiFetch(`/event-instances/${instanceId}`, token, {
        method: "DELETE",
    });
}

export async function generateEventInstances(token, seriesId, fromDate, toDate) {
    return apiFetch(`/event-series/${seriesId}/generate-instances`, token, {
        method: "POST",
        body: JSON.stringify({ from_date: fromDate, to_date: toDate }),
    });
}

// Event Tags
export const fetchEventTags = (token) => apiFetch("/event-tags", token);
export async function createEventTag(token, payload) {
    return apiFetch("/event-tags", token, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function deleteEventTag(token, tagId) {
    return apiFetch(`/event-tags/${tagId}`, token, {
        method: "DELETE",
    });
}

// Small Groups
export const fetchSmallGroups = (token) => apiFetch("/small-groups", token);
export const fetchSmallGroupTags = (token) => apiFetch("/small-group-tags", token);
export const fetchGroupMemberships = (token, groupId) =>
    apiFetch(`/group-memberships${groupId ? `?group_id=${groupId}` : ""}`, token);
export async function createSmallGroup(token, payload) {
    return apiFetch("/small-groups", token, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function updateSmallGroup(token, groupId, payload) {
    return apiFetch(`/small-groups/${groupId}`, token, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
export async function deleteSmallGroup(token, groupId) {
    return apiFetch(`/small-groups/${groupId}`, token, {
        method: "DELETE",
    });
}
export async function createSmallGroupTag(token, payload) {
    return apiFetch("/small-group-tags", token, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function deleteSmallGroupTag(token, tagId) {
    return apiFetch(`/small-group-tags/${tagId}`, token, {
        method: "DELETE",
    });
}
export async function createGroupMembership(token, payload) {
    return apiFetch("/group-memberships", token, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function deleteGroupMembership(token, membershipId) {
    return apiFetch(`/group-memberships/${membershipId}`, token, {
        method: "DELETE",
    });
}

// Attendance
export const fetchAttendanceGroups = (token) => apiFetch("/attendance-groups", token);
export const fetchMemberAttendance = (token, instanceId) =>
    apiFetch(`/attendance/members${instanceId ? `?event_instance_id=${instanceId}` : ""}`, token);
export const fetchGeneralAttendance = (token, instanceId) =>
    apiFetch(`/event-instances/${instanceId}`, token);
export async function upsertGeneralAttendance(token, payload) {
    return apiFetch("/attendance/general", token, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function upsertMemberAttendance(token, payload) {
    return apiFetch("/attendance/member", token, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

// User Logs
export const fetchUserLogs = (token, params = "") =>
    apiFetch(`/user-logs${params}`, token);
export const fetchMyLogs = (token) => apiFetch("/user-logs/me", token);

// Users
export const fetchUsers = (token, params = "") =>
    apiFetch(`/users${params}`, token);
export async function createUser(token, payload) {
    return apiFetch("/users", token, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function updateUser(token, userId, payload) {
    return apiFetch(`/users/${userId}`, token, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
export async function deleteUser(token, userId) {
    return apiFetch(`/users/${userId}`, token, {
        method: "DELETE",
    });
}