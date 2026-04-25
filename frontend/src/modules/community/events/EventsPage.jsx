import { useMemo, useState } from "react";

const MOCK_EVENT_TAGS = [
  { id: 1, name: "church", color: "#4f86d9" },
  { id: 2, name: "youth", color: "#7c5cff" },
  { id: 3, name: "prayer", color: "#2f9e7a" },
  { id: 4, name: "outreach", color: "#e08a2e" },
];

const MOCK_MEMBERS = [
  { id: 1, name: "Daniel Gomez", family: "Gomez Family" },
  { id: 2, name: "Mariana Lopez", family: "Lopez Family" },
  { id: 3, name: "Samuel Ortiz", family: "Ortiz Family" },
  { id: 4, name: "Elena Vega", family: "Vega Family" },
  { id: 5, name: "Camila Rivera", family: "Rivera Family" },
  { id: 6, name: "Jorge Mendez", family: "Mendez Family" },
];

const MOCK_EVENT_SERIES = [
  {
    id: 1,
    title: "Sunday Service",
    attendanceType: "individual",
    recurrenceType: "weekly",
    recurrenceRule: "Weekly on Sunday",
    time: "10:00 - 11:45",
    location: "Main Auditorium",
    status: "active",
    category: "service",
    nextOccurrence: "2026-04-26",
    tagIds: [1],
    registeredMemberIds: [1, 2, 4],
  },
  {
    id: 2,
    title: "Youth Bible Study",
    attendanceType: "individual",
    recurrenceType: "weekly",
    recurrenceRule: "Weekly on Friday",
    time: "19:00 - 20:30",
    location: "Room B-12",
    status: "active",
    category: "study",
    nextOccurrence: "2026-04-24",
    tagIds: [1, 2],
    registeredMemberIds: [1, 3, 5],
  },
  {
    id: 3,
    title: "Leaders Prayer",
    attendanceType: "general",
    recurrenceType: "weekly",
    recurrenceRule: "Biweekly on Wednesday",
    time: "06:30 - 07:15",
    location: "Prayer Hall",
    status: "paused",
    category: "prayer",
    nextOccurrence: "2026-04-29",
    tagIds: [3],
    registeredMemberIds: [2, 4],
  },
  {
    id: 4,
    title: "Community Outreach",
    attendanceType: "general",
    recurrenceType: "monthly",
    recurrenceRule: "Monthly on 2nd Saturday",
    time: "09:00 - 12:00",
    location: "City Center",
    status: "active",
    category: "outreach",
    nextOccurrence: "2026-05-09",
    tagIds: [4],
    registeredMemberIds: [1, 2, 3, 4],
  },
  {
    id: 5,
    title: "New Members Welcome",
    attendanceType: "general",
    recurrenceType: "none",
    recurrenceRule: "One-time event",
    time: "18:00 - 19:00",
    location: "Lobby",
    status: "draft",
    category: "service",
    nextOccurrence: "2026-05-12",
    tagIds: [1],
    registeredMemberIds: [5, 6],
  },
];

const DEFAULT_FILTERS = {
  search: "",
  status: "all",
  recurrenceType: "all",
};

const CREATE_INITIAL = {
  title: "",
  attendanceType: "general",
  recurrenceType: "weekly",
  recurrenceRule: "",
  time: "",
  location: "",
  status: "active",
  nextOccurrence: "",
  tagIds: [],
};

const TAG_INITIAL = {
  name: "",
  color: "#4f86d9",
};

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

export default function EventsPage() {
  const [series, setSeries] = useState(MOCK_EVENT_SERIES);
  const [tags, setTags] = useState(MOCK_EVENT_TAGS);
  const [selectedSeriesId, setSelectedSeriesId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [createForm, setCreateForm] = useState(CREATE_INITIAL);
  const [tagForm, setTagForm] = useState(TAG_INITIAL);

  const tagsById = useMemo(() => Object.fromEntries(tags.map((tag) => [tag.id, tag])), [tags]);

  const selectedSeries = useMemo(
    () => series.find((item) => item.id === selectedSeriesId) ?? null,
    [series, selectedSeriesId]
  );

  const selectedSeriesRegisteredMemberIds = selectedSeries?.registeredMemberIds ?? [];

  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();

    return MOCK_MEMBERS.filter((member) => {
      const searchable = `${member.name} ${member.family}`.toLowerCase();
      return !search || searchable.includes(search);
    });
  }, [memberSearch]);

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
        item.location.toLowerCase().includes(search) ||
        item.recurrenceRule.toLowerCase().includes(search) ||
        item.recurrenceType.toLowerCase().includes(search) ||
        tagNames.includes(search);
      const matchesStatus = filters.status === "all" || item.status === filters.status;
      const matchesRecurrenceType =
        filters.recurrenceType === "all" || item.recurrenceType === filters.recurrenceType;

      return matchesSearch && matchesStatus && matchesRecurrenceType;
    });
  }, [filters, series, tagsById]);

  const handleCreate = (event) => {
    event.preventDefault();

    const newSeries = {
      id: Math.floor(1000 + Math.random() * 9000),
      ...createForm,
      title: createForm.title.trim(),
      location: createForm.location.trim(),
      time: createForm.time.trim(),
      recurrenceRule: createForm.recurrenceRule.trim(),
      nextOccurrence: createForm.recurrenceType === "none" ? createForm.nextOccurrence : "",
      registeredMemberIds: [],
    };

    setSeries((current) => [newSeries, ...current]);
    setCreateForm(CREATE_INITIAL);
    setCreateOpen(false);
  };

  const handleCreateTag = (event) => {
    event.preventDefault();

    const name = tagForm.name.trim().toLowerCase();
    if (!name) {
      return;
    }

    const newTag = {
      id: Math.floor(1000 + Math.random() * 9000),
      name,
      color: tagForm.color || "#4f86d9",
    };

    setTags((current) => [newTag, ...current]);
    setTagForm(TAG_INITIAL);
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

  const handleRemoveTag = (tagId) => {
    const tagToRemove = tagsById[tagId];
    const confirmed = window.confirm(
      `Remove tag "${tagToRemove?.name ?? "this tag"}"? This will also remove it from all series.`
    );

    if (!confirmed) {
      return;
    }

    setTags((current) => current.filter((tag) => tag.id !== tagId));
    setSeries((current) =>
      current.map((item) => ({
        ...item,
        tagIds: item.tagIds.filter((value) => value !== tagId),
      }))
    );
    setCreateForm((current) => ({
      ...current,
      tagIds: current.tagIds.filter((value) => value !== tagId),
    }));
  };

  const handleRemoveSelectedSeries = () => {
    if (!selectedSeries) {
      return;
    }

    const confirmed = window.confirm(`Remove event series "${selectedSeries.title}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setSeries((current) => current.filter((item) => item.id !== selectedSeries.id));
    setSelectedSeriesId(null);
    setMemberSearch("");
  };

  const handleToggleMemberRegistration = (memberId) => {
    if (!selectedSeries) {
      return;
    }

    setSeries((current) =>
      current.map((item) => {
        if (item.id !== selectedSeries.id) {
          return item;
        }

        const registeredMemberIds = item.registeredMemberIds ?? [];
        const isRegistered = registeredMemberIds.includes(memberId);

        return {
          ...item,
          registeredMemberIds: isRegistered
            ? registeredMemberIds.filter((value) => value !== memberId)
            : [...registeredMemberIds, memberId],
        };
      })
    );
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

      <div className="events-series-list" role="list" aria-label="Event series list">
        {filteredSeries.map((item) => (
          <article
            key={item.id}
            className="event-series-row"
            role="listitem"
            tabIndex={0}
            onClick={() => {
              setSelectedSeriesId(item.id);
              setMemberSearch("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedSeriesId(item.id);
                setMemberSearch("");
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
              <strong>{item.time || "-"}</strong>
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
              <button type="button" className="members-text-button" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear
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
                Time
                <input
                  value={createForm.time}
                  onChange={(event) => setCreateForm((current) => ({ ...current, time: event.target.value }))}
                  placeholder="e.g. 10:00 - 11:45"
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
                  Next Occurrence
                  <input
                    type="date"
                    value={createForm.nextOccurrence}
                    onChange={(event) => setCreateForm((current) => ({ ...current, nextOccurrence: event.target.value }))}
                  />
                </label>
              ) : null}

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

              <button type="submit" className="members-primary-button">
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
            setMemberSearch("");
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
                  setMemberSearch("");
                }}
              >
                Close
              </button>
            </div>

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
                <strong>{selectedSeries.time || "-"}</strong>
              </p>
              <p className="events-detail-item" role="listitem">
                <span>Location</span>
                <strong>{selectedSeries.location || "-"}</strong>
              </p>
              <p className="events-detail-item" role="listitem">
                <span>Next Occurrence</span>
                <strong>{formatDate(selectedSeries.nextOccurrence)}</strong>
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
                        <span key={`detail-${selectedSeries.id}-${tag.id}`} className="events-tag-pill" style={{ borderColor: tag.color, color: tag.color }}>
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

            {selectedSeries.attendanceType === "individual" ? (
              <div className="events-register-panel">
                <div className="events-register-panel-head">
                  <div>
                    <h3>Register Members</h3>
                  </div>

                  <p className="events-register-count">{selectedSeriesRegisteredMemberIds.length} registered</p>
                </div>

                <label className="events-register-search">
                  Search members
                  <input
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                    placeholder="Name or family"
                  />
                </label>

                <div className="events-register-list" role="list" aria-label="Member registration list">
                  {filteredMembers.length ? (
                    filteredMembers.map((member) => {
                      const isRegistered = selectedSeriesRegisteredMemberIds.includes(member.id);

                      return (
                        <div key={member.id} className="events-register-row" role="listitem">
                          <div className="events-register-row-main">
                            <strong>{member.name}</strong>
                            <span>{member.family}</span>
                          </div>

                          <div className="events-register-row-actions">
                            <span className={`events-register-pill ${isRegistered ? "events-register-pill-active" : ""}`}>
                              {isRegistered ? "Registered" : "Not registered"}
                            </span>
                            <button
                              type="button"
                              className={isRegistered ? "events-tag-remove-button" : "members-secondary-button"}
                              onClick={() => handleToggleMemberRegistration(member.id)}
                            >
                              {isRegistered ? "Unregister" : "Register"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="events-register-empty">No members match your search.</p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="detail-modal-actions">
              <button type="button" className="events-tag-remove-button" onClick={handleRemoveSelectedSeries}>
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

                <button type="submit" className="members-secondary-button">
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
                      <button type="button" className="events-tag-remove-button" onClick={() => handleRemoveTag(tag.id)}>
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