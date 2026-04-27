import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchAttendanceGroups,
  fetchMemberAttendance,
  fetchEventInstances,
  getStoredAccessToken,
  apiFetch,
} from "../../../api/client";



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
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeRange(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startAt} - ${endAt}`;
  }

  return `${start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString(
    undefined,
    { hour: "2-digit", minute: "2-digit" }
  )}`;
}

function parseTimeToMinutes(timeText) {
  if (!timeText || !timeText.includes(":")) {
    return null;
  }

  const [hoursText, minutesText] = timeText.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}


function buildInitialGroupCounts(groups) {
  return Object.fromEntries((groups || []).map((group) => [group.id, 0]));
}

function buildInitialMemberRows(members) {
  return (members || []).map((member) => ({
    memberId: member.id,
    name: member.name,
    status: "absent",
  }));
}


export default function AttendancePage() {
  const [searchParams] = useSearchParams();
  const queryInstanceId = Number(searchParams.get("instanceId"));

  // State for fetched data
  const [attendanceGroups, setAttendanceGroups] = useState([]);
  const [instances, setInstances] = useState([]);
  const [tags, setTags] = useState([]); // If you have event tags API, fetch here
  const [members, setMembers] = useState([]); // If you have members API, fetch here

  // UI state
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [generalTotalCount, setGeneralTotalCount] = useState(0);
  const [groupCounts, setGroupCounts] = useState({});
  const [memberRows, setMemberRows] = useState([]);
  const [notes, setNotes] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Fetch attendance groups and event instances on mount
  useEffect(() => {
    const token = getStoredAccessToken();
    fetchAttendanceGroups(token)
      .then(setAttendanceGroups)
      .catch(() => setAttendanceGroups([]));
    fetchEventInstances(token)
      .then(setInstances)
      .catch(() => setInstances([]));
    // Optionally fetch tags and members if needed
  }, []);

  // Set initial instance selection after data loads
  useEffect(() => {
    if (instances.length) {
      const initial =
        instances.find((item) => item.id === queryInstanceId) || instances[0];
      setSelectedInstanceId(initial?.id || null);
    }
  }, [instances, queryInstanceId]);

  // Fetch member attendance when instance changes
  useEffect(() => {
    const token = getStoredAccessToken();
    if (selectedInstanceId) {
      fetchMemberAttendance(token, selectedInstanceId)
        .then((attendance) => {
          // Map backend attendance to memberRows shape
          setMemberRows(
            (attendance || []).map((row) => ({
              memberId: row.member_id,
              name: row.member_name || `Member #${row.member_id}`,
              status: row.attendance_status === "attended" ? "present" : "absent",
            }))
          );
        })
        .catch(() => setMemberRows([]));
    } else {
      setMemberRows([]);
    }
  }, [selectedInstanceId]);

  // Build tagsById from tags
  const tagsById = useMemo(
    () => Object.fromEntries((tags || []).map((tag) => [tag.id, tag])),
    [tags]
  );

  const selectedInstance = useMemo(
    () => instances.find((instance) => instance.id === selectedInstanceId) || null,
    [instances, selectedInstanceId]
  );

  const filterOptions = useMemo(
    () => ({
      attendanceTypes: [...new Set(instances.map((instance) => instance.attendanceType))],
      days: [...new Set(instances.map((instance) => new Date(instance.startAt).toLocaleDateString(undefined, { weekday: "long" })))],
    }),
    [instances]
  );

  const filteredInstances = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return (instances || []).filter((instance) => {
      const start = new Date(instance.startAt);
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const instanceDay = start.toLocaleDateString(undefined, { weekday: "long" });
      const tagNames = (instance.tagIds || []).map((tagId) => tagsById[tagId]?.name ?? "").join(" ").toLowerCase();
      const matchesSearch =
        !search ||
        (instance.seriesName || "").toLowerCase().includes(search) ||
        (instance.location || "").toLowerCase().includes(search) ||
        (instance.attendanceType || "").toLowerCase().includes(search) ||
        formatDate(instance.startAt).toLowerCase().includes(search) ||
        formatTimeRange(instance.startAt, instance.endAt).toLowerCase().includes(search) ||
        tagNames.includes(search);
      const matchesAttendanceType =
        filters.attendanceType === "all" || instance.attendanceType === filters.attendanceType;
      const matchesTag =
        !filters.tagIds.length || filters.tagIds.every((selectedTagId) => (instance.tagIds || []).includes(selectedTagId));
      const matchesDay = filters.day === "all" || instanceDay === filters.day;

      const afterDate = filters.dateAfter ? new Date(`${filters.dateAfter}T00:00:00`) : null;
      const beforeDate = filters.dateBefore ? new Date(`${filters.dateBefore}T23:59:59`) : null;
      const matchesDateAfter = !afterDate || start >= afterDate;
      const matchesDateBefore = !beforeDate || start <= beforeDate;

      const afterMinutes = parseTimeToMinutes(filters.timeAfter);
      const beforeMinutes = parseTimeToMinutes(filters.timeBefore);
      const matchesTimeAfter = afterMinutes === null || startMinutes >= afterMinutes;
      const matchesTimeBefore = beforeMinutes === null || startMinutes <= beforeMinutes;

      return (
        matchesSearch &&
        matchesAttendanceType &&
        matchesTag &&
        matchesDay &&
        matchesDateAfter &&
        matchesDateBefore &&
        matchesTimeAfter &&
        matchesTimeBefore
      );
    });
  }, [filters, tagsById, instances]);

  const presentCount = useMemo(
    () => memberRows.filter((member) => member.status === "present").length,
    [memberRows]
  );

  const handleOpenInstance = (instanceId) => {
    setSelectedInstanceId(instanceId);
    setGeneralTotalCount(0);
    setGroupCounts(buildInitialGroupCounts(attendanceGroups));
    setMemberRows([]); // Will be loaded by useEffect
    setNotes("");
    setLastSavedAt(null);
  };

  const handleCloseInstance = () => {
    setSelectedInstanceId(null);
    setLastSavedAt(null);
  };

  // Save attendance handler (example for member attendance)
  const handleSaveAttendance = async () => {
    const token = getStoredAccessToken();
    if (!selectedInstance) return;
    try {
      if (selectedInstance.attendanceType === "general") {
        // Save general attendance
        await apiFetch(
          "/attendance/general",
          token,
          {
            method: "POST",
            body: JSON.stringify({
              event_instance_id: selectedInstance.id,
              attendee_count: generalTotalCount,
              group_counts: Object.entries(groupCounts).map(([attendance_group_id, count]) => ({ attendance_group_id: Number(attendance_group_id), count })),
            }),
          }
        );
      } else {
        // Save member attendance
        await Promise.all(
          memberRows.map((row) =>
            apiFetch(
              "/attendance/member",
              token,
              {
                method: "POST",
                body: JSON.stringify({
                  event_instance_id: selectedInstance.id,
                  member_id: row.memberId,
                  attendance_status: row.status === "present" ? "attended" : "absent",
                  registration_status: "registered",
                }),
              }
            )
          )
        );
      }
      setLastSavedAt(new Date().toISOString());
    } catch (err) {
      alert("Failed to save attendance");
    }
  };

  return (
    <section className="attendance-page">
      <header className="attendance-header">
        <div>
          <p className="attendance-subtitle">
            Register attendance by event instance. Click an instance row to open attendance capture.
          </p>
        </div>
        <div className="events-actions">
          <button type="button" className="members-secondary-button" onClick={() => setFiltersOpen((value) => !value)}>
            Filters
          </button>
        </div>
      </header>

      <div className="events-series-list" role="list" aria-label="Attendance instances">
        {filteredInstances.length ? (
          filteredInstances.map((instance) => {
          return (
            <article
              key={instance.id}
              className="event-series-row"
              role="listitem button"
              tabIndex={0}
              onClick={() => handleOpenInstance(instance.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleOpenInstance(instance.id);
                }
              }}
              aria-label={`Open attendance register for ${instance.seriesName}`}
            >
              <div className="event-series-main">
                <h3>{instance.seriesName}</h3>
                <p>{instance.attendanceType} attendance</p>
                <div className="event-series-badges">
                  <span className="event-series-badge event-series-badge-attendance">{instance.attendanceType}</span>
                </div>
              </div>

              <div className="event-series-tags-section">
                <span className="event-series-section-label">Tags</span>
                <div className="event-series-tag-list">
                  {instance.tagIds.length ? (
                    instance.tagIds.map((tagId) => {
                      const tag = tagsById[tagId];
                      if (!tag) {
                        return null;
                      }

                      return (
                        <span key={`attendance-tag-${instance.id}-${tag.id}`} className="events-tag-pill" style={{ borderColor: tag.color, color: tag.color }}>
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
                <strong>{instance.location}</strong>
              </p>
            </article>
          );
          })
        ) : (
          <p className="events-register-empty">No attendance instances match your current filters.</p>
        )}
      </div>

      <p className="events-count">Showing {filteredInstances.length} attendance instances</p>

      {filtersOpen ? (
        <div className="members-drawer-backdrop" onClick={() => setFiltersOpen(false)} role="presentation">
          <aside className="members-drawer members-filter-drawer" onClick={(event) => event.stopPropagation()}>
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
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Series, location, date, time, tags"
                />
              </label>

              <label>
                Attendance Type
                <select
                  value={filters.attendanceType}
                  onChange={(event) => setFilters((current) => ({ ...current, attendanceType: event.target.value }))}
                >
                  <option value="all">All</option>
                  {filterOptions.attendanceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Day
                <select value={filters.day} onChange={(event) => setFilters((current) => ({ ...current, day: event.target.value }))}>
                  <option value="all">All</option>
                  {filterOptions.days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date After
                <input
                  type="date"
                  value={filters.dateAfter}
                  onChange={(event) => setFilters((current) => ({ ...current, dateAfter: event.target.value }))}
                />
              </label>

              <label>
                Date Before
                <input
                  type="date"
                  value={filters.dateBefore}
                  onChange={(event) => setFilters((current) => ({ ...current, dateBefore: event.target.value }))}
                />
              </label>

              <label>
                Hour After
                <input
                  type="time"
                  value={filters.timeAfter}
                  onChange={(event) => setFilters((current) => ({ ...current, timeAfter: event.target.value }))}
                />
              </label>

              <label>
                Hour Before
                <input
                  type="time"
                  value={filters.timeBefore}
                  onChange={(event) => setFilters((current) => ({ ...current, timeBefore: event.target.value }))}
                />
              </label>

              <fieldset className="events-tag-picker">
                <legend>Tag</legend>
                <div className="events-tag-picker-list">
                  <button
                    type="button"
                    className={`events-tag-picker-item ${!filters.tagIds.length ? "events-tag-picker-item-selected" : ""}`}
                    onClick={() => setFilters((current) => ({ ...current, tagIds: [] }))}
                  >
                    All tags
                  </button>
                  {MOCK_ATTENDANCE_TAGS.map((tag) => {
                    const selected = filters.tagIds.includes(tag.id);

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`events-tag-picker-item ${selected ? "events-tag-picker-item-selected" : ""}`}
                        onClick={() =>
                          setFilters((current) => {
                            const isSelected = current.tagIds.includes(tag.id);
                            return {
                              ...current,
                              tagIds: isSelected
                                ? current.tagIds.filter((value) => value !== tag.id)
                                : [...current.tagIds, tag.id],
                            };
                          })
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

              <button type="button" className="members-secondary-button" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear Filters
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {selectedInstance ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={handleCloseInstance} role="presentation">
          <aside className="events-modal-card events-detail-modal" onClick={(event) => event.stopPropagation()}>
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
                    {formatDateTime(selectedInstance.startAt)} - {formatDateTime(selectedInstance.endAt)}
                  </p>
                </div>
                <span className="attendance-mode-chip">{selectedInstance.attendanceType} attendance</span>
              </div>

              {selectedInstance.attendanceType === "general" ? (
                <div className="attendance-form-grid">
                  <label>
                    Total Attendees
                    <input
                      type="number"
                      min="0"
                      value={generalTotalCount}
                      onChange={(event) => setGeneralTotalCount(Number(event.target.value || 0))}
                    />
                  </label>

                  <fieldset className="attendance-groups-fieldset">
                    <legend>Attendance Groups</legend>
                    <div className="attendance-groups-grid">
                      {MOCK_ATTENDANCE_GROUPS.map((group) => (
                        <label key={group.id}>
                          {group.label}
                          <input
                            type="number"
                            min="0"
                            value={groupCounts[group.id]}
                            onChange={(event) =>
                              setGroupCounts((current) => ({
                                ...current,
                                [group.id]: Number(event.target.value || 0),
                              }))
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              ) : (
                <div className="attendance-form-grid">
                  <div className="attendance-roster-actions">
                    <p className="attendance-roster-count">Present: {presentCount} / {memberRows.length}</p>
                    <div className="attendance-roster-buttons">
                      <button
                        type="button"
                        className="members-secondary-button"
                        disabled={!memberRows.length}
                        onClick={() =>
                          setMemberRows((current) => current.map((member) => ({ ...member, status: "present" })))
                        }
                      >
                        Mark All Present
                      </button>
                      <button
                        type="button"
                        className="members-secondary-button"
                        disabled={!memberRows.length}
                        onClick={() =>
                          setMemberRows((current) => current.map((member) => ({ ...member, status: "absent" })))
                        }
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="attendance-member-list" role="list" aria-label="Member attendance list">
                    {!memberRows.length ? (
                      <p className="members-empty-state">No registered members for this instance.</p>
                    ) : (
                      memberRows.map((member) => (
                        <div key={member.memberId} className="attendance-member-row" role="listitem">
                          <span>{member.name}</span>
                          <div className="attendance-member-toggle">
                            <button
                              type="button"
                              className={`attendance-toggle-button ${member.status === "present" ? "attendance-toggle-active" : ""}`}
                              onClick={() =>
                                setMemberRows((current) =>
                                  current.map((item) =>
                                    item.memberId === member.memberId ? { ...item, status: "present" } : item
                                  )
                                )
                              }
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={`attendance-toggle-button ${member.status === "absent" ? "attendance-toggle-active" : ""}`}
                              onClick={() =>
                                setMemberRows((current) =>
                                  current.map((item) =>
                                    item.memberId === member.memberId ? { ...item, status: "absent" } : item
                                  )
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
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional notes for this attendance session"
                  rows={3}
                />
              </label>

              <div className="attendance-actions-row">
                {lastSavedAt ? <p className="attendance-saved-at">Last saved: {formatDateTime(lastSavedAt)}</p> : <span />}
                <button type="button" className="members-primary-button" onClick={handleSaveAttendance}>
                  Save Attendance
                </button>
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </section>
  );

}