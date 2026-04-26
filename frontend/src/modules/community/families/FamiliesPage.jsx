import { useMemo, useState } from "react";

const MOCK_MEMBERS = [
  { id: 1, name: "Daniel Gomez" },
  { id: 2, name: "Mariana Lopez" },
  { id: 3, name: "Samuel Ortiz" },
  { id: 4, name: "Elena Vega" },
  { id: 5, name: "Camila Rivera" },
  { id: 6, name: "Jorge Mendez" },
];

const MOCK_FAMILIES = [
  { id: 1, name: "Gomez Family", memberIds: [1] },
  { id: 2, name: "Lopez Family", memberIds: [2] },
  { id: 3, name: "Ortiz Family", memberIds: [3, 5] },
  { id: 4, name: "Vega Family", memberIds: [4, 6] },
];

function createFamilyId() {
  return Math.floor(1000 + Math.random() * 9000);
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState(MOCK_FAMILIES);
  const [selectedFamilyId, setSelectedFamilyId] = useState(null);
  const [search, setSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");

  const membersById = useMemo(
    () => Object.fromEntries(MOCK_MEMBERS.map((member) => [member.id, member])),
    []
  );

  const selectedFamily = useMemo(
    () => families.find((family) => family.id === selectedFamilyId) ?? null,
    [families, selectedFamilyId]
  );

  const filteredFamilies = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return families.filter((family) => {
      const memberNames = (family.memberIds ?? [])
        .map((memberId) => membersById[memberId]?.name ?? "")
        .join(" ")
        .toLowerCase();

      return (
        !normalizedSearch ||
        family.name.toLowerCase().includes(normalizedSearch) ||
        memberNames.includes(normalizedSearch)
      );
    });
  }, [families, membersById, search]);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = memberSearch.trim().toLowerCase();

    return MOCK_MEMBERS.filter((member) => {
      const searchable = member.name.toLowerCase();
      return !normalizedSearch || searchable.includes(normalizedSearch);
    });
  }, [memberSearch]);

  const handleCreateFamily = (event) => {
    event.preventDefault();

    const name = newFamilyName.trim();
    if (!name) {
      return;
    }

    const newFamily = {
      id: createFamilyId(),
      name,
      memberIds: [],
    };

    setFamilies((current) => [newFamily, ...current]);
    setNewFamilyName("");
    setCreateOpen(false);
  };

  const handleRemoveSelectedFamily = () => {
    if (!selectedFamily) {
      return;
    }

    const confirmed = window.confirm(`Remove family "${selectedFamily.name}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setFamilies((current) => current.filter((family) => family.id !== selectedFamily.id));
    setSelectedFamilyId(null);
    setMemberSearch("");
  };

  const handleToggleFamilyMember = (memberId) => {
    if (!selectedFamily) {
      return;
    }

    setFamilies((current) =>
      current.map((family) => {
        if (family.id !== selectedFamily.id) {
          return family;
        }

        const currentMemberIds = family.memberIds ?? [];
        const alreadyInFamily = currentMemberIds.includes(memberId);

        return {
          ...family,
          memberIds: alreadyInFamily
            ? currentMemberIds.filter((id) => id !== memberId)
            : [...currentMemberIds, memberId],
        };
      })
    );
  };

  return (
    <section className="events-page">
      <header className="events-header">
        <div>
          <p className="events-subtitle">Manage families and register current members to each family.</p>
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

      <div className="events-series-list" role="list" aria-label="Families list">
        {filteredFamilies.length ? (
          filteredFamilies.map((family) => {
            const familyMembers = (family.memberIds ?? [])
              .map((memberId) => membersById[memberId]?.name)
              .filter(Boolean);

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
                  <p>{familyMembers.slice(0, 2).join(", ") || "No members yet"}</p>
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
                  <strong>{familyMembers.length ? familyMembers.join(", ") : "-"}</strong>
                </p>
              </article>
            );
          })
        ) : (
          <p className="events-register-empty">No families match your search.</p>
        )}
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

            <form className="members-add-form" onSubmit={handleCreateFamily}>
              <label>
                Family Name
                <input
                  value={newFamilyName}
                  onChange={(event) => setNewFamilyName(event.target.value)}
                  placeholder="e.g. Hernandez Family"
                  required
                />
              </label>

              <button type="submit" className="members-primary-button">
                Save Family
              </button>
            </form>
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
                <strong>{selectedFamily.memberIds?.length ?? 0}</strong>
              </p>
            </div>

            <div className="events-register-panel">
              <div className="events-register-panel-head">
                <div>
                  <h3>Register Members</h3>
                </div>

                <p className="events-register-count">{selectedFamily.memberIds?.length ?? 0} registered</p>
              </div>

              <label className="events-register-search">
                Search members
                <input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Name"
                />
              </label>

              <div className="events-register-list" role="list" aria-label="Family members list">
                {filteredMembers.length ? (
                  filteredMembers.map((member) => {
                    const isRegistered = (selectedFamily.memberIds ?? []).includes(member.id);

                    return (
                      <div key={member.id} className="events-register-row" role="listitem">
                        <div className="events-register-row-main">
                          <strong>{member.name}</strong>
                        </div>

                        <div className="events-register-row-actions">
                          <span className={`events-register-pill ${isRegistered ? "events-register-pill-active" : ""}`}>
                            {isRegistered ? "In family" : "Not in family"}
                          </span>
                          <button
                            type="button"
                            className={isRegistered ? "events-tag-remove-button" : "members-secondary-button"}
                            onClick={() => handleToggleFamilyMember(member.id)}
                          >
                            {isRegistered ? "Remove" : "Add"}
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
              <button type="button" className="events-tag-remove-button" onClick={handleRemoveSelectedFamily}>
                Remove Family
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
