import { useEffect, useMemo, useState } from "react";

import {
  createFamily,
  deleteFamily,
  fetchFamilies,
  fetchMembers,
  getStoredAccessToken,
  updateFamily,
  updateMember,
} from "../../../api/client";

const EMPTY_FAMILY_FORM = {
  name: "",
};

function emptyToNull(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}

function formatName(member) {
  return [member.name, member.middle_name, member.last_name_parental, member.last_name_maternal]
    .filter(Boolean)
    .join(" ");
}

function buildMemberPayload(member, overrides = {}) {
  const familyId = Number(overrides.family_id ?? member.family_id);

  if (!familyId) {
    throw new Error("A member must belong to a family.");
  }

  return {
    name: member.name,
    middle_name: member.middle_name,
    last_name_parental: member.last_name_parental,
    last_name_maternal: member.last_name_maternal,
    address: member.address,
    birth_date: member.birth_date,
    gender: member.gender,
    phone: member.phone,
    email: member.email,
    marital_status: member.marital_status,
    family_role: member.family_role,
    is_baptized: Boolean(member.is_baptized),
    baptized_location: member.baptized_location,
    member_status_id: Number(member.member_status_id),
    family_id: familyId,
  };
}

function FamilyNameForm({ value, onChange, onSubmit, submitLabel, onCancel, disabled }) {
  return (
    <form className="members-add-form" onSubmit={onSubmit}>
      <label>
        Family Name
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="e.g. Hernandez Family" required />
      </label>

      <div className="detail-modal-actions">
        {onCancel ? (
          <button type="button" className="members-secondary-button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="members-primary-button" disabled={disabled}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState(null);
  const [search, setSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [editFamilyName, setEditFamilyName] = useState("");
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
        const [familiesData, membersData] = await Promise.all([fetchFamilies(token), fetchMembers(token, "?limit=500")]);

        if (!active) {
          return;
        }

        setFamilies(familiesData);
        setMembers(membersData);
        setError("");
      } catch (exception) {
        if (active) {
          setError(exception instanceof Error ? exception.message : "Failed to load families.");
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

  const familyById = useMemo(() => Object.fromEntries(families.map((family) => [family.id, family])), [families]);

  const selectedFamily = useMemo(
    () => families.find((family) => family.id === selectedFamilyId) ?? null,
    [families, selectedFamilyId]
  );

  useEffect(() => {
    setEditFamilyName(selectedFamily?.name ?? "");
  }, [selectedFamily?.name, selectedFamilyId]);

  const selectedFamilyMembers = useMemo(
    () => members.filter((member) => member.family_id === selectedFamilyId),
    [members, selectedFamilyId]
  );

  const filteredFamilies = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return families.filter((family) => {
      const memberNames = members
        .filter((member) => member.family_id === family.id)
        .map((member) => formatName(member))
        .join(" ")
        .toLowerCase();

      return (
        !normalizedSearch ||
        family.name.toLowerCase().includes(normalizedSearch) ||
        memberNames.includes(normalizedSearch)
      );
    });
  }, [families, members, search]);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = memberSearch.trim().toLowerCase();

    return members.filter((member) => {
      const searchable = `${formatName(member)} ${familyById[member.family_id]?.name ?? ""}`.toLowerCase();
      return !normalizedSearch || searchable.includes(normalizedSearch);
    });
  }, [familyById, memberSearch, members]);

  const handleCreateFamily = async (event) => {
    event.preventDefault();

    const name = newFamilyName.trim();
    if (!name) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      const token = getStoredAccessToken();
      const createdFamily = await createFamily(token, { name });
      setFamilies((current) => [createdFamily, ...current]);
      setNewFamilyName("");
      setCreateOpen(false);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to create family.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFamily = async (event) => {
    event.preventDefault();
    if (!selectedFamily) {
      return;
    }

    const name = editFamilyName.trim();
    if (!name) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      const token = getStoredAccessToken();
      const updatedFamily = await updateFamily(token, selectedFamily.id, { name });
      setFamilies((current) => current.map((family) => (family.id === selectedFamily.id ? updatedFamily : family)));
      setSelectedFamilyId(updatedFamily.id);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to update family.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSelectedFamily = async () => {
    if (!selectedFamily) {
      return;
    }

    if (selectedFamilyMembers.length) {
      setError("Move all members to another family before deleting this family.");
      return;
    }

    const confirmed = window.confirm(`Remove family "${selectedFamily.name}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      const token = getStoredAccessToken();
      await deleteFamily(token, selectedFamily.id);
      setFamilies((current) => current.filter((family) => family.id !== selectedFamily.id));
      setSelectedFamilyId(null);
      setMemberSearch("");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to remove family.");
    } finally {
      setSaving(false);
    }
  };

  const handleMoveMemberToSelectedFamily = async (member) => {
    if (!selectedFamily || member.family_id === selectedFamily.id) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      const token = getStoredAccessToken();
      const updatedMember = await updateMember(token, member.id, buildMemberPayload(member, { family_id: selectedFamily.id }));
      setMembers((current) => current.map((item) => (item.id === member.id ? updatedMember : item)));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to move member to family.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="events-page">
      <header className="events-header">
        <div>
          <p className="events-subtitle">Live families data connected to the backend.</p>
        </div>

        <div className="events-actions">
          <label className="events-register-search" style={{ minWidth: "240px" }}>
            Search families
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Family name or member"
            />
          </label>
          <button type="button" className="members-primary-button" onClick={() => setCreateOpen((value) => !value)}>
            Add Family
          </button>
        </div>
      </header>

      {loading ? <p className="events-register-empty">Loading families...</p> : null}
      {error ? <p className="events-register-empty">{error}</p> : null}

      <div className="events-series-list" role="list" aria-label="Families list">
        {!loading && !filteredFamilies.length ? <p className="events-register-empty">No families match your search.</p> : null}

        {filteredFamilies.map((family) => {
          const familyMembers = members.filter((member) => member.family_id === family.id);

          return (
            <article
              key={family.id}
              className="event-series-row"
              role="listitem"
              tabIndex={0}
              onClick={() => {
                setSelectedFamilyId(family.id);
                setMemberSearch("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedFamilyId(family.id);
                  setMemberSearch("");
                }
              }}
              aria-label={`Open details for ${family.name}`}
            >
              <div className="event-series-main">
                <h3>{family.name}</h3>
                <p>{familyMembers.slice(0, 2).map(formatName).join(", ") || "No members yet"}</p>
                <div className="event-series-badges">
                  <span className="event-series-badge event-series-badge-recurrence">Family</span>
                </div>
              </div>

              <p className="event-series-meta">
                <span>Members</span>
                <strong>{familyMembers.length}</strong>
              </p>
              <p className="event-series-meta">
                <span>Current Members</span>
                <strong>{familyMembers.length ? familyMembers.map(formatName).join(", ") : "-"}</strong>
              </p>
            </article>
          );
        })}
      </div>

      <p className="events-count">Showing {filteredFamilies.length} families</p>

      {createOpen ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={() => setCreateOpen(false)} role="presentation">
          <aside className="events-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>Create Family</h3>
              <button type="button" className="members-text-button" onClick={() => setCreateOpen(false)}>
                Close
              </button>
            </div>

            <FamilyNameForm
              value={newFamilyName}
              onChange={setNewFamilyName}
              onSubmit={handleCreateFamily}
              submitLabel="Save Family"
              disabled={saving}
            />
          </aside>
        </div>
      ) : null}

      {selectedFamily ? (
        <div
          className="members-drawer-backdrop events-modal-backdrop"
          onClick={() => {
            setSelectedFamilyId(null);
            setMemberSearch("");
          }}
          role="presentation"
        >
          <aside className="events-modal-card events-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>{selectedFamily.name}</h3>
              <button
                type="button"
                className="members-text-button"
                onClick={() => {
                  setSelectedFamilyId(null);
                  setMemberSearch("");
                }}
              >
                Close
              </button>
            </div>

            <div className="events-detail-grid" role="list" aria-label="Selected family details">
              <p className="events-detail-item" role="listitem">
                <span>ID</span>
                <strong>{selectedFamily.id}</strong>
              </p>
              <p className="events-detail-item" role="listitem">
                <span>Name</span>
                <strong>{selectedFamily.name}</strong>
              </p>
              <p className="events-detail-item" role="listitem">
                <span>Current Members</span>
                <strong>{selectedFamilyMembers.length}</strong>
              </p>
            </div>

            <div className="events-register-panel">
              <div className="events-register-panel-head">
                <div>
                  <h3>Edit Family</h3>
                </div>
              </div>

              <FamilyNameForm
                value={editFamilyName}
                onChange={setEditFamilyName}
                onSubmit={handleSaveFamily}
                submitLabel="Save Changes"
                disabled={saving}
              />
            </div>

            <div className="events-register-panel">
              <div className="events-register-panel-head">
                <div>
                  <h3>Current Members</h3>
                </div>

                <p className="events-register-count">{selectedFamilyMembers.length} registered</p>
              </div>

              <div className="events-register-list" role="list" aria-label="Family members list">
                {selectedFamilyMembers.length ? (
                  selectedFamilyMembers.map((member) => (
                    <div key={member.id} className="events-register-row" role="listitem">
                      <div className="events-register-row-main">
                        <strong>{formatName(member)}</strong>
                      </div>

                      <div className="events-register-row-actions">
                        <span className="events-register-pill events-register-pill-active">In family</span>
                        <span>{familyById[member.family_id]?.name ?? "—"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="events-register-empty">No members assigned to this family yet.</p>
                )}
              </div>
            </div>

            <div className="events-register-panel">
              <div className="events-register-panel-head">
                <div>
                  <h3>Move Members Here</h3>
                </div>

                <p className="events-register-count">Use this panel to reassign members from other families.</p>
              </div>

              <label className="events-register-search">
                Search members
                <input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Name or family"
                />
              </label>

              <div className="events-register-list" role="list" aria-label="Move members list">
                {filteredMembers.length ? (
                  filteredMembers.map((member) => {
                    const isCurrentFamily = member.family_id === selectedFamily.id;
                    const currentFamilyName = familyById[member.family_id]?.name ?? "—";

                    return (
                      <div key={member.id} className="events-register-row" role="listitem">
                        <div className="events-register-row-main">
                          <strong>{formatName(member)}</strong>
                          <span>{currentFamilyName}</span>
                        </div>

                        <div className="events-register-row-actions">
                          <span className={`events-register-pill ${isCurrentFamily ? "events-register-pill-active" : ""}`}>
                            {isCurrentFamily ? "In family" : "Other family"}
                          </span>
                          <button
                            type="button"
                            className={isCurrentFamily ? "members-secondary-button" : "members-primary-button"}
                            onClick={() => handleMoveMemberToSelectedFamily(member)}
                            disabled={isCurrentFamily || saving}
                          >
                            {isCurrentFamily ? "Already here" : "Move Here"}
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

            <div className="detail-modal-actions">
              <button
                type="button"
                className="events-tag-remove-button"
                onClick={handleRemoveSelectedFamily}
                disabled={saving || selectedFamilyMembers.length > 0}
              >
                Remove Family
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}