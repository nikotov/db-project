import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const SLOT_START_HOUR = 0;
const SLOT_END_HOUR = 24;
const HOUR_HEIGHT = 72;
const TIMELINE_VERTICAL_PADDING = 24;

const MOCK_EVENT_INSTANCES = [
  {
    id: 1,
    dayOffset: 0,
    startHour: 19,
    startMinute: 0,
    durationMinutes: 90,
    seriesName: "Young Adults Small Group",
    attendanceType: "individual",
    location: "Room 204",
    expected_attendees: 18,
    tags: [
      { name: "youth", color: "#7c5cff" },
      { name: "church", color: "#4f86d9" },
    ],
  },
  {
    id: 2,
    dayOffset: 2,
    startHour: 20,
    startMinute: 15,
    durationMinutes: 75,
    seriesName: "Leaders Planning Meeting",
    attendanceType: "general",
    location: "Conference Room A",
    expected_attendees: 9,
    tags: [{ name: "church", color: "#4f86d9" }],
  },
  {
    id: 3,
    dayOffset: 4,
    startHour: 19,
    startMinute: 30,
    durationMinutes: 120,
    seriesName: "Neighborhood Prayer Night",
    attendanceType: "general",
    location: "Prayer Hall",
    expected_attendees: 32,
    tags: [{ name: "prayer", color: "#2f9e7a" }],
  },
  {
    id: 4,
    dayOffset: 6,
    startHour: 10,
    startMinute: 0,
    durationMinutes: 90,
    seriesName: "Sunday Service",
    attendanceType: "individual",
    location: "Main Auditorium",
    expected_attendees: 185,
    tags: [{ name: "church", color: "#4f86d9" }],
  },
];

function startOfWeek(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);

  const day = value.getDay();
  const diffToMonday = (day + 6) % 7;
  value.setDate(value.getDate() - diffToMonday);

  return value;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function addMinutes(date, minutes) {
  const value = new Date(date);
  value.setMinutes(value.getMinutes() + minutes);
  return value;
}

function formatDateKey(value) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function createDateAtHour(baseDate, hour, minute = 0) {
  const value = new Date(baseDate);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function buildMockWeekEvents(weekStart, instances) {
  return instances.map((template) => {
    const eventDate = addDays(weekStart, template.dayOffset);
    const startDatetime = createDateAtHour(eventDate, template.startHour, template.startMinute);
    const endDatetime = addMinutes(startDatetime, template.durationMinutes);

    return {
      event_instance: {
        id: template.id,
        series_name: template.seriesName,
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        attendance_type: template.attendanceType,
        location: template.location,
        attendee_count: template.expected_attendees,
        tags: template.tags,
      },
    };
  });
}

function formatDate(value, options) {
  return new Intl.DateTimeFormat("en-US", options).format(value);
}

function hourLabel(hour24) {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${period}`;
}

function getMinutesFromDate(value) {
  return value.getHours() * 60 + value.getMinutes();
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatDate(parsed, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [eventInstances, setEventInstances] = useState(MOCK_EVENT_INSTANCES);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const schedulerScrollRef = useRef(null);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const weekRangeLabel = useMemo(() => {
    const weekEnd = weekDays[6];
    return `${formatDate(weekStart, {
      month: "short",
      day: "numeric",
    })} - ${formatDate(weekEnd, { month: "short", day: "numeric", year: "numeric" })}`;
  }, [weekDays, weekStart]);

  const dayStartMinutes = SLOT_START_HOUR * 60;
  const totalHours = SLOT_END_HOUR - SLOT_START_HOUR;
  const schedulerHeight = totalHours * HOUR_HEIGHT + TIMELINE_VERTICAL_PADDING * 2;
  const schedulerGridTemplate = "72px repeat(7, minmax(180px, 1fr))";

  const hourSlots = useMemo(
    () => Array.from({ length: totalHours + 1 }, (_, index) => SLOT_START_HOUR + index),
    [totalHours]
  );

  useEffect(() => {
    const scroller = schedulerScrollRef.current;
    if (!scroller) {
      return;
    }

    // Default viewport around 8-10 AM by anchoring near 9 AM.
    const targetHour = 9;
    const targetTop =
      TIMELINE_VERTICAL_PADDING + (targetHour - SLOT_START_HOUR) * HOUR_HEIGHT;

    scroller.scrollTop = Math.max(0, targetTop - scroller.clientHeight * 0.2);
  }, []);

  const weekEventsByDayIndex = useMemo(() => {
    const events = buildMockWeekEvents(weekStart, eventInstances);

    const dayIndexByKey = Object.fromEntries(weekDays.map((day, index) => [formatDateKey(day), index]));

    return events.reduce((acc, event) => {
      const start = new Date(event.event_instance.start_datetime);
      const dayIndex = dayIndexByKey[formatDateKey(start)];

      if (dayIndex === undefined) {
        return acc;
      }

      const startMinutes = getMinutesFromDate(start);
      const endMinutes = getMinutesFromDate(new Date(event.event_instance.end_datetime));
      const durationMinutes = Math.max(30, endMinutes - startMinutes);
      const top = ((startMinutes - dayStartMinutes) / 60) * HOUR_HEIGHT + TIMELINE_VERTICAL_PADDING;
      const height = Math.max(28, (durationMinutes / 60) * HOUR_HEIGHT);

      if (!acc[dayIndex]) {
        acc[dayIndex] = [];
      }

      acc[dayIndex].push({
        ...event,
        _layout: {
          top,
          height,
        },
      });

      acc[dayIndex].sort((a, b) => a._layout.top - b._layout.top);

      return acc;
    }, {});
  }, [dayStartMinutes, eventInstances, weekDays]);

  const handleRemoveSelectedEvent = () => {
    if (!selectedEvent) {
      return;
    }

    const confirmed = window.confirm(
      `Remove calendar event instance "${selectedEvent.series_name}" on ${formatDateTime(selectedEvent.start_datetime)}?`
    );
    if (!confirmed) {
      return;
    }

    setEventInstances((current) => current.filter((item) => item.id !== selectedEvent.id));
    setSelectedEvent(null);
  };

  return (
    <section className="calendar-page">
      <header className="calendar-header">
        <div>
          <h2>Weekly Calendar</h2>
          <p className="calendar-subtitle">Week of {weekRangeLabel}</p>
        </div>

        <div className="calendar-actions">
          <button
            type="button"
            className="calendar-nav-button"
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
          >
            Previous Week
          </button>
          <button
            type="button"
            className="calendar-nav-button"
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
          >
            Next Week
          </button>
        </div>
      </header>

      <section className="week-scheduler">
        <div className="week-scheduler-scroll" ref={schedulerScrollRef}>
          <div className="week-scheduler-header" style={{ gridTemplateColumns: schedulerGridTemplate }}>
            <div className="time-gutter-header" />
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="scheduler-day-header-cell">
                <p className="calendar-day-name">{formatDate(day, { weekday: "short" })}</p>
                <p className="calendar-day-date">{formatDate(day, { month: "short", day: "numeric" })}</p>
              </div>
            ))}
          </div>

          <div
            className="week-scheduler-grid"
            style={{ gridTemplateColumns: schedulerGridTemplate }}
          >
            <div className="scheduler-time-gutter" style={{ height: `${schedulerHeight}px` }}>
              {hourSlots.map((slot) => (
                <div
                  key={slot}
                  className="time-slot-label"
                  style={{
                    top: `${TIMELINE_VERTICAL_PADDING + (slot - SLOT_START_HOUR) * HOUR_HEIGHT}px`,
                  }}
                >
                  {hourLabel(slot)}
                </div>
              ))}
            </div>

            {weekDays.map((day, index) => {
              const events = weekEventsByDayIndex[index] ?? [];

              return (
                <div key={day.toISOString()} className="scheduler-day-column" style={{ height: `${schedulerHeight}px` }}>
                  {Array.from({ length: totalHours + 1 }).map((_, rowIndex) => (
                    <div
                      key={`${day.toISOString()}-${rowIndex}`}
                      className="scheduler-hour-line"
                      style={{ top: `${TIMELINE_VERTICAL_PADDING + rowIndex * HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {events.map((event) => {
                    const start = new Date(event.event_instance.start_datetime);
                    const end = new Date(event.event_instance.end_datetime);

                    return (
                      <article
                        key={event.event_instance.id}
                        className="scheduler-event-card"
                        tabIndex={0}
                        role="button"
                        aria-label={`Open details for ${event.event_instance.series_name}`}
                        onClick={() => setSelectedEvent(event.event_instance)}
                        onKeyDown={(eventKey) => {
                          if (eventKey.key === "Enter" || eventKey.key === " ") {
                            eventKey.preventDefault();
                            setSelectedEvent(event.event_instance);
                          }
                        }}
                        style={{
                          top: `${event._layout.top}px`,
                          height: `${event._layout.height}px`,
                        }}
                      >
                        <p className="calendar-event-title">{event.event_instance.series_name}</p>
                        <p className="calendar-event-time">
                          {formatDate(start, { hour: "numeric", minute: "2-digit" })}
                          {" - "}
                          {formatDate(end, { hour: "numeric", minute: "2-digit" })}
                        </p>
                        <div className="calendar-event-meta">
                          <span className="calendar-event-pill">{event.event_instance.location || "No location"}</span>
                          <span>{event.event_instance.attendee_count}</span>
                        </div>
                        <div className="calendar-event-tags">
                          {event.event_instance.tags.map((tag) => (
                            <span key={`${event.event_instance.id}-${tag.name}`} className="events-tag-pill" style={{ borderColor: tag.color, color: tag.color }}>
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {selectedEvent ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={() => setSelectedEvent(null)} role="presentation">
          <aside className="events-modal-card calendar-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>{selectedEvent.series_name}</h3>
              <button type="button" className="members-text-button" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>

            <div className="calendar-detail-grid" role="list" aria-label="Selected calendar event details">
              <p className="calendar-detail-item" role="listitem">
                <span>Instance ID</span>
                <strong>{selectedEvent.id}</strong>
              </p>
              <p className="calendar-detail-item" role="listitem">
                <span>Starts</span>
                <strong>{formatDateTime(selectedEvent.start_datetime)}</strong>
              </p>
              <p className="calendar-detail-item" role="listitem">
                <span>Ends</span>
                <strong>{formatDateTime(selectedEvent.end_datetime)}</strong>
              </p>
              <p className="calendar-detail-item" role="listitem">
                <span>Location</span>
                <strong>{selectedEvent.location || "No location"}</strong>
              </p>
              <p className="calendar-detail-item" role="listitem">
                <span>Attendees</span>
                <strong>{selectedEvent.attendee_count ?? "-"}</strong>
              </p>
              <p className="calendar-detail-item" role="listitem">
                <span>Attendance Type</span>
                <strong>{selectedEvent.attendance_type ?? "general"}</strong>
              </p>
              <div className="calendar-detail-item" role="listitem">
                <span>Tags</span>
                <div className="event-series-tag-list">
                  {selectedEvent.tags.length ? (
                    selectedEvent.tags.map((tag) => (
                      <span key={`${selectedEvent.id}-detail-${tag.name}`} className="events-tag-pill" style={{ borderColor: tag.color, color: tag.color }}>
                        {tag.name}
                      </span>
                    ))
                  ) : (
                    <strong>No tags</strong>
                  )}
                </div>
              </div>
            </div>

            <div className="detail-modal-actions">
              <button
                type="button"
                className="members-secondary-button"
                onClick={() => {
                  navigate(`/community/attendance?instanceId=${selectedEvent.id}`);
                  setSelectedEvent(null);
                }}
              >
                Register Attendance
              </button>
              <button type="button" className="events-tag-remove-button" onClick={handleRemoveSelectedEvent}>
                Remove Instance
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
