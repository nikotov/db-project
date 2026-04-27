import { useEffect, useMemo, useState } from "react";

import {
  createEventInstance,
  createEventSeries,
  createEventTag,
  deleteEventSeries,
  deleteEventTag,
  fetchEventInstances,
  fetchEventSeries,
  fetchEventTags,
  generateEventInstances,
  getStoredAccessToken,
  updateEventSeries,
} from "../../../api/client";

const DEFAULT_FILTERS = {
  search: "",
  status: "all",
  recurrenceType: "all",
  tagIds: [],
};

const CREATE_INITIAL = {
  title: "",
  attendanceType: "general",
  recurrenceType: "weekly",
  recurrenceRule: "",
  startTime: "",
  endTime: "",
  location: "",
  status: "active",
  nextOccurrence: "",
  generateFromDate: "",
  generateToDate: "",
  tagIds: [],
};

const TAG_INITIAL = {
  name: "",
  color: "#4f86d9",
};

function emptyToNull(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function seriesToForm(item) {
  if (!item) {
    return { ...CREATE_INITIAL };
  }

  return {
    title: item.title ?? "",
    attendanceType: item.attendanceType ?? "general",
    recurrenceType: item.recurrenceType ?? "weekly",
    recurrenceRule: item.recurrenceRule ?? "",
    startTime: item.startTime ?? "",
    endTime: item.endTime ?? "",
    location: item.location ?? "",
    status: item.status ?? "active",
    nextOccurrence: item.nextOccurrence ?? "",
    tagIds: item.tagIds ?? [],
  };
}

function formatDate(dateText) {
  if (!dateText) {
    return "-";
  }

  const parsed = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateText;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeForInput(value) {
  if (!value) {
    return "";
  }
  return String(value).slice(0, 5);
}

function formatTimeRange(startTime, endTime) {
  const start = formatTimeForInput(startTime);
  const end = formatTimeForInput(endTime);
  if (!start && !end) {
    return "-";
  }
  if (start && end) {
    return `${start} - ${end}`;
  }
  return start || end;
}

function toIsoDate(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function mapSeriesForUi(seriesRows, instanceRows) {
  const bySeriesId = instanceRows.reduce((acc, row) => {
    if (!acc[row.event_series_id]) {
      acc[row.event_series_id] = [];
    }
    acc[row.event_series_id].push(row);
    return acc;
  }, {});

  const now = new Date();

  return seriesRows.map((item) => {
    const instances = (bySeriesId[item.id] ?? []).slice().sort((a, b) => {
      return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
    });

    const nextInstance = instances.find((instance) => new Date(instance.start_datetime) >= now) ?? instances[0] ?? null;

    return {
      id: item.id,
      title: item.name,
      attendanceType: item.attendance_type,
      recurrenceType: item.recurrence_type,
      recurrenceRule: item.recurrence_rule,
      startTime: formatTimeForInput(item.start_time),
      endTime: formatTimeForInput(item.end_time),
      location: item.location,
      status: item.status,
      nextOccurrence: nextInstance ? toIsoDate(nextInstance.start_datetime) : "",
      tagIds: (item.tags ?? []).map((tag) => tag.id),
      tags: item.tags ?? [],
      instanceCount: instances.length,
    };
  });
}

function buildSeriesPayload(form) {
  return {
    name: form.title.trim(),
    description: null,
    attendance_type: form.attendanceType,
    recurrence_type: form.recurrenceType,
    recurrence_rule: form.recurrenceType === "none" ? null : emptyToNull(form.recurrenceRule),
    status: form.status,
    location: emptyToNull(form.location),
    start_time: form.startTime || null,
    end_time: form.endTime || null,
    tag_ids: form.tagIds,
  };
}

function buildOneTimeInstancePayload(seriesId, form) {
  if (form.recurrenceType !== "none" || !form.nextOccurrence || !form.startTime || !form.endTime) {
    return null;
  }

  return {
    event_series_id: seriesId,
    start_datetime: `${form.nextOccurrence}T${form.startTime}:00`,
    end_datetime: `${form.nextOccurrence}T${form.endTime}:00`,
    location: emptyToNull(form.location),
    attendance_notes: null,
    attendee_count: 0,
  };
}

export default function EventsPage() {
  const [series, setSeries] = useState([]);
  const [tags, setTags] = useState([]);
  const [instances, setInstances] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [createForm, setCreateForm] = useState({ ...CREATE_INITIAL });
  const [tagForm, setTagForm] = useState(TAG_INITIAL);
  const [editForm, setEditForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
        const [seriesRows, tagRows, instanceRows] = await Promise.all([
          fetchEventSeries(token),
          fetchEventTags(token),
          fetchEventInstances(token),
        ]);

        if (!active) {
          return;
        }

        setTags(tagRows);
        setInstances(instanceRows);
        setSeries(mapSeriesForUi(seriesRows, instanceRows));
        setError("");
      } catch (exception) {
        if (active) {
          setError(exception instanceof Error ? exception.message : "Failed to load events.");
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

  const tagsById = useMemo(() => Object.fromEntries(tags.map((tag) => [tag.id, tag])), [tags]);

  const selectedSeries = useMemo(
    () => series.find((item) => item.id === selectedSeriesId) ?? null,
    [series, selectedSeriesId]
  );

  const filterOptions = useMemo(
    () => ({
      statuses: [...new Set(series.map((item) => item.status))],
      recurrenceTypes: [...new Set(series.map((item) => item.recurrenceType))],
    }),
    [series]
  );

  const filteredSeries = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return series.filter((item) => {
      const tagNames = item.tagIds.map((tagId) => tagsById[tagId]?.name ?? "").join(" ").toLowerCase();
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.attendanceType.toLowerCase().includes(search) ||
        (item.location ?? "").toLowerCase().includes(search) ||
        (item.recurrenceRule ?? "").toLowerCase().includes(search) ||
        item.recurrenceType.toLowerCase().includes(search) ||
        tagNames.includes(search);
      const matchesStatus = filters.status === "all" || item.status === filters.status;
      const matchesRecurrenceType =
        filters.recurrenceType === "all" || item.recurrenceType === filters.recurrenceType;
      const matchesTag =
        !filters.tagIds.length || filters.tagIds.every((selectedTagId) => item.tagIds.includes(selectedTagId));

      return matchesSearch && matchesStatus && matchesRecurrenceType && matchesTag;
    });
  }, [filters, series, tagsById]);

  const refreshFromApi = async () => {
    const token = getStoredAccessToken();
    const [seriesRows, tagRows, instanceRows] = await Promise.all([
      fetchEventSeries(token),
      fetchEventTags(token),
      fetchEventInstances(token),
    ]);

    setTags(tagRows);
    setInstances(instanceRows);
    setSeries(mapSeriesForUi(seriesRows, instanceRows));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = getStoredAccessToken();
      const created = await createEventSeries(token, buildSeriesPayload(createForm));

      if (createForm.recurrenceType === "none") {
        // One-time series: create a single instance from the date field
        const oneTimeInstancePayload = buildOneTimeInstancePayload(created.id, createForm);
        if (oneTimeInstancePayload) {
          await createEventInstance(token, oneTimeInstancePayload);
        }
      } else if (createForm.generateFromDate && createForm.generateToDate) {
        // Recurring series: generate instances for the specified date range
        await generateEventInstances(
          token,
          created.id,
          createForm.generateFromDate,
          createForm.generateToDate,
        );
      }

      await refreshFromApi();
      setCreateForm({ ...CREATE_INITIAL });
      setCreateOpen(false);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to create event series.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTag = async (event) => {
    event.preventDefault();

    const name = tagForm.name.trim().toLowerCase();
    if (!name) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = getStoredAccessToken();
      await createEventTag(token, {
        name,
        color: tagForm.color || "#4f86d9",
      });
      await refreshFromApi();
      setTagForm(TAG_INITIAL);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to create tag.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSeriesTag = (tagId) => {
    setCreateForm((current) => {
      const isSelected = current.tagIds.includes(tagId);

      return {
        ...current,
        tagIds: isSelected ? current.tagIds.filter((value) => value !== tagId) : [...current.tagIds, tagId],
      };
    });
  };

  const handleRemoveTag = async (tagId) => {
    const tagToRemove = tagsById[tagId];
    const confirmed = window.confirm(
      `Remove tag "${tagToRemove?.name ?? "this tag"}"? This may fail if the tag is still linked to series.`
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = getStoredAccessToken();
      await deleteEventTag(token, tagId);
      await refreshFromApi();
      setCreateForm((current) => ({
        ...current,
        tagIds: current.tagIds.filter((value) => value !== tagId),
      }));
      setFilters((current) => ({
        ...current,
        tagIds: current.tagIds.filter((value) => value !== tagId),
      }));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to remove tag.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSelectedSeries = async () => {
    if (!selectedSeries) {
      return;
    }

    const confirmed = window.confirm(`Remove event series "${selectedSeries.title}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = getStoredAccessToken();
      await deleteEventSeries(token, selectedSeries.id);
      await refreshFromApi();
      setSelectedSeriesId(null);
      setEditForm(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to remove series.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEditTag = (tagId) => {
    setEditForm((current) => {
      if (!current) {
        return current;
      }

      const isSelected = current.tagIds.includes(tagId);
      return {
        ...current,
        tagIds: isSelected ? current.tagIds.filter((value) => value !== tagId) : [...current.tagIds, tagId],
      };
    });
  };

  const handleSaveSeries = async (event) => {
    event.preventDefault();
    if (!selectedSeries || !editForm) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = getStoredAccessToken();
      await updateEventSeries(token, selectedSeries.id, buildSeriesPayload(editForm));
      await refreshFromApi();
      setEditForm(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to update series.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="events-page">
      <header className="events-header">
        <div>
          <p className="events-subtitle">Manage recurring event series that generate future instances in the calendar.</p>
        </div>

        <div className="events-actions">
          <button type="button" className="members-secondary-button" onClick={() => setFiltersOpen((value) => !value)}>
            Filters
          </button>
          <button type="button" className="members-secondary-button" onClick={() => setTagsOpen((value) => !value)}>
            Tags
          </button>
          <button type="button" className="members-primary-button" onClick={() => setCreateOpen((value) => !value)}>
            Create Series
          </button>
        </div>
      </header>

      {loading ? <p className="events-register-empty">Loading event series...</p> : null}
      {error ? <p className="events-register-empty">{error}</p> : null}

      <div className="events-series-list" role="list" aria-label="Event series list">
        {filteredSeries.map((item) => (
          <article
            key={item.id}
            className="event-series-row"
            role="listitem"
            tabIndex={0}
            onClick={() => {
              setSelectedSeriesId(item.id);
              setEditForm(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedSeriesId(item.id);
                setEditForm(null);
              }
            }}
            aria-label={`Open details for ${item.title}`}
          >
            <div className="event-series-main">
              <h3>{item.title}</h3>
              <p>{item.recurrenceRule || "One-time event"}</p>
              <div className="event-series-badges">
                <span className="event-series-badge event-series-badge-attendance">{item.attendanceType}</span>
                <span className="event-series-badge event-series-badge-recurrence">{item.recurrenceType}</span>
                <span className={`event-series-badge event-series-status-${item.status}`}>{item.status}</span>
              </div>
            </div>

            <div className="event-series-tags-section">
              <span className="event-series-section-label">Tags</span>
              <div className="event-series-tag-list">
                {item.tagIds.length ? (
                  item.tagIds.map((tagId) => {
                    const tag = tagsById[tagId];

                    if (!tag) {
                      return null;
                    }

                    return (
                      <span key={tag.id} className="events-tag-pill" style={{ borderColor: tag.color, color: tag.color }}>
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
              <span>Time</span>
              <strong>{formatTimeRange(item.startTime, item.endTime)}</strong>
            </p>
            <p className="event-series-meta">
              <span>Location</span>
              <strong>{item.location || "-"}</strong>
            </p>
            <p className="event-series-meta">
              <span>Next</span>
              <strong>{formatDate(item.nextOccurrence)}</strong>
            </p>
          </article>
        ))}
      </div>

      <p className="events-count">Showing {filteredSeries.length} event series</p>

      {filtersOpen ? (
        <div className="members-drawer-backdrop" onClick={() => setFiltersOpen(false)} role="presentation">
          <aside className="members-drawer members-filter-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>Series Filters</h3>
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
                  placeholder="Title, location, recurrence, tags"
                />
              </label>

              <label>
                Status
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="all">All</option>
                  {filterOptions.statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Recurrence Type
                <select
                  value={filters.recurrenceType}
                  onChange={(event) => setFilters((current) => ({ ...current, recurrenceType: event.target.value }))}
                >
                  <option value="all">All</option>
                  {filterOptions.recurrenceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
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
                  {tags.map((tag) => {
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

      {createOpen ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={() => setCreateOpen(false)} role="presentation">
          <aside className="events-modal-card events-modal-card-wide" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>Create Event Series</h3>
              <button type="button" className="members-text-button" onClick={() => setCreateOpen(false)}>
                Close
              </button>
            </div>

            <form className="members-add-form" onSubmit={handleCreate}>
              <label>
                Title
                <input
                  value={createForm.title}
                  onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </label>

              <label>
                Attendance Type
                <select
                  value={createForm.attendanceType}
                  onChange={(event) => setCreateForm((current) => ({ ...current, attendanceType: event.target.value }))}
                >
                  <option value="general">general</option>
                  <option value="individual">individual</option>
                </select>
              </label>

              <label>
                Recurrence Type
                <select
                  value={createForm.recurrenceType}
                  onChange={(event) => setCreateForm((current) => ({ ...current, recurrenceType: event.target.value }))}
                >
                  <option value="none">none</option>
                  <option value="daily">daily</option>
                  <option value="weekly">weekly</option>
                  <option value="monthly">monthly</option>
                  <option value="yearly">yearly</option>
                </select>
              </label>

              {createForm.recurrenceType !== "none" ? (
                <label>
                  Recurrence Rule
                  <input
                    value={createForm.recurrenceRule}
                    onChange={(event) => setCreateForm((current) => ({ ...current, recurrenceRule: event.target.value }))}
                    placeholder="e.g. Weekly on Sunday"
                  />
                </label>
              ) : null}

              <label>
                Start Time
                <input
                  type="time"
                  value={createForm.startTime}
                  onChange={(event) => setCreateForm((current) => ({ ...current, startTime: event.target.value }))}
                />
              </label>

              <label>
                End Time
                <input
                  type="time"
                  value={createForm.endTime}
                  onChange={(event) => setCreateForm((current) => ({ ...current, endTime: event.target.value }))}
                />
              </label>

              <label>
                Location
                <input
                  value={createForm.location}
                  onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))}
                />
              </label>

              {createForm.recurrenceType === "none" ? (
                <label>
                  Date (for one-time instance)
                  <input
                    type="date"
                    value={createForm.nextOccurrence}
                    onChange={(event) => setCreateForm((current) => ({ ...current, nextOccurrence: event.target.value }))}
                  />
                </label>
              ) : (
                <fieldset style={{ border: "1px solid var(--color-border)", borderRadius: "6px", padding: "12px" }}>
                  <legend style={{ fontWeight: 600, padding: "0 6px" }}>Generate instances (optional)</legend>
                  <p style={{ marginTop: 0, fontSize: "0.85rem", color: "var(--color-text-muted, #888)" }}>
                    Automatically create instances for this recurring series between two dates.
                  </p>
                  <label>
                    From date
                    <input
                      type="date"
                      value={createForm.generateFromDate}
                      onChange={(event) => setCreateForm((current) => ({ ...current, generateFromDate: event.target.value }))}
                    />
                  </label>
                  <label style={{ marginTop: "8px" }}>
                    To date
                    <input
                      type="date"
                      value={createForm.generateToDate}
                      onChange={(event) => setCreateForm((current) => ({ ...current, generateToDate: event.target.value }))}
                    />
                  </label>
                </fieldset>
              )}

              <fieldset className="events-tag-picker">
                <legend>Tags</legend>
                <p>Select the tags that should apply to this series.</p>
                <div className="events-tag-picker-list">
                  {tags.map((tag) => {
                    const selected = createForm.tagIds.includes(tag.id);

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`events-tag-picker-item ${selected ? "events-tag-picker-item-selected" : ""}`}
                        onClick={() => toggleSeriesTag(tag.id)}
                        style={{ borderColor: tag.color }}
                      >
                        <span className="events-tag-picker-dot" style={{ background: tag.color }} />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label>
                Status
                <select
                  value={createForm.status}
                  onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="cancelled">cancelled</option>
                  <option value="completed">completed</option>
                </select>
              </label>

              <button type="submit" className="members-primary-button" disabled={saving}>
                Save Series
              </button>
            </form>
          </aside>
        </div>
      ) : null}

      {selectedSeries ? (
        <div
          className="members-drawer-backdrop events-modal-backdrop"
          onClick={() => {
            setSelectedSeriesId(null);
            setEditForm(null);
          }}
          role="presentation"
        >
          <aside className="events-modal-card events-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>{selectedSeries.title}</h3>
              <button
                type="button"
                className="members-text-button"
                onClick={() => {
                  setSelectedSeriesId(null);
                  setEditForm(null);
                }}
              >
                Close
              </button>
            </div>

            {editForm ? (
              <form className="members-add-form" onSubmit={handleSaveSeries}>
                <label>
                  Title
                  <input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} required />
                </label>
                <label>
                  Attendance Type
                  <select
                    value={editForm.attendanceType}
                    onChange={(event) => setEditForm((current) => ({ ...current, attendanceType: event.target.value }))}
                  >
                    <option value="general">general</option>
                    <option value="individual">individual</option>
                  </select>
                </label>
                <label>
                  Recurrence Type
                  <select
                    value={editForm.recurrenceType}
                    onChange={(event) => setEditForm((current) => ({ ...current, recurrenceType: event.target.value }))}
                  >
                    <option value="none">none</option>
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                    <option value="yearly">yearly</option>
                  </select>
                </label>
                {editForm.recurrenceType !== "none" ? (
                  <label>
                    Recurrence Rule
                    <input
                      value={editForm.recurrenceRule}
                      onChange={(event) => setEditForm((current) => ({ ...current, recurrenceRule: event.target.value }))}
                      placeholder="e.g. Weekly on Sunday"
                    />
                  </label>
                ) : null}
                <label>
                  Start Time
                  <input
                    type="time"
                    value={editForm.startTime}
                    onChange={(event) => setEditForm((current) => ({ ...current, startTime: event.target.value }))}
                  />
                </label>
                <label>
                  End Time
                  <input
                    type="time"
                    value={editForm.endTime}
                    onChange={(event) => setEditForm((current) => ({ ...current, endTime: event.target.value }))}
                  />
                </label>
                <label>
                  Location
                  <input value={editForm.location} onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))} />
                </label>
                <fieldset className="events-tag-picker">
                  <legend>Tags</legend>
                  <div className="events-tag-picker-list">
                    {tags.map((tag) => {
                      const selected = editForm.tagIds.includes(tag.id);

                      return (
                        <button
                          key={`edit-${tag.id}`}
                          type="button"
                          className={`events-tag-picker-item ${selected ? "events-tag-picker-item-selected" : ""}`}
                          onClick={() => handleToggleEditTag(tag.id)}
                          style={{ borderColor: tag.color }}
                        >
                          <span className="events-tag-picker-dot" style={{ background: tag.color }} />
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <label>
                  Status
                  <select value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))}>
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="cancelled">cancelled</option>
                    <option value="completed">completed</option>
                  </select>
                </label>
                <button type="submit" className="members-primary-button" disabled={saving}>
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="events-detail-grid" role="list" aria-label="Selected event series details">
                <p className="events-detail-item" role="listitem">
                  <span>ID</span>
                  <strong>{selectedSeries.id}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Status</span>
                  <strong>{selectedSeries.status}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Recurrence Type</span>
                  <strong>{selectedSeries.recurrenceType}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Attendance Type</span>
                  <strong>{selectedSeries.attendanceType}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Recurrence Rule</span>
                  <strong>{selectedSeries.recurrenceRule || "One-time event"}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Time</span>
                  <strong>{formatTimeRange(selectedSeries.startTime, selectedSeries.endTime)}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Location</span>
                  <strong>{selectedSeries.location || "-"}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Next Occurrence</span>
                  <strong>{formatDate(selectedSeries.nextOccurrence)}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Instances</span>
                  <strong>{selectedSeries.instanceCount}</strong>
                </p>
                <div className="events-detail-item" role="listitem">
                  <span>Tags</span>
                  <div className="event-series-tag-list">
                    {selectedSeries.tagIds.length ? (
                      selectedSeries.tagIds.map((tagId) => {
                        const tag = tagsById[tagId];
                        if (!tag) {
                          return null;
                        }

                        return (
                          <span
                            key={`detail-${selectedSeries.id}-${tag.id}`}
                            className="events-tag-pill"
                            style={{ borderColor: tag.color, color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        );
                      })
                    ) : (
                      <strong>No tags</strong>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="detail-modal-actions">
              {editForm ? (
                <button type="button" className="members-secondary-button" onClick={() => setEditForm(null)}>
                  Cancel Edit
                </button>
              ) : (
                <button type="button" className="members-secondary-button" onClick={() => setEditForm(seriesToForm(selectedSeries))}>
                  Edit Series
                </button>
              )}
              <button type="button" className="events-tag-remove-button" onClick={handleRemoveSelectedSeries} disabled={saving}>
                Remove Series
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {tagsOpen ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={() => setTagsOpen(false)} role="presentation">
          <aside className="events-modal-card events-modal-card-tags" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>Manage Tags</h3>
              <button type="button" className="members-text-button" onClick={() => setTagsOpen(false)}>
                Close
              </button>
            </div>

            <div className="events-tag-panel">
              <div className="events-tag-panel-head">
                <div>
                  <h3>Create Tags</h3>
                </div>

                <p className="events-tag-count">{tags.length} available</p>
              </div>

              <form className="events-tag-form" onSubmit={handleCreateTag}>
                <label>
                  Tag Name
                  <input
                    value={tagForm.name}
                    onChange={(event) => setTagForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="e.g. volunteer"
                  />
                </label>

                <label>
                  Color
                  <input
                    type="color"
                    value={tagForm.color}
                    onChange={(event) => setTagForm((current) => ({ ...current, color: event.target.value }))}
                  />
                </label>

                <button type="submit" className="members-secondary-button" disabled={saving}>
                  Add Tag
                </button>
              </form>

              <div className="events-tag-library" aria-label="Tag library">
                {tags.map((tag) => (
                  <span key={tag.id} className="events-tag-pill" style={{ borderColor: tag.color, color: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>

              <div className="events-tag-remove-section">
                <h4>Remove Tags</h4>
                <div className="events-tag-remove-list">
                  {tags.map((tag) => (
                    <div key={`remove-${tag.id}`} className="events-tag-remove-row">
                      <span className="events-tag-pill" style={{ borderColor: tag.color, color: tag.color }}>
                        {tag.name}
                      </span>
                      <button type="button" className="events-tag-remove-button" onClick={() => handleRemoveTag(tag.id)} disabled={saving}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}