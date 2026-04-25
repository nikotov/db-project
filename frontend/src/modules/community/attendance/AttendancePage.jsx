import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const MOCK_INSTANCES = [
  {
    id: 1,
    seriesName: "Young Adults Small Group",
    startAt: "2026-04-21T19:00:00",
    endAt: "2026-04-21T20:30:00",
    location: "Room 204",
    attendanceType: "individual",
    registeredMemberIds: [1, 3, 5],
  },
  {
    id: 2,
    seriesName: "Leaders Planning Meeting",
    startAt: "2026-04-23T20:15:00",
    endAt: "2026-04-23T21:30:00",
    location: "Conference Room A",
    attendanceType: "general",
    registeredMemberIds: [2, 4],
  },
  {
    id: 3,
    seriesName: "Neighborhood Prayer Night",
    startAt: "2026-04-25T19:30:00",
    endAt: "2026-04-25T21:30:00",
    location: "Prayer Hall",
    attendanceType: "general",
    registeredMemberIds: [1, 2, 6],
  },
  {
    id: 4,
    seriesName: "Sunday Service",
    startAt: "2026-04-27T10:00:00",
    endAt: "2026-04-27T11:30:00",
    location: "Main Auditorium",
    attendanceType: "individual",
    registeredMemberIds: [1, 2, 4],
  },
];

const MOCK_ATTENDANCE_GROUPS = [
  { id: "adults", label: "Adults" },
  { id: "youth", label: "Youth" },
  { id: "kids", label: "Kids" },
  { id: "visitors", label: "Visitors" },
];

const MOCK_MEMBERS = [
  { id: 1, name: "Daniel Gomez" },
  { id: 2, name: "Mariana Lopez" },
  { id: 3, name: "Samuel Ortiz" },
  { id: 4, name: "Elena Vega" },
  { id: 5, name: "Camila Rivera" },
  { id: 6, name: "Jorge Mendez" },
];

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

function buildInitialGroupCounts() {
  return Object.fromEntries(MOCK_ATTENDANCE_GROUPS.map((group) => [group.id, 0]));
}

function buildInitialMemberRows(instance) {
  const registeredMemberIds = instance?.registeredMemberIds ?? [];
  const registeredMembers = MOCK_MEMBERS.filter((member) => registeredMemberIds.includes(member.id));

  return registeredMembers.map((member) => ({
    memberId: member.id,
    name: member.name,
    status: "absent",
  }));
}

export default function AttendancePage() {
  const [searchParams] = useSearchParams();
  const queryInstanceId = Number(searchParams.get("instanceId"));

  const initialInstance = MOCK_INSTANCES.find((item) => item.id === queryInstanceId) ?? MOCK_INSTANCES[0];

  const [selectedInstanceId, setSelectedInstanceId] = useState(initialInstance.id);
  const [generalTotalCount, setGeneralTotalCount] = useState(0);
  const [groupCounts, setGroupCounts] = useState(buildInitialGroupCounts);
  const [memberRows, setMemberRows] = useState(() => buildInitialMemberRows(initialInstance));
  const [notes, setNotes] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const selectedInstance = useMemo(
    () => MOCK_INSTANCES.find((instance) => instance.id === selectedInstanceId) ?? MOCK_INSTANCES[0],
    [selectedInstanceId]
  );

  const presentCount = useMemo(
    () => memberRows.filter((member) => member.status === "present").length,
    [memberRows]
  );

  const handleInstanceChange = (instanceId) => {
    const nextInstance = MOCK_INSTANCES.find((instance) => instance.id === instanceId) ?? MOCK_INSTANCES[0];

    setSelectedInstanceId(instanceId);
    setGeneralTotalCount(0);
    setGroupCounts(buildInitialGroupCounts());
    setMemberRows(buildInitialMemberRows(nextInstance));
    setNotes("");
    setLastSavedAt(null);
  };

  const handleSaveAttendance = () => {
    setLastSavedAt(new Date().toISOString());
  };

  return (
    <section className="attendance-page">
      <header className="attendance-header">
        <div>
          <p className="attendance-subtitle">
            Register attendance by event instance. Mode is inherited from the event series attendance type.
          </p>
        </div>
      </header>

      <div className="attendance-instance-list" role="list" aria-label="Attendance instances">
        {MOCK_INSTANCES.map((instance) => {
          const selected = instance.id === selectedInstanceId;

          return (
            <button
              key={instance.id}
              type="button"
              role="listitem"
              className={`attendance-instance-row ${selected ? "attendance-instance-row-active" : ""}`}
              onClick={() => handleInstanceChange(instance.id)}
            >
              <div className="attendance-instance-main">
                <h3>{instance.seriesName}</h3>
                <p>{formatDateTime(instance.startAt)}</p>
              </div>
              <div className="attendance-instance-meta">
                <span className="attendance-type-pill">{instance.attendanceType}</span>
                <span>{instance.location}</span>
              </div>
            </button>
          );
        })}
      </div>

      <section className="attendance-editor-card">
        <div className="attendance-editor-head">
          <div>
            <h3>{selectedInstance.seriesName}</h3>
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
    </section>
  );
}
