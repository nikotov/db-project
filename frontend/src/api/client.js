const API_PREFIX = "/api/v1";

const DASHBOARD_FALLBACK = {
    lastSundayServiceAttendance: 87,
    lastWeekSmallGroupAttendance: 64,
    income: "$4,250",
    membersCount: 128,
    familiesCount: 34,
    smallGroupsCount: 12,
    upcomingEventsCount: 5,
};

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

export async function fetchDashboardMetrics(token) {
    try {
        const response = await fetch(`${API_PREFIX}/members/count`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return DASHBOARD_FALLBACK;
        }

        const payload = await response.json();
        return {
            lastSundayServiceAttendance:
                Number(payload?.lastSundayServiceAttendance) || DASHBOARD_FALLBACK.lastSundayServiceAttendance,
            lastWeekSmallGroupAttendance:
                Number(payload?.lastWeekSmallGroupAttendance) || DASHBOARD_FALLBACK.lastWeekSmallGroupAttendance,
            income: payload?.income || DASHBOARD_FALLBACK.income,
            membersCount: Number(payload?.membersCount) || DASHBOARD_FALLBACK.membersCount,
            familiesCount: Number(payload?.familiesCount) || DASHBOARD_FALLBACK.familiesCount,
            smallGroupsCount: Number(payload?.smallGroupsCount) || DASHBOARD_FALLBACK.smallGroupsCount,
            upcomingEventsCount: Number(payload?.upcomingEventsCount) || DASHBOARD_FALLBACK.upcomingEventsCount,
        };
    } catch {
        return DASHBOARD_FALLBACK;
    }
}
