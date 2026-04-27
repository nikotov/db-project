-- Development seed data for local testing (idempotent).

-- Lookup tables
INSERT INTO member_status (name)
VALUES ('active'), ('inactive')
ON CONFLICT (name) DO NOTHING;

INSERT INTO family (name)
SELECT value_name
FROM (
	VALUES
		('Gomez Family'),
		('Lopez Family'),
		('Ortiz Family'),
		('Vega Family'),
		('Rivera Family')
) AS source(value_name)
WHERE NOT EXISTS (
	SELECT 1 FROM family f WHERE f.name = source.value_name
);

-- Users
INSERT INTO user_account (username, password_hash, role, created_at, last_login)
VALUES (
	'admin',
	'pbkdf2_sha256$200000$TkQrot18VJBFl8sY4rLAFb67T6OEoxkLaHWNS57MunwVCb5hihjZ7vQ7iSxaDCCe',
	'admin',
	NOW(),
	NULL
)
ON CONFLICT (username) DO NOTHING;

-- Members
INSERT INTO member (
	name,
	middle_name,
	last_name_parental,
	last_name_maternal,
	address,
	birth_date,
	gender,
	phone,
	email,
	marital_status,
	family_role,
	is_baptized,
	baptized_location,
	member_status_id,
	family_id
)
SELECT
	source.name,
	source.middle_name,
	source.last_name_parental,
	source.last_name_maternal,
	source.address,
	source.birth_date,
	source.gender::gender_enum,
	source.phone,
	source.email,
	source.marital_status::marital_status_enum,
	source.family_role,
	source.is_baptized,
	source.baptized_location,
	ms.id,
	f.id
FROM (
	VALUES
		('Daniel', 'Luis', 'Gomez', 'Perez', '125 Elm St', DATE '1994-03-14', 'M', '555-0142', 'daniel.gomez@example.com', 'Single', 'son', true, 'Main Campus', 'active', 'Gomez Family'),
		('Mariana', NULL, 'Lopez', 'Ramos', '48 Pine Ave', DATE '1988-11-30', 'F', '555-0187', 'mariana.lopez@example.com', 'Married', 'mother', true, 'North Branch', 'active', 'Lopez Family'),
		('Samuel', 'Joel', 'Ortiz', NULL, '91 Lake Rd', DATE '2001-07-06', 'M', NULL, 'samuel.ortiz@example.com', 'Single', 'member', false, NULL, 'active', 'Ortiz Family'),
		('Elena', 'Maria', 'Vega', 'Santos', '17 River Blvd', DATE '1979-01-22', 'F', '555-0199', 'elena.vega@example.com', 'Married', 'head', true, 'Central Church', 'inactive', 'Vega Family'),
		('Camila', NULL, 'Rivera', 'Diaz', '312 Oak Drive', DATE '1999-09-10', 'F', '555-0104', 'camila.rivera@example.com', 'Single', 'member', true, 'Main Campus', 'active', 'Rivera Family')
) AS source(
	name,
	middle_name,
	last_name_parental,
	last_name_maternal,
	address,
	birth_date,
	gender,
	phone,
	email,
	marital_status,
	family_role,
	is_baptized,
	baptized_location,
	member_status_name,
	family_name
)
JOIN member_status ms ON ms.name = source.member_status_name
JOIN family f ON f.name = source.family_name
WHERE NOT EXISTS (
	SELECT 1 FROM member m WHERE m.email = source.email
);

-- Small Groups
INSERT INTO small_group (
	name,
	description,
	meeting_day,
	meeting_time,
	location,
	status
)
VALUES
	('Northside Young Adults', 'Weekly group for university students and early-career adults.', 'Friday', '19:00', 'Room B-2', 'active'),
	('City Families Circle', 'Family-focused discipleship and prayer community.', 'Sunday', '17:30', 'Main Campus - Family Hall', 'active'),
	('Downtown Discipleship', 'Midweek discipleship group for new believers.', 'Wednesday', '18:30', 'Avenida Central 241', 'paused'),
	('Prayer Watch', 'Weekly intercession and prayer watch for the congregation.', 'Tuesday', '20:00', 'Prayer Room', 'active')
ON CONFLICT (name) DO NOTHING;

INSERT INTO small_group_tag (name, color)
VALUES
	('youth', '#7c5cff'),
	('families', '#2f9e7a'),
	('discipleship', '#4f86d9'),
	('prayer', '#e08a2e'),
	('community', '#d96b5f')
ON CONFLICT (name) DO NOTHING;

INSERT INTO small_group_tag_map (small_group_id, tag_id)
SELECT sg.id, sgt.id
FROM (
	VALUES
		('Northside Young Adults', 'youth'),
		('Northside Young Adults', 'discipleship'),
		('City Families Circle', 'families'),
		('City Families Circle', 'community'),
		('Downtown Discipleship', 'discipleship'),
		('Prayer Watch', 'prayer')
) AS source(group_name, tag_name)
JOIN small_group sg ON sg.name = source.group_name
JOIN small_group_tag sgt ON sgt.name = source.tag_name
ON CONFLICT (small_group_id, tag_id) DO NOTHING;

INSERT INTO group_membership (member_id, small_group_id, role)
SELECT m.id, sg.id, source.role::group_membership_status_enum
FROM (
	VALUES
		('daniel.gomez@example.com', 'Northside Young Adults', 'leader'),
		('samuel.ortiz@example.com', 'Northside Young Adults', 'member'),
		('mariana.lopez@example.com', 'City Families Circle', 'leader'),
		('camila.rivera@example.com', 'City Families Circle', 'member'),
		('elena.vega@example.com', 'Prayer Watch', 'leader'),
		('samuel.ortiz@example.com', 'Downtown Discipleship', 'member')
) AS source(member_email, group_name, role)
JOIN member m ON m.email = source.member_email
JOIN small_group sg ON sg.name = source.group_name
WHERE NOT EXISTS (
	SELECT 1
	FROM group_membership gm
	WHERE gm.member_id = m.id
	  AND gm.small_group_id = sg.id
);

-- Event tags
INSERT INTO event_tag (name, color)
VALUES
	('church', '#4f86d9'),
	('youth', '#7c5cff'),
	('prayer', '#2f9e7a'),
	('outreach', '#e08a2e')
ON CONFLICT (name) DO NOTHING;

-- Event series
INSERT INTO event_series (
	name,
	description,
	attendance_type,
	recurrence_type,
	recurrence_rule,
	status,
	location,
	start_time,
	end_time
)
VALUES
	('Sunday Service', 'Main weekly service for the whole community.', 'individual', 'weekly', 'Weekly on Sunday', 'active', 'Main Auditorium', '10:00', '11:45'),
	('Youth Bible Study', 'Weekly youth discipleship session.', 'individual', 'weekly', 'Weekly on Friday', 'active', 'Room B-12', '19:00', '20:30'),
	('Leaders Prayer', 'Biweekly prayer and alignment for leaders.', 'general', 'weekly', 'Biweekly on Wednesday', 'paused', 'Prayer Hall', '06:30', '07:15'),
	('Community Outreach', 'Monthly local outreach activity.', 'general', 'monthly', 'Monthly on 2nd Saturday', 'active', 'City Center', '09:00', '12:00')
ON CONFLICT (name) DO NOTHING;

-- Series-tag mappings
INSERT INTO event_series_tag_map (event_series_id, event_tag_id)
SELECT es.id, et.id
FROM (
	VALUES
		('Sunday Service', 'church'),
		('Youth Bible Study', 'church'),
		('Youth Bible Study', 'youth'),
		('Leaders Prayer', 'prayer'),
		('Community Outreach', 'outreach')
) AS source(series_name, tag_name)
JOIN event_series es ON es.name = source.series_name
JOIN event_tag et ON et.name = source.tag_name
ON CONFLICT (event_series_id, event_tag_id) DO NOTHING;

-- Event instances (for calendar testing)
INSERT INTO event_instance (
	start_datetime,
	end_datetime,
	event_series_id,
	attendee_count,
	location,
	attendance_notes
)
SELECT
	source.start_datetime,
	source.end_datetime,
	es.id,
	source.attendee_count,
	source.location,
	source.attendance_notes
FROM (
	VALUES
		(TIMESTAMP '2026-04-27 10:00:00', TIMESTAMP '2026-04-27 11:45:00', 'Sunday Service', 185, 'Main Auditorium', 'Regular Sunday gathering'),
		(TIMESTAMP '2026-04-25 19:00:00', TIMESTAMP '2026-04-25 20:30:00', 'Youth Bible Study', 24, 'Room B-12', 'Focus on Romans 8'),
		(TIMESTAMP '2026-04-23 06:30:00', TIMESTAMP '2026-04-23 07:15:00', 'Leaders Prayer', 11, 'Prayer Hall', 'Leadership prayer coverage'),
		(TIMESTAMP '2026-05-09 09:00:00', TIMESTAMP '2026-05-09 12:00:00', 'Community Outreach', 42, 'City Center', 'Neighborhood service day')
) AS source(start_datetime, end_datetime, series_name, attendee_count, location, attendance_notes)
JOIN event_series es ON es.name = source.series_name
WHERE NOT EXISTS (
	SELECT 1
	FROM event_instance ei
	WHERE ei.event_series_id = es.id
	  AND ei.start_datetime = source.start_datetime
	  AND ei.end_datetime = source.end_datetime
);
