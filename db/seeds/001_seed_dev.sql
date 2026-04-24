-- Development seed data for baseline lookup tables.

INSERT INTO final.member_status (name)
VALUES ('active'), ('inactive')
ON CONFLICT DO NOTHING;

INSERT INTO final.family (name)
VALUES ('Sample Family')
ON CONFLICT DO NOTHING;

INSERT INTO final.user_account (username, password_hash, created_at, last_login)
VALUES (
	'admin',
	'pbkdf2_sha256$200000$2HjThhFU6syzmHvintRxn4Vlm55zEOBtLhGjHb+8u9c8cBVoDpGUGoy14qa90+Pb',
	NOW(),
	NULL
)
ON CONFLICT (username) DO NOTHING;
