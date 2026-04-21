-- Development seed data for baseline lookup tables.

INSERT INTO final.member_status (name)
VALUES ('active'), ('inactive')
ON CONFLICT DO NOTHING;

INSERT INTO final.family (name)
VALUES ('Sample Family')
ON CONFLICT DO NOTHING;
