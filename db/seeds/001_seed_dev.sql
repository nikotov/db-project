-- Development seed data for baseline lookup tables.

INSERT INTO member_status (name)
VALUES ('active'), ('inactive')
ON CONFLICT (name) DO NOTHING;

INSERT INTO family (name)
VALUES ('Sample Family')
ON CONFLICT DO NOTHING;

INSERT INTO user_account (username, password_hash, role, created_at, last_login)
VALUES (
	'admin',
	'pbkdf2_sha256$200000$TkQrot18VJBFl8sY4rLAFb67T6OEoxkLaHWNS57MunwVCb5hihjZ7vQ7iSxaDCCe',
	'admin',
	NOW(),
	NULL
)
ON CONFLICT (username) DO NOTHING;
