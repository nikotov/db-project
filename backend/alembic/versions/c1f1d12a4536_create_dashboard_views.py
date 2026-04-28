"""create_dashboard_views"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c1f1d12a4536'
down_revision = 'e203f8d6d0a0'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Total members
    op.execute("""
        CREATE OR REPLACE VIEW v_total_members AS
        SELECT COUNT(*) AS total FROM member;
    """)

    # 2. Total families
    op.execute("""
        CREATE OR REPLACE VIEW v_total_families AS
        SELECT COUNT(*) AS total FROM family;
    """)

    # 3. Active small groups
    op.execute("""
        CREATE OR REPLACE VIEW v_active_small_groups AS
        SELECT COUNT(*) AS total
        FROM small_group
        WHERE status = 'active';
    """)

    # 4. Upcoming events
    op.execute("""
        CREATE OR REPLACE VIEW v_upcoming_events AS
        SELECT COUNT(*) AS total
        FROM event_instance
        WHERE start_datetime > NOW();
    """)

    # 5. Recent attendance (Sunday service + last week small groups)
    op.execute("""
        CREATE OR REPLACE VIEW v_recent_attendance AS
        WITH
        last_sunday_service AS (
            SELECT ei.id, ei.start_datetime
            FROM event_instance ei
            JOIN event_series es ON ei.event_series_id = es.id
            WHERE EXTRACT(DOW FROM ei.start_datetime) = 0
              AND es.attendance_type = 'general'
            ORDER BY ei.start_datetime DESC
            LIMIT 1
        ),
        sunday_attendance AS (
            SELECT COUNT(*) AS attended_count
            FROM last_sunday_service lss
            JOIN event_member_attendance ema ON ema.event_instance_id = lss.id
            WHERE ema.attendance_status = 'attended'
        ),
        last_week_small_group_events AS (
            SELECT ei.id
            FROM event_instance ei
            JOIN event_series es ON ei.event_series_id = es.id
            LEFT JOIN event_series_tag_map estm ON estm.event_series_id = es.id
            LEFT JOIN event_tag et ON et.id = estm.event_tag_id
            WHERE ei.start_datetime >= NOW() - INTERVAL '7 days'
              AND (et.name = 'small-group' OR et.name ILIKE '%small group%')
        ),
        small_group_attendance AS (
            SELECT COUNT(*) AS attended_count
            FROM last_week_small_group_events lwsge
            JOIN event_member_attendance ema ON ema.event_instance_id = lwsge.id
            WHERE ema.attendance_status = 'attended'
        )
        SELECT
            COALESCE((SELECT attended_count FROM sunday_attendance), 0) AS last_sunday_service_attendance,
            COALESCE((SELECT attended_count FROM small_group_attendance), 0) AS last_week_small_group_attendance;
    """)

def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS v_total_members;")
    op.execute("DROP VIEW IF EXISTS v_total_families;")
    op.execute("DROP VIEW IF EXISTS v_active_small_groups;")
    op.execute("DROP VIEW IF EXISTS v_upcoming_events;")
    op.execute("DROP VIEW IF EXISTS v_recent_attendance;")