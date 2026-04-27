"""add_cascade_delete_constraints

Revision ID: e203f8d6d0a0
Revises: 0002_user_role_and_baseline_seed
Create Date: 2024-xx-xx xx:xx:xx.xxxxxx

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'e203f8d6d0a0'
down_revision = '0002_user_role_and_baseline_seed'
branch_labels = None
depends_on = None

def get_constraint_name(table_name, referred_table, columns):
    """Helper function to get the actual constraint name"""
    conn = op.get_bind()
    inspector = inspect(conn)
    fks = inspector.get_foreign_keys(table_name)
    
    for fk in fks:
        if fk['referred_table'] == referred_table and set(fk['constrained_columns']) == set(columns):
            return fk['name']
    return None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # 1. EventInstance - cascade delete when EventSeries is deleted
    constraint_name = get_constraint_name('event_instance', 'event_series', ['event_series_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_instance', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_instance', 'event_series',
            ['event_series_id'], ['id'], ondelete='CASCADE'
        )
    
    # 2. EventSeriesTagMap - cascade delete from both sides
    # Foreign key to event_series
    constraint_name = get_constraint_name('event_series_tag_map', 'event_series', ['event_series_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_series_tag_map', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_series_tag_map', 'event_series',
            ['event_series_id'], ['id'], ondelete='CASCADE'
        )
    
    # Foreign key to event_tag
    constraint_name = get_constraint_name('event_series_tag_map', 'event_tag', ['event_tag_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_series_tag_map', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_series_tag_map', 'event_tag',
            ['event_tag_id'], ['id'], ondelete='CASCADE'
        )
    
    # 3. EventInstanceGroupCount - cascade delete from both sides
    # Foreign key to event_instance
    constraint_name = get_constraint_name('event_instance_group_count', 'event_instance', ['event_instance_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_instance_group_count', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_instance_group_count', 'event_instance',
            ['event_instance_id'], ['id'], ondelete='CASCADE'
        )
    
    # Foreign key to attendance_group
    constraint_name = get_constraint_name('event_instance_group_count', 'attendance_group', ['attendance_group_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_instance_group_count', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_instance_group_count', 'attendance_group',
            ['attendance_group_id'], ['id'], ondelete='CASCADE'
        )
    
    # 4. EventMemberAttendance - cascade delete from both sides
    # Foreign key to event_instance
    constraint_name = get_constraint_name('event_member_attendance', 'event_instance', ['event_instance_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_member_attendance', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_member_attendance', 'event_instance',
            ['event_instance_id'], ['id'], ondelete='CASCADE'
        )
    
    # Foreign key to member
    constraint_name = get_constraint_name('event_member_attendance', 'member', ['member_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_member_attendance', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_member_attendance', 'member',
            ['member_id'], ['id'], ondelete='CASCADE'
        )
    
    # 5. SmallGroupTagMap - cascade delete from both sides
    # Foreign key to small_group
    constraint_name = get_constraint_name('small_group_tag_map', 'small_group', ['small_group_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'small_group_tag_map', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'small_group_tag_map', 'small_group',
            ['small_group_id'], ['id'], ondelete='CASCADE'
        )
    
    # Foreign key to small_group_tag
    constraint_name = get_constraint_name('small_group_tag_map', 'small_group_tag', ['tag_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'small_group_tag_map', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'small_group_tag_map', 'small_group_tag',
            ['tag_id'], ['id'], ondelete='CASCADE'
        )
    
    # 6. GroupMembership - cascade delete from both sides
    # Foreign key to member
    constraint_name = get_constraint_name('group_membership', 'member', ['member_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'group_membership', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'group_membership', 'member',
            ['member_id'], ['id'], ondelete='CASCADE'
        )
    
    # Foreign key to small_group
    constraint_name = get_constraint_name('group_membership', 'small_group', ['small_group_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'group_membership', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'group_membership', 'small_group',
            ['small_group_id'], ['id'], ondelete='CASCADE'
        )
    
    # 7. UserLogs - cascade delete when UserAccount is deleted
    constraint_name = get_constraint_name('user_logs', 'user_account', ['user_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'user_logs', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'user_logs', 'user_account',
            ['user_id'], ['id'], ondelete='CASCADE'
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Revert EventInstance
    constraint_name = get_constraint_name('event_instance', 'event_series', ['event_series_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_instance', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_instance', 'event_series',
            ['event_series_id'], ['id']
        )
    
    # Revert EventSeriesTagMap
    constraint_name = get_constraint_name('event_series_tag_map', 'event_series', ['event_series_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_series_tag_map', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_series_tag_map', 'event_series',
            ['event_series_id'], ['id']
        )
    
    constraint_name = get_constraint_name('event_series_tag_map', 'event_tag', ['event_tag_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_series_tag_map', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_series_tag_map', 'event_tag',
            ['event_tag_id'], ['id']
        )
    
    # Revert EventInstanceGroupCount
    constraint_name = get_constraint_name('event_instance_group_count', 'event_instance', ['event_instance_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_instance_group_count', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_instance_group_count', 'event_instance',
            ['event_instance_id'], ['id']
        )
    
    constraint_name = get_constraint_name('event_instance_group_count', 'attendance_group', ['attendance_group_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_instance_group_count', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_instance_group_count', 'attendance_group',
            ['attendance_group_id'], ['id']
        )
    
    # Revert EventMemberAttendance
    constraint_name = get_constraint_name('event_member_attendance', 'event_instance', ['event_instance_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_member_attendance', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_member_attendance', 'event_instance',
            ['event_instance_id'], ['id']
        )
    
    constraint_name = get_constraint_name('event_member_attendance', 'member', ['member_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'event_member_attendance', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'event_member_attendance', 'member',
            ['member_id'], ['id']
        )
    
    # Revert SmallGroupTagMap
    constraint_name = get_constraint_name('small_group_tag_map', 'small_group', ['small_group_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'small_group_tag_map', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'small_group_tag_map', 'small_group',
            ['small_group_id'], ['id']
        )
    
    constraint_name = get_constraint_name('small_group_tag_map', 'small_group_tag', ['tag_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'small_group_tag_map', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'small_group_tag_map', 'small_group_tag',
            ['tag_id'], ['id']
        )
    
    # Revert GroupMembership
    constraint_name = get_constraint_name('group_membership', 'member', ['member_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'group_membership', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'group_membership', 'member',
            ['member_id'], ['id']
        )
    
    constraint_name = get_constraint_name('group_membership', 'small_group', ['small_group_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'group_membership', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'group_membership', 'small_group',
            ['small_group_id'], ['id']
        )
    
    # Revert UserLogs
    constraint_name = get_constraint_name('user_logs', 'user_account', ['user_id'])
    if constraint_name:
        op.drop_constraint(constraint_name, 'user_logs', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'user_logs', 'user_account',
            ['user_id'], ['id']
        )