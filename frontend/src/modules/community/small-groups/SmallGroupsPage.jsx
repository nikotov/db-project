import { useEffect, useMemo, useState } from "react";

import {
  createGroupMembership,
  createSmallGroup,
  createSmallGroupTag,
  deleteGroupMembership,
  deleteSmallGroup,
  deleteSmallGroupTag,
  fetchFamilies,
  fetchGroupMemberships,
  fetchMembers,
  fetchSmallGroupTags,
  fetchSmallGroups,
  getStoredAccessToken,
  updateSmallGroup,
} from "../../../api/client";

const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const STATUS_OPTIONS = ["active", "paused"];
const ROLE_OPTIONS = ["member", "leader", "unknown"];

const DEFAULT_FILTERS = {
  search: "",
  meetingDay: "all",
  status: "all",
  tagIds: [],
};

const GROUP_FORM_INITIAL = {
  name: "",
  description: "",
  meetingDay: "Monday",
  meetingTime: "",
  location: "",
  status: "active",
  tagIds: [],
};

const TAG_FORM_INITIAL = {
  name: "",
  color: "#4f86d9",
};

function normalizeTimeValue(value) {
  if (!value) {
    return "";
  }

  return value.length >= 5 ? value.slice(0, 5) : value;
}

function formatMemberName(member) {
  if (!member) {
    return "Unknown member";
  }

  return [member.name, member.last_name_parental, member.last_name_maternal].filter(Boolean).join(" ");
}

function formatFamilyName(member, familiesById) {
  return familiesById[member.family_id]?.name ?? "No family";
}

function groupToForm(group) {
  if (!group) {
    return GROUP_FORM_INITIAL;
  }

  return {
    name: group.name ?? "",
    description: group.description ?? "",
    meetingDay: group.meetingDay ?? "Monday",
    meetingTime: normalizeTimeValue(group.meetingTime ?? ""),
    location: group.location ?? "",
    status: group.status ?? "active",
    tagIds: (group.tags ?? []).map((tag) => tag.id),
  };
}

function groupPayloadFromForm(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    meeting_day: form.meetingDay,
    meeting_time: form.meetingTime,
    location: form.location.trim() || null,
    status: form.status,
    tag_ids: form.tagIds,
  };
}

export default function SmallGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [members, setMembers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [createForm, setCreateForm] = useState(GROUP_FORM_INITIAL);
  const [editForm, setEditForm] = useState(null);
  const [tagForm, setTagForm] = useState(TAG_FORM_INITIAL);
  const [memberRoleDrafts, setMemberRoleDrafts] = useState({});

  const token = getStoredAccessToken();

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  const familiesById = useMemo(() => Object.fromEntries(families.map((family) => [family.id, family])), [families]);
  const tagsById = useMemo(() => Object.fromEntries(tags.map((tag) => [tag.id, tag])), [tags]);

  const selectedGroupMemberships = useMemo(
    () => memberships.filter((membership) => membership.small_group_id === selectedGroupId),
    [memberships, selectedGroupId]
  );

  const filteredGroups = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return groups.filter((group) => {
      const tagNames = (group.tags ?? []).map((tag) => tag.name).join(" ").toLowerCase();
      const matchesSearch =
        !search ||
        group.name.toLowerCase().includes(search) ||
        (group.description ?? "").toLowerCase().includes(search) ||
        (group.location ?? "").toLowerCase().includes(search) ||
        group.meetingDay.toLowerCase().includes(search) ||
        normalizeTimeValue(group.meetingTime).toLowerCase().includes(search) ||
        tagNames.includes(search);
      const matchesMeetingDay = filters.meetingDay === "all" || group.meetingDay === filters.meetingDay;
      const matchesStatus = filters.status === "all" || group.status === filters.status;
      const groupTagIds = (group.tags ?? []).map((tag) => tag.id);
      const matchesTag = !filters.tagIds.length || filters.tagIds.every((tagId) => groupTagIds.includes(tagId));

      return matchesSearch && matchesMeetingDay && matchesStatus && matchesTag;
    });
  }, [filters, groups]);

  const filterOptions = useMemo(
    () => ({
      meetingDays: [...new Set(groups.map((group) => group.meetingDay))],
      statuses: [...new Set(groups.map((group) => group.status))],
    }),
    [groups]
  );

  const memberRows = useMemo(
    () =>
      members.map((member) => {
        const membership = selectedGroupMemberships.find((item) => item.member_id === member.id) ?? null;
        return {
          member,
          membership,
          role: memberRoleDrafts[member.id] ?? membership?.role ?? "member",
        };
      }),
    [memberRoleDrafts, members, selectedGroupMemberships]
  );

  useEffect(() => {
    const load = async () => {
      if (!token) {
        return;
      }

      try {
        const [groupsPayload, tagsPayload, membersPayload, familiesPayload, membershipsPayload] = await Promise.all([
          fetchSmallGroups(token),
          fetchSmallGroupTags(token),
          fetchMembers(token),
          fetchFamilies(token),
          fetchGroupMemberships(token),
        ]);

        setGroups(groupsPayload ?? []);
        setTags(tagsPayload ?? []);
        setMembers(membersPayload ?? []);
        setFamilies(familiesPayload ?? []);
        setMemberships(membershipsPayload ?? []);
      } catch {
        setGroups([]);
        setTags([]);
        setMembers([]);
        setFamilies([]);
        setMemberships([]);
      }
    };

    load();
  }, [token]);

  useEffect(() => {
    if (!selectedGroup) {
      setEditForm(null);
      setMemberRoleDrafts({});
      return;
    }

    setEditForm(null);
    const drafts = {};
    selectedGroupMemberships.forEach((membership) => {
      drafts[membership.member_id] = membership.role;
    });
    setMemberRoleDrafts(drafts);
  }, [selectedGroupId, selectedGroupMemberships]);

  const refreshMemberships = async () => {
    if (!token) {
      return;
    }

    const payload = await fetchGroupMemberships(token);
    setMemberships(payload ?? []);
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      const created = await createSmallGroup(token, groupPayloadFromForm(createForm));
      setGroups((current) => [created, ...current]);
      setCreateForm(GROUP_FORM_INITIAL);
      setCreateOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create small group");
    }
  };

  const handleSaveGroup = async (event) => {
    event.preventDefault();
    if (!token || !selectedGroup || !editForm) {
      return;
    }

    try {
      const updated = await updateSmallGroup(token, selectedGroup.id, groupPayloadFromForm(editForm));
      setGroups((current) => current.map((group) => (group.id === selectedGroup.id ? updated : group)));
      setEditForm(groupToForm(updated));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update small group");
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup || !token) {
      return;
    }

    const confirmed = window.confirm(`Remove small group "${selectedGroup.name}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteSmallGroup(token, selectedGroup.id);
      setGroups((current) => current.filter((group) => group.id !== selectedGroup.id));
      setMemberships((current) => current.filter((membership) => membership.small_group_id !== selectedGroup.id));
      setSelectedGroupId(null);
      setEditForm(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete small group");
    }
  };

  const handleCreateTag = async (event) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    const name = tagForm.name.trim().toLowerCase();
    if (!name) {
      return;
    }

    try {
      const created = await createSmallGroupTag(token, { name, color: tagForm.color || null });
      setTags((current) => [created, ...current]);
      setTagForm(TAG_FORM_INITIAL);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create tag");
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!token) {
      return;
    }

    const tagToRemove = tagsById[tagId];
    const confirmed = window.confirm(`Remove tag "${tagToRemove?.name ?? "this tag"}" from small groups?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteSmallGroupTag(token, tagId);
      setTags((current) => current.filter((tag) => tag.id !== tagId));
      setGroups((current) =>
        current.map((group) => ({
          ...group,
          tags: (group.tags ?? []).filter((tag) => tag.id !== tagId),
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
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete tag");
    }
  };

  const handleSaveMembership = async (memberId) => {
    if (!selectedGroup || !token) {
      return;
    }

    const existing = selectedGroupMemberships.find((membership) => membership.member_id === memberId) ?? null;
    const role = memberRoleDrafts[memberId] ?? existing?.role ?? "member";

    try {
      if (existing && existing.role === role) {
        return;
      }

      if (existing) {
        await deleteGroupMembership(token, existing.id);
      }

      await createGroupMembership(token, {
        member_id: memberId,
        small_group_id: selectedGroup.id,
        role,
      });

      await refreshMemberships();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update membership");
    }
  };

  const handleDeleteMembership = async (membershipId) => {
    if (!token) {
      return;
    }

    try {
      await deleteGroupMembership(token, membershipId);
      await refreshMemberships();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete membership");
    }
  };

  return (
    <section className="events-page">
      <header className="events-header">
        <div>
          <p className="events-subtitle">Track community small groups by schedule, tags, and membership.</p>
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
              onClick={() => {
                setSelectedGroupId(group.id);
                setEditForm(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedGroupId(group.id);
                  setEditForm(null);
                }
              }}
              aria-label={`Open details for ${group.name}`}
            >
              <div className="event-series-main">
                <h3>{group.name}</h3>
                <p>{group.description || group.location || "No description"}</p>
                <div className="event-series-badges">
                  <span className="event-series-badge event-series-badge-recurrence">{group.meetingDay}</span>
                  <span className={`event-series-badge event-series-status-${group.status}`}>{group.status}</span>
                </div>
              </div>

              <div className="event-series-tags-section">
                <span className="event-series-section-label">Tags</span>
                <div className="event-series-tag-list">
                  {(group.tags ?? []).length ? (
                    group.tags.map((tag) => (
                      <span
                        key={`group-${group.id}-${tag.id}`}
                        className="events-tag-pill"
                        style={{ borderColor: tag.color ?? "#4f86d9", color: tag.color ?? "#4f86d9" }}
                      >
                        {tag.name}
                      </span>
                    ))
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
                <strong>{normalizeTimeValue(group.meetingTime) || "-"}</strong>
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
                  placeholder="Name, description, day, time, tags"
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
                        style={{ borderColor: tag.color ?? "#4f86d9" }}
                      >
                        <span className="events-tag-picker-dot" style={{ background: tag.color ?? "#4f86d9" }} />
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
          <aside className="events-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>Add Small Group</h3>
              <button type="button" className="members-text-button" onClick={() => setCreateOpen(false)}>
                Close
              </button>
            </div>

            <form className="members-form" onSubmit={handleCreateGroup}>
              <label>
                Name
                <input
                  value={createForm.name}
                  onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                Description
                <input
                  value={createForm.description}
                  onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <label>
                Location
                <input
                  value={createForm.location}
                  onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))}
                />
              </label>
              <label>
                Meeting Day
                <select
                  value={createForm.meetingDay}
                  onChange={(event) => setCreateForm((current) => ({ ...current, meetingDay: event.target.value }))}
                >
                  {DAY_OPTIONS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Meeting Time
                <input
                  type="time"
                  value={createForm.meetingTime}
                  onChange={(event) => setCreateForm((current) => ({ ...current, meetingTime: event.target.value }))}
                  required
                />
              </label>
              <label>
                Status
                <select
                  value={createForm.status}
                  onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.value }))}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="events-tag-picker">
                <legend>Tags</legend>
                <div className="events-tag-picker-list">
                  {tags.map((tag) => {
                    const selected = createForm.tagIds.includes(tag.id);

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`events-tag-picker-item ${selected ? "events-tag-picker-item-selected" : ""}`}
                        onClick={() =>
                          setCreateForm((current) => {
                            const isSelected = current.tagIds.includes(tag.id);
                            return {
                              ...current,
                              tagIds: isSelected
                                ? current.tagIds.filter((value) => value !== tag.id)
                                : [...current.tagIds, tag.id],
                            };
                          })
                        }
                        style={{ borderColor: tag.color ?? "#4f86d9" }}
                      >
                        <span className="events-tag-picker-dot" style={{ background: tag.color ?? "#4f86d9" }} />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <button type="submit" className="members-primary-button">
                Save Group
              </button>
            </form>
          </aside>
        </div>
      ) : null}

      {tagsOpen ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={() => setTagsOpen(false)} role="presentation">
          <aside className="events-modal-card events-modal-card-tags" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>Small Group Tags</h3>
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

              <form className="event-tag-form" onSubmit={handleCreateTag}>
                <label>
                  Tag Name
                  <input
                    value={tagForm.name}
                    onChange={(event) => setTagForm((current) => ({ ...current, name: event.target.value }))}
                    required
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
                <button type="submit" className="members-primary-button">
                  Add Tag
                </button>
              </form>

              <div className="events-tag-picker-list" style={{ marginTop: 16 }}>
                {tags.map((tag) => (
                  <span key={tag.id} className="events-tag-pill" style={{ borderColor: tag.color ?? "#4f86d9", color: tag.color ?? "#4f86d9" }}>
                    {tag.name}
                    <button type="button" className="events-tag-remove-button" onClick={() => handleDeleteTag(tag.id)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {selectedGroup ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={() => setSelectedGroupId(null)} role="presentation">
          <aside className="events-modal-card events-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>{selectedGroup.name}</h3>
              <div className="members-panel-actions">
                <button type="button" className="members-text-button" onClick={() => setSelectedGroupId(null)}>
                  Close
                </button>
              </div>
            </div>

            {editForm ? (
              <form className="members-add-form" onSubmit={handleSaveGroup}>
                <label>
                  Name
                  <input
                    value={editForm.name}
                    onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Description
                  <input
                    value={editForm.description}
                    onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>
                <label>
                  Location
                  <input
                    value={editForm.location}
                    onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))}
                  />
                </label>
                <label>
                  Meeting Day
                  <select
                    value={editForm.meetingDay}
                    onChange={(event) => setEditForm((current) => ({ ...current, meetingDay: event.target.value }))}
                  >
                    {DAY_OPTIONS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Meeting Time
                  <input
                    type="time"
                    value={editForm.meetingTime}
                    onChange={(event) => setEditForm((current) => ({ ...current, meetingTime: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Status
                  <select
                    value={editForm.status}
                    onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <fieldset className="events-tag-picker">
                  <legend>Tags</legend>
                  <div className="events-tag-picker-list">
                    {tags.map((tag) => {
                      const selected = editForm.tagIds.includes(tag.id);

                      return (
                        <button
                          key={tag.id}
                          type="button"
                          className={`events-tag-picker-item ${selected ? "events-tag-picker-item-selected" : ""}`}
                          onClick={() =>
                            setEditForm((current) => {
                              const isSelected = current.tagIds.includes(tag.id);
                              return {
                                ...current,
                                tagIds: isSelected
                                  ? current.tagIds.filter((value) => value !== tag.id)
                                  : [...current.tagIds, tag.id],
                              };
                            })
                          }
                          style={{ borderColor: tag.color ?? "#4f86d9" }}
                        >
                          <span className="events-tag-picker-dot" style={{ background: tag.color ?? "#4f86d9" }} />
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="members-panel-actions">
                  <button type="submit" className="members-primary-button">
                    Update Group
                  </button>
                </div>
              </form>
            ) : (
              <div className="events-detail-grid" role="list" aria-label="Selected small group details">
                <p className="events-detail-item" role="listitem">
                  <span>ID</span>
                  <strong>{selectedGroup.id}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Status</span>
                  <strong>{selectedGroup.status}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Meeting Day</span>
                  <strong>{selectedGroup.meetingDay}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Meeting Time</span>
                  <strong>{normalizeTimeValue(selectedGroup.meetingTime) || "-"}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Location</span>
                  <strong>{selectedGroup.location || "-"}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Description</span>
                  <strong>{selectedGroup.description || "-"}</strong>
                </p>
                <p className="events-detail-item" role="listitem">
                  <span>Members</span>
                  <strong>{selectedGroupMemberships.length}</strong>
                </p>
                <div className="events-detail-item" role="listitem">
                  <span>Tags</span>
                  <div className="event-series-tag-list">
                    {(selectedGroup.tags ?? []).length ? (
                      selectedGroup.tags.map((tag) => (
                        <span
                          key={`selected-group-${selectedGroup.id}-${tag.id}`}
                          className="events-tag-pill"
                          style={{ borderColor: tag.color ?? "#4f86d9", color: tag.color ?? "#4f86d9" }}
                        >
                          {tag.name}
                        </span>
                      ))
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
                <button type="button" className="members-secondary-button" onClick={() => setEditForm(groupToForm(selectedGroup))}>
                  Edit Group
                </button>
              )}
              <button type="button" className="events-tag-remove-button" onClick={handleDeleteGroup}>
                Remove Group
              </button>
            </div>

            <div className="members-panel-head" style={{ marginTop: 20 }}>
              <h4>Members</h4>
            </div>

            <div className="events-register-list">
              {memberRows.length ? (
                memberRows.map(({ member, membership, role }) => (
                  <div key={member.id} className="events-register-row">
                    <div className="events-register-row-main">
                      <strong>{formatMemberName(member)}</strong>
                      <span>{formatFamilyName(member, familiesById)}</span>
                    </div>

                    <div className="events-register-row-actions">
                      <span className={`events-register-pill ${membership ? "events-register-pill-active" : ""}`}>
                        {membership ? "Registered" : "Not Registered"}
                      </span>
                      <select
                        className="events-register-select"
                        value={role}
                        onChange={(event) => setMemberRoleDrafts((current) => ({ ...current, [member.id]: event.target.value }))}
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="members-secondary-button" onClick={() => handleSaveMembership(member.id)}>
                        {membership ? "Save" : "Add"}
                      </button>
                      {membership ? (
                        <button type="button" className="members-secondary-button" onClick={() => handleDeleteMembership(membership.id)}>
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="events-register-empty">No members available.</p>
              )}
            </div>

          </aside>
        </div>
      ) : null}
    </section>
  );
}
