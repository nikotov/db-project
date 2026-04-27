import { useEffect, useMemo, useState } from "react";

import {
  createMember,
  deleteMember,
  fetchFamilies,
  fetchMemberStatuses,
  fetchMembers,
  getStoredAccessToken,
  updateMember,
} from "../../../api/client";

const GENDER_OPTIONS = [
  { value: "F", label: "Female" },
  { value: "M", label: "Male" },
  { value: "Other", label: "Other" },
];

const MARITAL_STATUS_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];

const DEFAULT_FILTERS = {
  search: "",
  member_status: "all",
  gender: "all",
  marital_status: "all",
  baptized: "all",
  family: "all",
};

const EMPTY_MEMBER_FORM = {
  name: "",
  middle_name: "",
  last_name_parental: "",
  last_name_maternal: "",
  address: "",
  birth_date: "",
  gender: "F",
  phone: "",
  email: "",
  marital_status: "Single",
  family_role: "member",
  baptized_location: "",
  member_status_id: "",
  family_id: "",
  is_baptized: "false",
};

function normalizeToken(value) {
  return String(value ?? "unknown").toLowerCase().replace(/\s+/g, "-");
}

function emptyToNull(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function formatName(member) {
  return [member.name, member.middle_name, member.last_name_parental, member.last_name_maternal]
    .filter(Boolean)
    .join(" ");
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return value;
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function genderLabel(value) {
  return GENDER_OPTIONS.find((option) => option.value === value)?.label ?? value ?? "—";
}

function memberToForm(member) {
  if (!member) {
    return { ...EMPTY_MEMBER_FORM };
  }

  return {
    name: member.name ?? "",
    middle_name: member.middle_name ?? "",
    last_name_parental: member.last_name_parental ?? "",
    last_name_maternal: member.last_name_maternal ?? "",
    address: member.address ?? "",
    birth_date: member.birth_date ?? "",
    gender: member.gender ?? "F",
    phone: member.phone ?? "",
    email: member.email ?? "",
    marital_status: member.marital_status ?? "Single",
    family_role: member.family_role ?? "member",
    baptized_location: member.baptized_location ?? "",
    member_status_id: member.member_status_id ? String(member.member_status_id) : "",
    family_id: member.family_id ? String(member.family_id) : "",
    is_baptized: String(Boolean(member.is_baptized)),
  };
}

function createDefaultMemberForm(familyList, statusList) {
  return {
    ...EMPTY_MEMBER_FORM,
    family_id: familyList[0]?.id ? String(familyList[0].id) : "",
    member_status_id: statusList[0]?.id ? String(statusList[0].id) : "",
  };
}

function buildMemberPayload(form) {
  const familyId = Number(form.family_id);
  const memberStatusId = Number(form.member_status_id);

  if (!familyId || !memberStatusId) {
    throw new Error("Select a family and member status before saving.");
  }

  return {
    name: form.name.trim(),
    middle_name: emptyToNull(form.middle_name),
    last_name_parental: form.last_name_parental.trim(),
    last_name_maternal: emptyToNull(form.last_name_maternal),
    address: emptyToNull(form.address),
    birth_date: form.birth_date || null,
    gender: form.gender,
    phone: emptyToNull(form.phone),
    email: emptyToNull(form.email),
    marital_status: form.marital_status || null,
    family_role: emptyToNull(form.family_role),
    is_baptized: form.is_baptized === "true",
    baptized_location: emptyToNull(form.baptized_location),
    member_status_id: memberStatusId,
    family_id: familyId,
  };
}

function MemberForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  families,
  memberStatuses,
  onCancel,
  disabled,
}) {
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <form className="members-add-form" onSubmit={onSubmit}>
      <label>
        Name
        <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
      </label>
      <label>
        Middle Name
        <input value={form.middle_name} onChange={(event) => updateField("middle_name", event.target.value)} />
      </label>
      <label>
        Parental Last Name
        <input
          value={form.last_name_parental}
          onChange={(event) => updateField("last_name_parental", event.target.value)}
          required
        />
      </label>
      <label>
        Maternal Last Name
        <input value={form.last_name_maternal} onChange={(event) => updateField("last_name_maternal", event.target.value)} />
      </label>
      <label>
        Address
        <input value={form.address} onChange={(event) => updateField("address", event.target.value)} />
      </label>
      <label>
        Birth Date
        <input type="date" value={form.birth_date} onChange={(event) => updateField("birth_date", event.target.value)} />
      </label>
      <label>
        Gender
        <select value={form.gender} onChange={(event) => updateField("gender", event.target.value)}>
          {GENDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Phone
        <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
      </label>
      <label>
        Email
        <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
      </label>
      <label>
        Marital Status
        <select value={form.marital_status} onChange={(event) => updateField("marital_status", event.target.value)}>
          {MARITAL_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label>
        Family Role
        <input value={form.family_role} onChange={(event) => updateField("family_role", event.target.value)} />
      </label>
      <label>
        Baptized
        <select value={form.is_baptized} onChange={(event) => updateField("is_baptized", event.target.value)}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </label>
      <label>
        Baptized Location
        <input
          value={form.baptized_location}
          onChange={(event) => updateField("baptized_location", event.target.value)}
        />
      </label>
      <label>
        Member Status
        <select
          value={form.member_status_id}
          onChange={(event) => updateField("member_status_id", event.target.value)}
          required
          disabled={!memberStatuses.length}
        >
          <option value="">Select status</option>
          {memberStatuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Family
        <select
          value={form.family_id}
          onChange={(event) => updateField("family_id", event.target.value)}
          required
          disabled={!families.length}
        >
          <option value="">Select family</option>
          {families.map((family) => (
            <option key={family.id} value={family.id}>
              {family.name}
            </option>
          ))}
        </select>
      </label>

      <div className="detail-modal-actions">
        {onCancel ? (
          <button type="button" className="members-secondary-button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="members-primary-button" disabled={disabled || !families.length || !memberStatuses.length}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function MembersPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [members, setMembers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [memberStatuses, setMemberStatuses] = useState([]);
  const [newMember, setNewMember] = useState({ ...EMPTY_MEMBER_FORM });
  const [editMember, setEditMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
        const [membersData, familiesData, memberStatusesData] = await Promise.all([
          fetchMembers(token, "?limit=500"),
          fetchFamilies(token),
          fetchMemberStatuses(token),
        ]);

        if (!active) {
          return;
        }

        setMembers(membersData);
        setFamilies(familiesData);
        setMemberStatuses(memberStatusesData);
        setError("");
      } catch (exception) {
        if (active) {
          setError(exception instanceof Error ? exception.message : "Failed to load members.");
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

  useEffect(() => {
    if (!families.length || !memberStatuses.length) {
      return;
    }

    setNewMember((current) => {
      if (current.family_id && current.member_status_id) {
        return current;
      }

      return {
        ...current,
        family_id: current.family_id || String(families[0].id),
        member_status_id: current.member_status_id || String(memberStatuses[0].id),
      };
    });
  }, [families, memberStatuses, newMember.family_id, newMember.member_status_id]);

  const familyById = useMemo(() => Object.fromEntries(families.map((family) => [family.id, family])), [families]);
  const statusById = useMemo(
    () => Object.fromEntries(memberStatuses.map((status) => [status.id, status])),
    [memberStatuses]
  );

  const filterOptions = useMemo(
    () => ({
      statuses: memberStatuses,
      genders: GENDER_OPTIONS,
      maritalStatuses: MARITAL_STATUS_OPTIONS,
      families,
    }),
    [families, memberStatuses]
  );

  const filteredMembers = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return members.filter((member) => {
      const fullName = formatName(member).toLowerCase();
      const familyName = familyById[member.family_id]?.name?.toLowerCase() ?? "";
      const statusName = statusById[member.member_status_id]?.name?.toLowerCase() ?? "";
      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        familyName.includes(search) ||
        statusName.includes(search);
      const matchesStatus = filters.member_status === "all" || String(member.member_status_id) === filters.member_status;
      const matchesGender = filters.gender === "all" || member.gender === filters.gender;
      const matchesMaritalStatus =
        filters.marital_status === "all" || member.marital_status === filters.marital_status;
      const matchesBaptized = filters.baptized === "all" || String(Boolean(member.is_baptized)) === filters.baptized;
      const matchesFamily = filters.family === "all" || String(member.family_id) === filters.family;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesGender &&
        matchesMaritalStatus &&
        matchesBaptized &&
        matchesFamily
      );
    });
  }, [familyById, filters, members, statusById]);

  const selectedFamily = selectedMember ? familyById[selectedMember.family_id] ?? null : null;
  const selectedStatus = selectedMember ? statusById[selectedMember.member_status_id] ?? null : null;

  const handleAddMember = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const token = getStoredAccessToken();
      const createdMember = await createMember(token, buildMemberPayload(newMember));
      setMembers((current) => [createdMember, ...current]);
      setNewMember(createDefaultMemberForm(families, memberStatuses));
      setAddOpen(false);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to create member.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSelectedMember = async (event) => {
    event.preventDefault();
    if (!selectedMember || !editMember) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      const token = getStoredAccessToken();
      const updatedMember = await updateMember(token, selectedMember.id, buildMemberPayload(editMember));
      setMembers((current) => current.map((member) => (member.id === selectedMember.id ? updatedMember : member)));
      setSelectedMember(updatedMember);
      setEditMember(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to update member.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSelectedMember = async () => {
    if (!selectedMember) {
      return;
    }

    const confirmed = window.confirm(`Remove member "${formatName(selectedMember)}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      const token = getStoredAccessToken();
      await deleteMember(token, selectedMember.id);
      setMembers((current) => current.filter((member) => member.id !== selectedMember.id));
      setSelectedMember(null);
      setEditMember(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to remove member.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="members-page">
      <header className="members-header">
        <div>
          <p className="members-subtitle">Live members data connected to the backend.</p>
        </div>

        <div className="members-actions">
          <button type="button" className="members-secondary-button" onClick={() => setFiltersOpen((value) => !value)}>
            Filters
          </button>
          <button type="button" className="members-primary-button" onClick={() => setAddOpen((value) => !value)}>
            Add Member
          </button>
        </div>
      </header>

      {loading ? <p className="members-empty-state">Loading members...</p> : null}
      {error ? <p className="members-empty-state">{error}</p> : null}

      <div className="members-list" role="list" aria-label="Members list">
        {!loading && !filteredMembers.length ? (
          <p className="members-empty-state">No members match your current filters.</p>
        ) : null}

        {filteredMembers.map((member) => {
          const familyName = familyById[member.family_id]?.name ?? "Unknown family";
          const statusName = statusById[member.member_status_id]?.name ?? "Unknown status";

          return (
            <article
              key={member.id}
              className="member-row"
              role="listitem button"
              tabIndex={0}
              onClick={() => {
                setSelectedMember(member);
                setEditMember(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedMember(member);
                  setEditMember(null);
                }
              }}
              aria-label={`Open details for ${formatName(member)}`}
            >
              <div className="member-row-main">
                <h3>{formatName(member)}</h3>
                <p>{familyName}</p>
                <div className="member-row-badges">
                  <span className="member-row-badge member-row-badge-gender">{genderLabel(member.gender)}</span>
                  <span className={`member-row-badge member-row-status-${normalizeToken(statusName)}`}>
                    {statusName}
                  </span>
                </div>
              </div>

              <p className="member-row-meta">
                <span>Email</span>
                <strong>{formatValue(member.email)}</strong>
              </p>
              <p className="member-row-meta">
                <span>Phone</span>
                <strong>{formatValue(member.phone)}</strong>
              </p>
              <p className="member-row-meta">
                <span>Family Role</span>
                <strong>{formatValue(member.family_role)}</strong>
              </p>
              <p className="member-row-meta">
                <span>Baptized</span>
                <strong>{member.is_baptized ? "Yes" : "No"}</strong>
              </p>
            </article>
          );
        })}
      </div>

      <p className="members-count">Showing {filteredMembers.length} members</p>

      {filtersOpen ? (
        <div className="members-drawer-backdrop" onClick={() => setFiltersOpen(false)} role="presentation">
          <aside className="members-drawer members-filter-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>Filters</h3>
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
                  placeholder="Name, family, status"
                />
              </label>

              <label>
                Member Status
                <select
                  value={filters.member_status}
                  onChange={(event) => setFilters((current) => ({ ...current, member_status: event.target.value }))}
                >
                  <option value="all">All</option>
                  {filterOptions.statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Gender
                <select
                  value={filters.gender}
                  onChange={(event) => setFilters((current) => ({ ...current, gender: event.target.value }))}
                >
                  <option value="all">All</option>
                  {filterOptions.genders.map((gender) => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Marital Status
                <select
                  value={filters.marital_status}
                  onChange={(event) => setFilters((current) => ({ ...current, marital_status: event.target.value }))}
                >
                  <option value="all">All</option>
                  {filterOptions.maritalStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Baptized
                <select
                  value={filters.baptized}
                  onChange={(event) => setFilters((current) => ({ ...current, baptized: event.target.value }))}
                >
                  <option value="all">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>

              <label>
                Family
                <select
                  value={filters.family}
                  onChange={(event) => setFilters((current) => ({ ...current, family: event.target.value }))}
                >
                  <option value="all">All</option>
                  {filterOptions.families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </label>

              <button type="button" className="members-secondary-button" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear Filters
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {addOpen ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={() => setAddOpen(false)} role="presentation">
          <aside className="events-modal-card events-modal-card-wide" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>Add Member</h3>
              <button type="button" className="members-text-button" onClick={() => setAddOpen(false)}>
                Close
              </button>
            </div>

            <MemberForm
              form={newMember}
              setForm={setNewMember}
              onSubmit={handleAddMember}
              submitLabel="Save Member"
              families={families}
              memberStatuses={memberStatuses}
              disabled={saving}
            />
          </aside>
        </div>
      ) : null}

      {selectedMember ? (
        <div
          className="members-drawer-backdrop events-modal-backdrop"
          onClick={() => {
            setSelectedMember(null);
            setEditMember(null);
          }}
          role="presentation"
        >
          <aside className="events-modal-card members-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>{formatName(selectedMember)}</h3>
              <button
                type="button"
                className="members-text-button"
                onClick={() => {
                  setSelectedMember(null);
                  setEditMember(null);
                }}
              >
                Close
              </button>
            </div>

            {editMember ? (
              <MemberForm
                form={editMember}
                setForm={setEditMember}
                onSubmit={handleSaveSelectedMember}
                submitLabel="Save Changes"
                families={families}
                memberStatuses={memberStatuses}
                onCancel={() => setEditMember(null)}
                disabled={saving}
              />
            ) : (
              <div className="members-detail-grid" role="list" aria-label="Selected member details">
                <p className="members-detail-item" role="listitem">
                  <span>ID</span>
                  <strong>{selectedMember.id}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Name</span>
                  <strong>{formatValue(selectedMember.name)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Middle Name</span>
                  <strong>{formatValue(selectedMember.middle_name)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Parental Last Name</span>
                  <strong>{formatValue(selectedMember.last_name_parental)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Maternal Last Name</span>
                  <strong>{formatValue(selectedMember.last_name_maternal)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Address</span>
                  <strong>{formatValue(selectedMember.address)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Birth Date</span>
                  <strong>{formatDate(selectedMember.birth_date)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Gender</span>
                  <strong>{genderLabel(selectedMember.gender)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Phone</span>
                  <strong>{formatValue(selectedMember.phone)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Email</span>
                  <strong>{formatValue(selectedMember.email)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Marital Status</span>
                  <strong>{formatValue(selectedMember.marital_status)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Family Role</span>
                  <strong>{formatValue(selectedMember.family_role)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Baptized</span>
                  <strong>{selectedMember.is_baptized ? "Yes" : "No"}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Baptized Location</span>
                  <strong>{formatValue(selectedMember.baptized_location)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Status</span>
                  <strong>{selectedStatus?.name ?? "—"}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Family</span>
                  <strong>{selectedFamily?.name ?? "—"}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Created At</span>
                  <strong>{formatDateTime(selectedMember.created_at)}</strong>
                </p>
                <p className="members-detail-item" role="listitem">
                  <span>Updated At</span>
                  <strong>{formatDateTime(selectedMember.updated_at)}</strong>
                </p>
              </div>
            )}

            <div className="detail-modal-actions">
              {editMember ? (
                <button type="button" className="members-secondary-button" onClick={() => setEditMember(null)}>
                  Cancel Edit
                </button>
              ) : (
                <button type="button" className="members-secondary-button" onClick={() => setEditMember(memberToForm(selectedMember))}>
                  Edit Member
                </button>
              )}
              <button type="button" className="events-tag-remove-button" onClick={handleRemoveSelectedMember}>
                Remove Member
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}