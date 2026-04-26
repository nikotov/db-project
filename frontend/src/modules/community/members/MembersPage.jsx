import { useMemo, useState } from "react";

const MOCK_MEMBERS = [
  {
    id: 1,
    name: "Daniel",
    middle_name: "Luis",
    last_name_parental: "Gomez",
    last_name_maternal: "Perez",
    address: "125 Elm St",
    birth_date: "1994-03-14",
    gender: "M",
    phone: "555-0142",
    email: "daniel.gomez@example.com",
    created_at: "2026-04-02 09:20",
    updated_at: "2026-04-08 11:45",
    marital_status: "Single",
    family_role: "son",
    is_baptized: true,
    baptized_location: "Main Campus",
    member_status: "active",
    family: "Gomez Family",
  },
  {
    id: 2,
    name: "Mariana",
    middle_name: null,
    last_name_parental: "Lopez",
    last_name_maternal: "Ramos",
    address: "48 Pine Ave",
    birth_date: "1988-11-30",
    gender: "F",
    phone: "555-0187",
    email: "mariana.lopez@example.com",
    created_at: "2026-03-24 14:10",
    updated_at: null,
    marital_status: "Married",
    family_role: "mother",
    is_baptized: true,
    baptized_location: "North Branch",
    member_status: "active",
    family: "Lopez Family",
  },
  {
    id: 3,
    name: "Samuel",
    middle_name: "Joel",
    last_name_parental: "Ortiz",
    last_name_maternal: null,
    address: "91 Lake Rd",
    birth_date: "2001-07-06",
    gender: "M",
    phone: null,
    email: "samuel.ortiz@example.com",
    created_at: "2026-04-10 08:15",
    updated_at: "2026-04-11 09:05",
    marital_status: "Single",
    family_role: "member",
    is_baptized: false,
    baptized_location: null,
    member_status: "active",
    family: "Ortiz Family",
  },
  {
    id: 4,
    name: "Elena",
    middle_name: "Maria",
    last_name_parental: "Vega",
    last_name_maternal: "Santos",
    address: "17 River Blvd",
    birth_date: "1979-01-22",
    gender: "F",
    phone: "555-0199",
    email: "elena.vega@example.com",
    created_at: "2026-02-28 12:40",
    updated_at: "2026-03-02 16:12",
    marital_status: "Married",
    family_role: "head",
    is_baptized: true,
    baptized_location: "Central Church",
    member_status: "inactive",
    family: "Vega Family",
  },
];

const DEFAULT_FILTERS = {
  search: "",
  member_status: "all",
  gender: "all",
  marital_status: "all",
  baptized: "all",
  family: "all",
};

const ADD_FORM_INITIAL = {
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
  member_status: "active",
  family: "",
};

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return value;
}

function createMemberId() {
  return Math.floor(1000 + Math.random() * 9000);
}

function formatName(member) {
  return [member.name, member.middle_name, member.last_name_parental, member.last_name_maternal]
    .filter(Boolean)
    .join(" ");
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value.replace(" ", "T"));
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

export default function MembersPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [newMember, setNewMember] = useState(ADD_FORM_INITIAL);

  const filterOptions = useMemo(
    () => ({
      statuses: [...new Set(members.map((member) => member.member_status))],
      genders: [...new Set(members.map((member) => member.gender))],
      maritalStatuses: [...new Set(members.map((member) => member.marital_status))],
      families: [...new Set(members.map((member) => member.family))],
    }),
    [members]
  );

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const fullName = formatName(member).toLowerCase();
      const matchesSearch = fullName.includes(filters.search.toLowerCase());
      const matchesStatus = filters.member_status === "all" || member.member_status === filters.member_status;
      const matchesGender = filters.gender === "all" || member.gender === filters.gender;
      const matchesMaritalStatus =
        filters.marital_status === "all" || member.marital_status === filters.marital_status;
      const matchesBaptized =
        filters.baptized === "all" || String(member.is_baptized) === filters.baptized;
      const matchesFamily = filters.family === "all" || member.family === filters.family;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesGender &&
        matchesMaritalStatus &&
        matchesBaptized &&
        matchesFamily
      );
    });
  }, [filters, members]);

  const handleAddMember = (event) => {
    event.preventDefault();

    const memberToAdd = {
      id: createMemberId(),
      ...newMember,
      middle_name: newMember.middle_name || null,
      last_name_maternal: newMember.last_name_maternal || null,
      address: newMember.address || null,
      birth_date: newMember.birth_date || null,
      phone: newMember.phone || null,
      email: newMember.email || null,
      updated_at: null,
      baptized_location: newMember.baptized_location || null,
      is_baptized: false,
      created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    setMembers((current) => [memberToAdd, ...current]);
    setNewMember(ADD_FORM_INITIAL);
    setAddOpen(false);
  };

  const handleRemoveSelectedMember = () => {
    if (!selectedMember) {
      return;
    }

    const confirmed = window.confirm(`Remove member "${formatName(selectedMember)}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setMembers((current) => current.filter((member) => member.id !== selectedMember.id));
    setSelectedMember(null);
  };

  return (
    <section className="members-page">
      <header className="members-header">
        <div>
          <p className="members-subtitle">All member attributes in one place.</p>
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

      <div className="members-list" role="list" aria-label="Members list">
        {filteredMembers.length ? (
          filteredMembers.map((member) => (
            <article
              key={member.id}
              className="member-row"
              role="listitem button"
              tabIndex={0}
              onClick={() => setSelectedMember(member)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedMember(member);
                }
              }}
              aria-label={`Open details for ${formatName(member)}`}
            >
              <div className="member-row-main">
                <h3>{formatName(member)}</h3>
                <p>{formatValue(member.family)}</p>
                <div className="member-row-badges">
                  <span className="member-row-badge member-row-badge-gender">{member.gender}</span>
                  <span className={`member-row-badge member-row-status-${member.member_status}`}>
                    {member.member_status}
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
          ))
        ) : (
          <p className="members-empty-state">No members match your current filters.</p>
        )}
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
                  placeholder="Name"
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
                    <option key={status} value={status}>
                      {status}
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
                    <option key={gender} value={gender}>
                      {gender}
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
                    <option key={family} value={family}>
                      {family}
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

            <form className="members-add-form" onSubmit={handleAddMember}>
              <label>
                Name
                <input value={newMember.name} onChange={(event) => setNewMember((current) => ({ ...current, name: event.target.value }))} required />
              </label>
              <label>
                Middle Name
                <input value={newMember.middle_name} onChange={(event) => setNewMember((current) => ({ ...current, middle_name: event.target.value }))} />
              </label>
              <label>
                Parental Last Name
                <input value={newMember.last_name_parental} onChange={(event) => setNewMember((current) => ({ ...current, last_name_parental: event.target.value }))} required />
              </label>
              <label>
                Maternal Last Name
                <input value={newMember.last_name_maternal} onChange={(event) => setNewMember((current) => ({ ...current, last_name_maternal: event.target.value }))} />
              </label>
              <label>
                Address
                <input value={newMember.address} onChange={(event) => setNewMember((current) => ({ ...current, address: event.target.value }))} />
              </label>
              <label>
                Birth Date
                <input type="date" value={newMember.birth_date} onChange={(event) => setNewMember((current) => ({ ...current, birth_date: event.target.value }))} />
              </label>
              <label>
                Gender
                <select value={newMember.gender} onChange={(event) => setNewMember((current) => ({ ...current, gender: event.target.value }))}>
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label>
                Phone
                <input value={newMember.phone} onChange={(event) => setNewMember((current) => ({ ...current, phone: event.target.value }))} />
              </label>
              <label>
                Email
                <input type="email" value={newMember.email} onChange={(event) => setNewMember((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label>
                Marital Status
                <select value={newMember.marital_status} onChange={(event) => setNewMember((current) => ({ ...current, marital_status: event.target.value }))}>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </label>
              <label>
                Family Role
                <input value={newMember.family_role} onChange={(event) => setNewMember((current) => ({ ...current, family_role: event.target.value }))} />
              </label>
              <label>
                Baptized Location
                <input value={newMember.baptized_location} onChange={(event) => setNewMember((current) => ({ ...current, baptized_location: event.target.value }))} />
              </label>
              <label>
                Member Status
                <select value={newMember.member_status} onChange={(event) => setNewMember((current) => ({ ...current, member_status: event.target.value }))}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>
              <label>
                Family
                <input value={newMember.family} onChange={(event) => setNewMember((current) => ({ ...current, family: event.target.value }))} />
              </label>

              <button type="submit" className="members-primary-button">
                Save Member
              </button>
            </form>
          </aside>
        </div>
      ) : null}

      {selectedMember ? (
        <div className="members-drawer-backdrop events-modal-backdrop" onClick={() => setSelectedMember(null)} role="presentation">
          <aside className="events-modal-card members-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="members-panel-head">
              <h3>{formatName(selectedMember)}</h3>
              <button type="button" className="members-text-button" onClick={() => setSelectedMember(null)}>
                Close
              </button>
            </div>

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
                <strong>{formatValue(selectedMember.birth_date)}</strong>
              </p>
              <p className="members-detail-item" role="listitem">
                <span>Gender</span>
                <strong>{formatValue(selectedMember.gender)}</strong>
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
                <strong>{formatValue(selectedMember.member_status)}</strong>
              </p>
              <p className="members-detail-item" role="listitem">
                <span>Family</span>
                <strong>{formatValue(selectedMember.family)}</strong>
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

            <div className="detail-modal-actions">
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
