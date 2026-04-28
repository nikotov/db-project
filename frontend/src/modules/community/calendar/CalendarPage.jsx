import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  deleteEventInstance,
  fetchEventInstances,
  fetchEventSeries,
  getStoredAccessToken,
} from "../../../api/client";

const SLOT_START_HOUR = 0;
const SLOT_END_HOUR = 24;
const HOUR_HEIGHT = 72;
const TIMELINE_VERTICAL_PADDING = 24;

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

function formatDateKey(value) {
  // Use Intl so the date parts reflect the correct local date for the timezone,
  // not the browser's tz (which may differ from the server's stored UTC times)
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const p = Object.fromEntries(parts.map(({ type, value: v }) => [type, v]));
  return `${p.year}-${p.month}-${p.day}`;
}

const TZ = "America/Guayaquil";

function formatDate(value, options) {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...options }).format(value);
}

function hourLabel(hour24) {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${period}`;
}

function getMinutesFromDate(value) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "numeric", hour12: false }).formatToParts(value);
  const p = Object.fromEntries(parts.map(({ type, value: v }) => [type, v]));
  return Number(p.hour) * 60 + Number(p.minute);
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

function mapInstancesForCalendar(instancesRows, seriesRows) {
  const seriesById = Object.fromEntries(seriesRows.map((series) => [series.id, series]));

  return instancesRows.map((row) => {
    const series = seriesById[row.event_series_id];

    return {
      id: row.id,
      series_name: series?.name ?? `Series #${row.event_series_id}`,
      start_datetime: row.start_datetime,
      end_datetime: row.end_datetime,
      attendance_type: series?.attendance_type ?? "general",
      location: row.location ?? series?.location ?? "",
      attendee_count: row.attendee_count ?? 0,
      tags: (series?.tags ?? []).map((tag) => ({ name: tag.name, color: tag.color || "#4f86d9" })),
    };
  });
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [eventInstances, setEventInstances] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const schedulerScrollRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const token = getStoredAccessToken();
      if (!token) {
        if (active) {
          setError("Missing access token. Please sign in again.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const [instanceRows, seriesRows] = await Promise.all([
          fetchEventInstances(token),
          fetchEventSeries(token),
        ]);

        if (!active) {
          return;
        }

        setEventInstances(mapInstancesForCalendar(instanceRows, seriesRows));
        setError("");
      } catch (exception) {
        if (active) {
          setError(exception instanceof Error ? exception.message : "Failed to load calendar instances.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

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

    const targetHour = 9;
    const targetTop = TIMELINE_VERTICAL_PADDING + (targetHour - SLOT_START_HOUR) * HOUR_HEIGHT;

    scroller.scrollTop = Math.max(0, targetTop - scroller.clientHeight * 0.2);
  }, []);

  const weekEventsByDayIndex = useMemo(() => {
    const dayIndexByKey = Object.fromEntries(weekDays.map((day, index) => [formatDateKey(day), index]));

    return eventInstances.reduce((acc, instance) => {
      const start = new Date(instance.start_datetime);
      const end = new Date(instance.end_datetime);
      const dayIndex = dayIndexByKey[formatDateKey(start)];

      if (dayIndex === undefined || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return acc;
      }

      const startMinutes = getMinutesFromDate(start);
      const endMinutes = getMinutesFromDate(end);
      const durationMinutes = Math.max(30, endMinutes - startMinutes);
      const top = ((startMinutes - dayStartMinutes) / 60) * HOUR_HEIGHT + TIMELINE_VERTICAL_PADDING;
      const height = Math.max(28, (durationMinutes / 60) * HOUR_HEIGHT);

      if (!acc[dayIndex]) {
        acc[dayIndex] = [];
      }

      acc[dayIndex].push({
        event_instance: instance,
        _layout: {
          top,
          height,
        },
      });

      acc[dayIndex].sort((a, b) => a._layout.top - b._layout.top);

      return acc;
    }, {});
  }, [dayStartMinutes, eventInstances, weekDays]);

  const handleRemoveSelectedEvent = async () => {
    if (!selectedEvent) {
      return;
    }

    const confirmed = window.confirm(
      `Remove calendar event instance "${selectedEvent.series_name}" on ${formatDateTime(selectedEvent.start_datetime)}?`
    );
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = getStoredAccessToken();
      await deleteEventInstance(token, selectedEvent.id);
      setEventInstances((current) => current.filter((item) => item.id !== selectedEvent.id));
      setSelectedEvent(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to remove event instance.");
    } finally {
      setSaving(false);
    }
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

      {loading ? <p className="events-register-empty">Loading calendar...</p> : null}
      {error ? <p className="events-register-empty">{error}</p> : null}

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
              <button type="button" className="events-tag-remove-button" onClick={handleRemoveSelectedEvent} disabled={saving}>
                Remove Instance
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}