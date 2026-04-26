"""Add user role and baseline seed rows.

Revision ID: 0002_user_role_and_baseline_seed
Revises: 0001_initial_schema
Create Date: 2026-04-25
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0002_user_role_and_baseline_seed"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE user_account
        ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member';

        UPDATE user_account
        SET role = 'admin'
        WHERE username = 'admin';

        INSERT INTO member_status (name)
        VALUES ('active'), ('inactive')
        ON CONFLICT (name) DO NOTHING;

        INSERT INTO family (name)
        SELECT 'Sample Family'
        WHERE NOT EXISTS (SELECT 1 FROM family WHERE name = 'Sample Family');

        INSERT INTO user_account (username, password_hash, role, created_at, last_login)
        VALUES (
            'admin',
            'pbkdf2_sha256$200000$TkQrot18VJBFl8sY4rLAFb67T6OEoxkLaHWNS57MunwVCb5hihjZ7vQ7iSxaDCCe',
            'admin',
            NOW(),
            NULL
        )
        ON CONFLICT (username) DO NOTHING;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM user_account WHERE username = 'admin';
        DELETE FROM family WHERE name = 'Sample Family';
        DELETE FROM member_status WHERE name IN ('active', 'inactive');
        ALTER TABLE user_account DROP COLUMN IF EXISTS role;
        """
    )
