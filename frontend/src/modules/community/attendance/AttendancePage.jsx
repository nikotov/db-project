import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchAttendanceGroups,
  fetchMemberAttendance,
  fetchEventInstances,
  fetchEventTags,
  fetchMembers,
  fetchGeneralAttendance,
  getStoredAccessToken,
  upsertGeneralAttendance,
  upsertMemberAttendance,
} from "../../../api/client";

// Helpers 

const DEFAULT_FILTERS = {
  search: "",
  attendanceType: "all",
  tagIds: [],
  dateAfter: "",
  dateBefore: "",
  day: "all",
  timeAfter: "",
  timeBefore: "",
};

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatTimeRange(startAt, endAt) {
  const start = new Date(startAt);
  const end   = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    return `${startAt} - ${endAt}`;
  return `${start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

function parseTimeToMinutes(timeText) {
  if (!timeText || !timeText.includes(":")) return null;
  const [h, m] = timeText.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function normalizeInstance(raw) {
  return {
    id:              raw.id,
    eventSeriesId:   raw.event_series_id,
    seriesName:      raw.series_name      ?? `Instance #${raw.id}`,
    attendanceType:  raw.attendance_type  ?? "general",
    startAt:         raw.start_datetime,
    endAt:           raw.end_datetime,
    location:        raw.location         ?? "",
    attendanceNotes: raw.attendance_notes ?? "",
    attendeeCount:   raw.attendee_count   ?? 0,
    tagIds:          (raw.tags ?? []).map((t) => t.id),
    _tags:           raw.tags             ?? [],
    _groupCounts:    raw.group_counts     ?? [],
  };
}

// Component 

export default function AttendancePage() {
  const [searchParams] = useSearchParams();
  const queryInstanceId = Number(searchParams.get("instanceId"));

  // Remote data
  const [attendanceGroups, setAttendanceGroups] = useState([]);
  const [instances, setInstances]               = useState([]);
  const [tagsById, setTagsById]                 = useState({});
  const [membersById, setMembersById]           = useState({});
  const [loadingData, setLoadingData]           = useState(true);
  const [dataError, setDataError]               = useState(null);

  //  UI state
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const [filtersOpen, setFiltersOpen]               = useState(false);
  const [filters, setFilters]                       = useState(DEFAULT_FILTERS);

  // Attendance-editor state
  const [generalTotalCount, setGeneralTotalCount] = useState(0);
  const [groupCounts, setGroupCounts]             = useState({});
  const [memberRows, setMemberRows]               = useState([]);
  const [notes, setNotes]                         = useState("");
  const [loadingModal, setLoadingModal]           = useState(false);
  const [saving, setSaving]                       = useState(false);
  const [saveError, setSaveError]                 = useState(null);
  const [lastSavedAt, setLastSavedAt]             = useState(null);

  // Initial data load 
  useEffect(() => {
    const token = getStoredAccessToken();
    setLoadingData(true);
    setDataError(null);

    Promise.all([
      fetchAttendanceGroups(token).catch(() => []),
      fetchEventInstances(token).catch(() => []),
      fetchEventTags(token).catch(() => []),
      fetchMembers(token).catch(() => []),
    ])
      .then(([groups, rawInstances, tags, members]) => {
        setAttendanceGroups(groups ?? []);

        const normalized = (rawInstances ?? []).map(normalizeInstance);
        setInstances(normalized);

        // Merge tags from standalone list and from instance embedded tags
        const merged = {};
        (tags ?? []).forEach((t) => { merged[t.id] = t; });
        normalized.forEach((inst) => inst._tags.forEach((t) => { merged[t.id] = t; }));
        setTagsById(merged);

        const mById = {};
        (members ?? []).forEach((m) => { mById[m.id] = m; });
        setMembersById(mById);
      })
      .catch((err) => setDataError(err.message ?? "Failed to load data"))
      .finally(() => setLoadingData(false));
  }, []);

  // Select initial instance 
  useEffect(() => {
    if (!instances.length) return;
    const initial = instances.find((i) => i.id === queryInstanceId) ?? instances[0];
    setSelectedInstanceId(initial?.id ?? null);
  }, [instances]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load modal data 
  const loadModalData = useCallback(
    async (instanceId) => {
      const token    = getStoredAccessToken();
      const instance = instances.find((i) => i.id === instanceId);
      if (!instance) return;

      setLoadingModal(true);
      setSaveError(null);
      setLastSavedAt(null);

      try {
        if (instance.attendanceType === "general") {
          const fresh = await fetchGeneralAttendance(token, instanceId).catch(() => null);
          const gc    = fresh?.group_counts ?? instance._groupCounts ?? [];

          setGeneralTotalCount(fresh?.attendee_count ?? instance.attendeeCount ?? 0);

          // Start with zeros for every group, then fill in persisted values
          const initial = Object.fromEntries(attendanceGroups.map((g) => [g.id, 0]));
          gc.forEach(({ attendance_group_id, count }) => {
            initial[attendance_group_id] = count;
          });
          setGroupCounts(initial);
        } else {
          const attendance = await fetchMemberAttendance(token, instanceId).catch(() => []);

          const attendedIds = new Set(
            (attendance ?? [])
              .filter((r) => r.attendance_status === "attended")
              .map((r) => r.member_id),
          );

          // Union of members already recorded + all known members
          const allMemberIds = new Set([
            ...Object.keys(membersById).map(Number),
            ...(attendance ?? []).map((r) => r.member_id),
          ]);

          const rows = [...allMemberIds].map((mid) => {
            const rec    = (attendance ?? []).find((r) => r.member_id === mid);
            const member = membersById[mid];
            return {
              memberId: mid,
              name:     rec?.member_name ?? member?.name ?? `Member #${mid}`,
              status:   attendedIds.has(mid) ? "present" : "absent",
            };
          });
          rows.sort((a, b) => a.name.localeCompare(b.name));
          setMemberRows(rows);
        }
      } finally {
        setLoadingModal(false);
      }
    },
    [instances, attendanceGroups, membersById],
  );

  //  Filters 
  const filterOptions = useMemo(
    () => ({
      attendanceTypes: [...new Set(instances.map((i) => i.attendanceType))],
      days: [...new Set(
        instances.map((i) =>
          new Date(i.startAt).toLocaleDateString(undefined, { weekday: "long" }),
        ),
      )],
    }),
    [instances],
  );

  const filteredInstances = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return instances.filter((instance) => {
      const start        = new Date(instance.startAt);
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const instanceDay  = start.toLocaleDateString(undefined, { weekday: "long" });
      const tagNames     = instance.tagIds.map((id) => tagsById[id]?.name ?? "").join(" ").toLowerCase();

      const matchesSearch =
        !search ||
        (instance.seriesName ?? "").toLowerCase().includes(search) ||
        (instance.location   ?? "").toLowerCase().includes(search) ||
        (instance.attendanceType ?? "").toLowerCase().includes(search) ||
        formatDate(instance.startAt).toLowerCase().includes(search) ||
        formatTimeRange(instance.startAt, instance.endAt).toLowerCase().includes(search) ||
        tagNames.includes(search);

      const matchesAttendanceType =
        filters.attendanceType === "all" || instance.attendanceType === filters.attendanceType;
      const matchesTag =
        !filters.tagIds.length ||
        filters.tagIds.every((tid) => instance.tagIds.includes(tid));
      const matchesDay = filters.day === "all" || instanceDay === filters.day;

      const afterDate         = filters.dateAfter  ? new Date(`${filters.dateAfter}T00:00:00`)  : null;
      const beforeDate        = filters.dateBefore ? new Date(`${filters.dateBefore}T23:59:59`) : null;
      const matchesDateAfter  = !afterDate  || start >= afterDate;
      const matchesDateBefore = !beforeDate || start <= beforeDate;

      const afterMinutes      = parseTimeToMinutes(filters.timeAfter);
      const beforeMinutes     = parseTimeToMinutes(filters.timeBefore);
      const matchesTimeAfter  = afterMinutes  === null || startMinutes >= afterMinutes;
      const matchesTimeBefore = beforeMinutes === null || startMinutes <= beforeMinutes;

      return (
        matchesSearch && matchesAttendanceType && matchesTag && matchesDay &&
        matchesDateAfter && matchesDateBefore && matchesTimeAfter && matchesTimeBefore
      );
    });
  }, [filters, tagsById, instances]);

  // Derived values 
  const selectedInstance = useMemo(
    () => instances.find((i) => i.id === selectedInstanceId) ?? null,
    [instances, selectedInstanceId],
  );

  const presentCount = useMemo(
    () => memberRows.filter((m) => m.status === "present").length,
    [memberRows],
  );

  // Handlers 
  const handleOpenInstance = (instanceId) => {
    setSelectedInstanceId(instanceId);
    setGeneralTotalCount(0);
    setGroupCounts({});
    setMemberRows([]);
    setNotes("");
    setLastSavedAt(null);
    loadModalData(instanceId);
  };

  const handleCloseInstance = () => {
    setSelectedInstanceId(null);
    setLastSavedAt(null);
    setSaveError(null);
  };

  const handleSaveAttendance = async () => {
    const token = getStoredAccessToken();
    if (!selectedInstance) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (selectedInstance.attendanceType === "general") {
        await upsertGeneralAttendance(token, {
          event_instance_id: selectedInstance.id,
          attendee_count:    generalTotalCount,
          group_counts: Object.entries(groupCounts).map(([attendance_group_id, count]) => ({
            attendance_group_id: Number(attendance_group_id),
            count,
          })),
        });
      } else {
        for (const row of memberRows) {
          await upsertMemberAttendance(token, {
            event_instance_id:   selectedInstance.id,
            member_id:           row.memberId,
            attendance_status:   row.status === "present" ? "attended" : "absent",
            registration_status: "registered",
          });
        }
      }
      setLastSavedAt(new Date().toISOString());
    } catch (err) {
      setSaveError(err.message ?? "Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Render 
  return (
    <section className="attendance-page">
      <header className="attendance-header">
        <div>
          <p className="attendance-subtitle">
            Register attendance by event instance. Click an instance row to open attendance capture.
          </p>
        </div>
        <div className="events-actions">
          <button
            type="button"
            className="members-secondary-button"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            Filters
          </button>
        </div>
      </header>

      {loadingData && <p className="events-register-empty">Loading instances…</p>}
      {dataError   && (
        <p className="events-register-empty" style={{ color: "var(--color-danger, red)" }}>
          {dataError}
        </p>
      )}

      {!loadingData && (
        <>
          <div className="events-series-list" role="list" aria-label="Attendance instances">
            {filteredInstances.length ? (
              filteredInstances.map((instance) => (
                <article
                  key={instance.id}
                  className="event-series-row"
                  role="listitem button"
                  tabIndex={0}
                  onClick={() => handleOpenInstance(instance.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenInstance(instance.id);
                    }
                  }}
                  aria-label={`Open attendance register for ${instance.seriesName}`}
                >
                  <div className="event-series-main">
                    <h3>{instance.seriesName}</h3>
                    <p>{instance.attendanceType} attendance</p>
                    <div className="event-series-badges">
                      <span className="event-series-badge event-series-badge-attendance">
                        {instance.attendanceType}
                      </span>
                    </div>
                  </div>

                  <div className="event-series-tags-section">
                    <span className="event-series-section-label">Tags</span>
                    <div className="event-series-tag-list">
                      {instance.tagIds.length ? (
                        instance.tagIds.map((tagId) => {
                          const tag = tagsById[tagId];
                          if (!tag) return null;
                          return (
                            <span
                              key={`attendance-tag-${instance.id}-${tag.id}`}
                              className="events-tag-pill"
                              style={{ borderColor: tag.color, color: tag.color }}
                            >
                              {tag.name}
                            </span>
                          );
                        })
                      ) : (
                        <span className="event-series-empty">No tags</span>
                      )}
                    </div>
                  </div>

                  <p className="event-series-meta">
                    <span>Date</span>
                    <strong>{formatDate(instance.startAt)}</strong>
                  </p>
                  <p className="event-series-meta">
                    <span>Time</span>
                    <strong>{formatTimeRange(instance.startAt, instance.endAt)}</strong>
                  </p>
                  <p className="event-series-meta">
                    <span>Location</span>
                    <strong>{instance.location || "—"}</strong>
                  </p>
                </article>
              ))
            ) : (
              <p className="events-register-empty">
                No attendance instances match your current filters.
              </p>
            )}
          </div>
          <p className="events-count">Showing {filteredInstances.length} attendance instances</p>
        </>
      )}

      {/* ── Filters drawer ── */}
      {filtersOpen && (
        <div
          className="members-drawer-backdrop"
          onClick={() => setFiltersOpen(false)}
          role="presentation"
        >
          <aside
            className="members-drawer members-filter-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="members-panel-head">
              <h3>Attendance Filters</h3>
              <button type="button" className="members-text-button" onClick={() => setFiltersOpen(false)}>
                Close
              </button>
            </div>

            <div className="members-filter-fields">
              <label>
                Search
                <input
                  value={filters.search}
                  onChange={(e) => setFilters((c) => ({ ...c, search: e.target.value }))}
                  placeholder="Series, location, date, time, tags"
                />
              </label>

              <label>
                Attendance Type
                <select
                  value={filters.attendanceType}
                  onChange={(e) => setFilters((c) => ({ ...c, attendanceType: e.target.value }))}
                >
                  <option value="all">All</option>
                  {filterOptions.attendanceTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                Day
                <select
                  value={filters.day}
                  onChange={(e) => setFilters((c) => ({ ...c, day: e.target.value }))}
                >
                  <option value="all">All</option>
                  {filterOptions.days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>

              <label>
                Date After
                <input
                  type="date"
                  value={filters.dateAfter}
                  onChange={(e) => setFilters((c) => ({ ...c, dateAfter: e.target.value }))}
                />
              </label>

              <label>
                Date Before
                <input
                  type="date"
                  value={filters.dateBefore}
                  onChange={(e) => setFilters((c) => ({ ...c, dateBefore: e.target.value }))}
                />
              </label>

              <label>
                Hour After
                <input
                  type="time"
                  value={filters.timeAfter}
                  onChange={(e) => setFilters((c) => ({ ...c, timeAfter: e.target.value }))}
                />
              </label>

              <label>
                Hour Before
                <input
                  type="time"
                  value={filters.timeBefore}
                  onChange={(e) => setFilters((c) => ({ ...c, timeBefore: e.target.value }))}
                />
              </label>

              <fieldset className="events-tag-picker">
                <legend>Tag</legend>
                <div className="events-tag-picker-list">
                  <button
                    type="button"
                    className={`events-tag-picker-item ${!filters.tagIds.length ? "events-tag-picker-item-selected" : ""}`}
                    onClick={() => setFilters((c) => ({ ...c, tagIds: [] }))}
                  >
                    All tags
                  </button>
                  {Object.values(tagsById).map((tag) => {
                    const selected = filters.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`events-tag-picker-item ${selected ? "events-tag-picker-item-selected" : ""}`}
                        onClick={() =>
                          setFilters((c) => ({
                            ...c,
                            tagIds: selected
                              ? c.tagIds.filter((id) => id !== tag.id)
                              : [...c.tagIds, tag.id],
                          }))
                        }
                        style={{ borderColor: tag.color }}
                      >
                        <span className="events-tag-picker-dot" style={{ background: tag.color }} />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <button
                type="button"
                className="members-secondary-button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
              >
                Clear Filters
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Attendance modal ── */}
      {selectedInstance && (
        <div
          className="members-drawer-backdrop events-modal-backdrop"
          onClick={handleCloseInstance}
          role="presentation"
        >
          <aside
            className="events-modal-card events-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="members-panel-head">
              <h3>{selectedInstance.seriesName}</h3>
              <button type="button" className="members-text-button" onClick={handleCloseInstance}>
                Close
              </button>
            </div>

            <section className="attendance-editor-card">
              <div className="attendance-editor-head">
                <div>
                  <p>
                    {formatDateTime(selectedInstance.startAt)} —{" "}
                    {formatDateTime(selectedInstance.endAt)}
                  </p>
                </div>
                <span className="attendance-mode-chip">
                  {selectedInstance.attendanceType} attendance
                </span>
              </div>

              {loadingModal ? (
                <p className="events-register-empty">Loading attendance data…</p>
              ) : selectedInstance.attendanceType === "general" ? (
                /* ── General attendance ── */
                <div className="attendance-form-grid">
                  <label>
                    Total Attendees
                    <input
                      type="number"
                      min="0"
                      value={generalTotalCount}
                      onChange={(e) => setGeneralTotalCount(Number(e.target.value || 0))}
                    />
                  </label>

                  {attendanceGroups.length > 0 && (
                    <fieldset className="attendance-groups-fieldset">
                      <legend>Attendance Groups</legend>
                      <div className="attendance-groups-grid">
                        {attendanceGroups.map((group) => (
                          <label key={group.id}>
                            {group.name}
                            <input
                              type="number"
                              min="0"
                              value={groupCounts[group.id] ?? 0}
                              onChange={(e) =>
                                setGroupCounts((c) => ({
                                  ...c,
                                  [group.id]: Number(e.target.value || 0),
                                }))
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                </div>
              ) : (
                /* ── Member attendance ── */
                <div className="attendance-form-grid">
                  <div className="attendance-roster-actions">
                    <p className="attendance-roster-count">
                      Present: {presentCount} / {memberRows.length}
                    </p>
                    <div className="attendance-roster-buttons">
                      <button
                        type="button"
                        className="members-secondary-button"
                        disabled={!memberRows.length}
                        onClick={() =>
                          setMemberRows((rows) => rows.map((m) => ({ ...m, status: "present" })))
                        }
                      >
                        Mark All Present
                      </button>
                      <button
                        type="button"
                        className="members-secondary-button"
                        disabled={!memberRows.length}
                        onClick={() =>
                          setMemberRows((rows) => rows.map((m) => ({ ...m, status: "absent" })))
                        }
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div
                    className="attendance-member-list"
                    role="list"
                    aria-label="Member attendance list"
                  >
                    {!memberRows.length ? (
                      <p className="members-empty-state">
                        No members found. Add members first.
                      </p>
                    ) : (
                      memberRows.map((member) => (
                        <div key={member.memberId} className="attendance-member-row" role="listitem">
                          <span>{member.name}</span>
                          <div className="attendance-member-toggle">
                            <button
                              type="button"
                              className={`attendance-toggle-button ${member.status === "present" ? "attendance-toggle-active" : ""}`}
                              onClick={() =>
                                setMemberRows((rows) =>
                                  rows.map((m) =>
                                    m.memberId === member.memberId ? { ...m, status: "present" } : m,
                                  ),
                                )
                              }
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={`attendance-toggle-button ${member.status === "absent" ? "attendance-toggle-active" : ""}`}
                              onClick={() =>
                                setMemberRows((rows) =>
                                  rows.map((m) =>
                                    m.memberId === member.memberId ? { ...m, status: "absent" } : m,
                                  ),
                                )
                              }
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <label className="attendance-notes-field">
                Notes
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes for this attendance session"
                  rows={3}
                />
              </label>

              {saveError && (
                <p style={{ color: "var(--color-danger, red)", marginBottom: "0.5rem" }}>
                  {saveError}
                </p>
              )}

              <div className="attendance-actions-row">
                {lastSavedAt ? (
                  <p className="attendance-saved-at">Last saved: {formatDateTime(lastSavedAt)}</p>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="members-primary-button"
                  onClick={handleSaveAttendance}
                  disabled={saving || loadingModal}
                >
                  {saving ? "Saving…" : "Save Attendance"}
                </button>
              </div>
            </section>
          </aside>
        </div>
      )}
    </section>
  );
}
