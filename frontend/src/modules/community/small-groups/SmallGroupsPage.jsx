import { useMemo, useState } from "react";

const MOCK_GROUP_TAGS = [
  { id: 1, name: "youth", color: "#7c5cff" },
  { id: 2, name: "families", color: "#2f9e7a" },
  { id: 3, name: "discipleship", color: "#4f86d9" },
  { id: 4, name: "prayer", color: "#e08a2e" },
];

const MOCK_SMALL_GROUPS = [
  {
    id: 1,
    name: "Northside Young Adults",
    location: "Room B-2",
    meetingDay: "Friday",
    meetingTime: "7:00 PM - 8:30 PM",
    tagIds: [1, 3],
    status: "active",
  },
  {
    id: 2,
    name: "City Families Circle",
    location: "Main Campus - Family Hall",
    meetingDay: "Sunday",
    meetingTime: "5:30 PM - 7:00 PM",
    tagIds: [2, 4],
    status: "active",
  },
  {
    id: 3,
    name: "Downtown Discipleship",
    location: "Avenida Central 241",
    meetingDay: "Wednesday",
    meetingTime: "6:30 PM - 8:00 PM",
    tagIds: [3],
    status: "paused",
  },
];

const DEFAULT_FILTERS = {
  search: "",
  meetingDay: "all",
  status: "all",
  tagIds: [],
};

const CREATE_INITIAL = {
  name: "",
  location: "",
  meetingDay: "Monday",
  meetingTime: "",
  status: "active",
  tagIds: [],
};

const TAG_INITIAL = {
  name: "",
  color: "#4f86d9",
};

function createGroupId() {
  return Math.floor(1000 + Math.random() * 9000);
}

export default function SmallGroupsPage() {
  const [groups, setGroups] = useState(MOCK_SMALL_GROUPS);
  const [tags, setTags] = useState(MOCK_GROUP_TAGS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [createForm, setCreateForm] = useState(CREATE_INITIAL);
  const [tagForm, setTagForm] = useState(TAG_INITIAL);

  const tagsById = useMemo(() => Object.fromEntries(tags.map((tag) => [tag.id, tag])), [tags]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  const filterOptions = useMemo(
    () => ({
      meetingDays: [...new Set(groups.map((group) => group.meetingDay))],
      statuses: [...new Set(groups.map((group) => group.status))],
    }),
    [groups]
  );

  const filteredGroups = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return groups.filter((group) => {
      const tagNames = group.tagIds.map((tagId) => tagsById[tagId]?.name ?? "").join(" ").toLowerCase();
      const matchesSearch =
        !search ||
        group.name.toLowerCase().includes(search) ||
        group.location.toLowerCase().includes(search) ||
        group.meetingDay.toLowerCase().includes(search) ||
        group.meetingTime.toLowerCase().includes(search) ||
        tagNames.includes(search);
      const matchesMeetingDay = filters.meetingDay === "all" || group.meetingDay === filters.meetingDay;
      const matchesStatus = filters.status === "all" || group.status === filters.status;
      const matchesTag =
        !filters.tagIds.length || filters.tagIds.every((selectedTagId) => group.tagIds.includes(selectedTagId));

      return matchesSearch && matchesMeetingDay && matchesStatus && matchesTag;
    });
  }, [filters, groups, tagsById]);

  const handleCreateGroup = (event) => {
    event.preventDefault();

    const newGroup = {
      id: createGroupId(),
      ...createForm,
      name: createForm.name.trim(),
      location: createForm.location.trim(),
      meetingTime: createForm.meetingTime.trim(),
    };

    setGroups((current) => [newGroup, ...current]);
    setCreateForm(CREATE_INITIAL);
    setCreateOpen(false);
  };

  const toggleCreateTag = (tagId) => {
    setCreateForm((current) => {
      const isSelected = current.tagIds.includes(tagId);
      return {
        ...current,
        tagIds: isSelected ? current.tagIds.filter((value) => value !== tagId) : [...current.tagIds, tagId],
      };
    });
  };

  const handleRemoveSelectedGroup = () => {
    if (!selectedGroup) {
      return;
    }

    const confirmed = window.confirm(`Remove small group "${selectedGroup.name}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setGroups((current) => current.filter((group) => group.id !== selectedGroup.id));
    setSelectedGroupId(null);
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

  const handleRemoveTag = (tagId) => {
    const tagToRemove = tagsById[tagId];
    const confirmed = window.confirm(
      `Remove small-group tag "${tagToRemove?.name ?? "this tag"}"? This will also remove it from all groups.`
    );

    if (!confirmed) {
      return;
    }

    setTags((current) => current.filter((tag) => tag.id !== tagId));
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        tagIds: group.tagIds.filter((value) => value !== tagId),
      }))
    );
    setCreateForm((current) => ({
      ...current,
      tagIds: current.tagIds.filter((value) => value !== tagId),
    }));
    setFilters((current) => ({
      ...current,
      tagIds: current.tagIds.filter((value) => value !== tagId),
    }));
  };

  return (
    <section className="events-page">
      <header className="events-header">
        <div>
          <p className="events-subtitle">Track community small groups by schedule and location.</p>
        </div>

        <div className="events-actions">
          <button type="button" className="members-secondary-button" onClick={() => setFiltersOpen((value) => !value)}>
            Filters
          </button>
          <button type="button" className="members-secondary-button" onClick={() => setTagsOpen((value) => !value)}>
            Tags
          </button>
          <button type="button" className="members-primary-button" onClick={() => setCreateOpen((value) => !value)}>
            Add Group
          </button>
        </div>
      </header>

      <div className="events-series-list" role="list" aria-label="Small groups list">
        {filteredGroups.length ? (
          filteredGroups.map((group) => (
            <article
              key={group.id}
              className="event-series-row"
              role="listitem button"
              tabIndex={0}
              onClick={() => setSelectedGroupId(group.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedGroupId(group.id);
                }
              }}
              aria-label={`Open details for ${group.name}`}
            >
              <div className="event-series-main">
                <h3>{group.name}</h3>
                <p>{group.location || "No location"}</p>
                <div className="event-series-badges">
                  <span className="event-series-badge event-series-badge-recurrence">{group.meetingDay}</span>
                  <span className={`event-series-badge event-series-status-${group.status}`}>{group.status}</span>
                </div>
              </div>

              <div className="event-series-tags-section">
                <span className="event-series-section-label">Tags</span>
                <div className="event-series-tag-list">
                  {group.tagIds.length ? (
                    group.tagIds.map((tagId) => {
                      const tag = tagsById[tagId];
                      if (!tag) {
                        return null;
                      }

                      return (
                        <span key={`group-${group.id}-${tag.id}`} className="events-tag-pill" style={{ borderColor: tag.color, color: tag.color }}>
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
                <span>Meeting Day</span>
                <strong>{group.meetingDay}</strong>
              </p>
              <p className="event-series-meta">
                <span>Meeting Time</span>
                <strong>{group.meetingTime || "-"}</strong>
              </p>
              <p className="event-series-meta">
                <span>Location</span>
                <strong>{group.location || "-"}</strong>
              </p>
            </article>
          ))
        ) : (
          <p className="events-register-empty">No small groups match your current filters.</p>
        )}
      </div>

      <p className="events-count">Showing {filteredGroups.length} small groups</p>

      {filtersOpen ? (
        <div className="members-drawer-backdrop" onClick={() => setFiltersOpen(false)} role="presentation">
          <aside className="members-drawer members-filter-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>Small Group Filters</h3>
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
                  placeholder="Name, location, day, time, tags"
                />
              </label>

              <label>
                Meeting Day
                <select
                  value={filters.meetingDay}
                  onChange={(event) => setFilters((current) => ({ ...current, meetingDay: event.target.value }))}
                >
                  <option value="all">All</option>
                  {filterOptions.meetingDays.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
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
              <h3>Create Small Group</h3>
              <button type="button" className="members-text-button" onClick={() => setCreateOpen(false)}>
                Close
              </button>
            </div>

            <form className="members-add-form" onSubmit={handleCreateGroup}>
              <label>
                Name
                <input
                  value={createForm.name}
                  onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>

              <label>
                Location
                <input
                  value={createForm.location}
                  onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))}
                  required
                />
              </label>

              <label>
                Meeting Day
                <select
                  value={createForm.meetingDay}
                  onChange={(event) => setCreateForm((current) => ({ ...current, meetingDay: event.target.value }))}
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </label>

              <label>
                Meeting Time
                <input
                  value={createForm.meetingTime}
                  onChange={(event) => setCreateForm((current) => ({ ...current, meetingTime: event.target.value }))}
                  placeholder="e.g. 7:00 PM - 8:30 PM"
                  required
                />
              </label>

              <fieldset className="events-tag-picker">
                <legend>Tags</legend>
                <p>Select all tags that apply to this group.</p>
                <div className="events-tag-picker-list">
                  {tags.map((tag) => {
                    const selected = createForm.tagIds.includes(tag.id);

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`events-tag-picker-item ${selected ? "events-tag-picker-item-selected" : ""}`}
                        onClick={() => toggleCreateTag(tag.id)}
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
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>

              <button type="submit" className="members-primary-button">
                Save Group
              </button>
            </form>
          </aside>
        </div>
      ) : null}

      {selectedGroup ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={() => setSelectedGroupId(null)} role="presentation">
          <aside className="events-modal-card events-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>{selectedGroup.name}</h3>
              <button type="button" className="members-text-button" onClick={() => setSelectedGroupId(null)}>
                Close
              </button>
            </div>

            <div className="events-detail-grid" role="list" aria-label="Selected small group details">
              <p className="events-detail-item" role="listitem">
                <span>ID</span>
                <strong>{selectedGroup.id}</strong>
              </p>
              <p className="events-detail-item" role="listitem">
                <span>Name</span>
                <strong>{selectedGroup.name}</strong>
              </p>
              <p className="events-detail-item" role="listitem">
                <span>Location</span>
                <strong>{selectedGroup.location || "-"}</strong>
              </p>
              <p className="events-detail-item" role="listitem">
                <span>Meeting Day</span>
                <strong>{selectedGroup.meetingDay}</strong>
              </p>
              <p className="events-detail-item" role="listitem">
                <span>Meeting Time</span>
                <strong>{selectedGroup.meetingTime || "-"}</strong>
              </p>
              <div className="events-detail-item" role="listitem">
                <span>Tags</span>
                <div className="event-series-tag-list">
                  {selectedGroup.tagIds.length ? (
                    selectedGroup.tagIds.map((tagId) => {
                      const tag = tagsById[tagId];
                      if (!tag) {
                        return null;
                      }

                      return (
                        <span key={`detail-${selectedGroup.id}-${tag.id}`} className="events-tag-pill" style={{ borderColor: tag.color, color: tag.color }}>
                          {tag.name}
                        </span>
                      );
                    })
                  ) : (
                    <strong>No tags</strong>
                  )}
                </div>
              </div>
              <p className="events-detail-item" role="listitem">
                <span>Status</span>
                <strong>{selectedGroup.status}</strong>
              </p>
            </div>

            <div className="detail-modal-actions">
              <button type="button" className="events-tag-remove-button" onClick={handleRemoveSelectedGroup}>
                Remove Group
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {tagsOpen ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={() => setTagsOpen(false)} role="presentation">
          <aside className="events-modal-card events-modal-card-tags" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>Manage Small Group Tags</h3>
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
                    placeholder="e.g. campus-west"
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

              <div className="events-tag-library" aria-label="Small group tag library">
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
