import enum
from datetime import date, datetime, time
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Time
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class EventAttendanceTypeEnum(enum.Enum):
    general = "general"
    individual = "individual"


class MemberAttendanceStatusEnum(enum.Enum):
    attended = "attended"
    absent = "absent"
    late = "late"
    excused = "excused"
    unknown = "unknown"


class DayOfWeekEnum(enum.Enum):
    Monday = "Monday"
    Tuesday = "Tuesday"
    Wednesday = "Wednesday"
    Thursday = "Thursday"
    Friday = "Friday"
    Saturday = "Saturday"
    Sunday = "Sunday"


class GroupMembershipStatusEnum(enum.Enum):
    leader = "leader"
    member = "member"
    unknown = "unknown"


class GenderEnum(enum.Enum):
    M = "M"
    F = "F"
    Other = "Other"


class MaritalStatusEnum(enum.Enum):
    Single = "Single"
    Married = "Married"
    Divorced = "Divorced"
    Widowed = "Widowed"


class RecurrenceTypeEnum(enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"
    none = "none"

class EventSeriesStatusEnum(enum.Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    cancelled = "cancelled"
    completed = "completed"


class EventSeries(Base):
    __tablename__ = "event_series"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(45), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    attendance_type: Mapped[EventAttendanceTypeEnum] = mapped_column(Enum(EventAttendanceTypeEnum), nullable=False)
    recurrence_type: Mapped[RecurrenceTypeEnum] = mapped_column(Enum(RecurrenceTypeEnum), nullable=False, default=RecurrenceTypeEnum.none)
    recurrence_rule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[EventSeriesStatusEnum] = mapped_column(
        Enum(EventSeriesStatusEnum),
        nullable=False,
        default=EventSeriesStatusEnum.active,
    )
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now(), nullable=True)

    instances: Mapped[list["EventInstance"]] = relationship(back_populates="series", lazy="selectin")
    tags: Mapped[list["EventSeriesTagMap"]] = relationship(back_populates="event_series", lazy="selectin")


class EventInstance(Base):
    __tablename__ = "event_instance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    attendee_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    event_series_id: Mapped[int] = mapped_column(Integer, ForeignKey("event_series.id"), nullable=False)

    series: Mapped["EventSeries"] = relationship(back_populates="instances", lazy="joined")
    group_counts: Mapped[list["EventInstanceGroupCount"]] = relationship(back_populates="event_instance", lazy="selectin")
    member_attendance: Mapped[list["EventMemberAttendance"]] = relationship(back_populates="event_instance", lazy="selectin")


class EventTag(Base):
    __tablename__ = "event_tag"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(45), nullable=False, unique=True)
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)

    series: Mapped[list["EventSeriesTagMap"]] = relationship(back_populates="event_tag", lazy="selectin")


class EventSeriesTagMap(Base):
    __tablename__ = "event_series_tag_map"

    event_series_id: Mapped[int] = mapped_column(Integer, ForeignKey("event_series.id"), nullable=False, primary_key=True)
    event_tag_id: Mapped[int] = mapped_column(Integer, ForeignKey("event_tag.id"), nullable=False, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now(), nullable=True)

    event_series: Mapped["EventSeries"] = relationship(back_populates="tags", lazy="joined")
    event_tag: Mapped["EventTag"] = relationship(back_populates="series", lazy="joined")


class AttendanceGroup(Base):
    __tablename__ = "attendance_group"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(45), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    event_counts: Mapped[list["EventInstanceGroupCount"]] = relationship(back_populates="attendance_group", lazy="selectin")


class EventInstanceGroupCount(Base):
    __tablename__ = "event_instance_group_count"

    event_instance_id: Mapped[int] = mapped_column(Integer, ForeignKey("event_instance.id"), nullable=False, primary_key=True)
    attendance_group_id: Mapped[int] = mapped_column(Integer, ForeignKey("attendance_group.id"), nullable=False, primary_key=True)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    event_instance: Mapped["EventInstance"] = relationship(back_populates="group_counts", lazy="joined")
    attendance_group: Mapped["AttendanceGroup"] = relationship(back_populates="event_counts", lazy="joined")


class EventMemberAttendance(Base):
    __tablename__ = "event_member_attendance"

    event_instance_id: Mapped[int] = mapped_column(Integer, ForeignKey("event_instance.id"), nullable=False, primary_key=True)
    member_id: Mapped[int] = mapped_column(Integer, ForeignKey("member.id"), nullable=False, primary_key=True)
    status: Mapped[MemberAttendanceStatusEnum] = mapped_column(
        Enum(MemberAttendanceStatusEnum),
        nullable=False,
        default=MemberAttendanceStatusEnum.unknown,
    )

    event_instance: Mapped["EventInstance"] = relationship(back_populates="member_attendance", lazy="joined")
    member: Mapped["Member"] = relationship(lazy="joined")


class SmallGroup(Base):
    __tablename__ = "small_group"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(45), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meeting_day: Mapped[DayOfWeekEnum] = mapped_column(Enum(DayOfWeekEnum), nullable=False)
    meeting_time: Mapped[time] = mapped_column(Time, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now(), nullable=True)

    memberships: Mapped[list["GroupMembership"]] = relationship(back_populates="small_group", lazy="selectin")
    tags: Mapped[list["SmallGroupTagMap"]] = relationship(back_populates="small_group", lazy="selectin")


class SmallGroupTag(Base):
    __tablename__ = "small_group_tag"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(45), nullable=False, unique=True)
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)

    group_tags: Mapped[list["SmallGroupTagMap"]] = relationship(back_populates="tag", lazy="selectin")


class SmallGroupTagMap(Base):
    __tablename__ = "small_group_tag_map"

    small_group_id: Mapped[int] = mapped_column(Integer, ForeignKey("small_group.id"), nullable=False, primary_key=True)
    tag_id: Mapped[int] = mapped_column(Integer, ForeignKey("small_group_tag.id"), nullable=False, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now(), nullable=True)

    small_group: Mapped["SmallGroup"] = relationship(back_populates="tags", lazy="joined")
    tag: Mapped["SmallGroupTag"] = relationship(back_populates="group_tags", lazy="joined")


class GroupMembership(Base):
    __tablename__ = "group_membership"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    member_id: Mapped[int] = mapped_column(Integer, ForeignKey("member.id"), nullable=False)
    small_group_id: Mapped[int] = mapped_column(Integer, ForeignKey("small_group.id"), nullable=False)
    role: Mapped[GroupMembershipStatusEnum] = mapped_column(
        Enum(GroupMembershipStatusEnum),
        nullable=False,
        default=GroupMembershipStatusEnum.unknown,
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    left_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    member: Mapped["Member"] = relationship(lazy="joined")
    small_group: Mapped["SmallGroup"] = relationship(back_populates="memberships", lazy="joined")


class Member(Base):
    __tablename__ = "member"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(45), nullable=False)
    middle_name: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    last_name_parental: Mapped[str] = mapped_column(String(45), nullable=False)
    last_name_maternal: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[GenderEnum] = mapped_column(Enum(GenderEnum), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now(), nullable=True)

    marital_status: Mapped[Optional[MaritalStatusEnum]] = mapped_column(Enum(MaritalStatusEnum), nullable=True)
    family_role: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)

    is_baptized: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    baptized_location: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)

    member_status_id: Mapped[int] = mapped_column(Integer, ForeignKey("member_status.id"), nullable=False)
    family_id: Mapped[int] = mapped_column(Integer, ForeignKey("family.id"), nullable=False)

    member_status: Mapped["MemberStatus"] = relationship(back_populates="members", lazy="joined")
    family: Mapped["Family"] = relationship(back_populates="members", lazy="joined")


class MemberStatus(Base):
    __tablename__ = "member_status"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(45), nullable=False, unique=True)

    members: Mapped[list["Member"]] = relationship(back_populates="member_status", lazy="selectin")


class Family(Base):
    __tablename__ = "family"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(45), nullable=False)

    members: Mapped[list["Member"]] = relationship(back_populates="family", lazy="selectin")


class UserAccount(Base):
    __tablename__ = "user_account"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(45), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    logs: Mapped[list["UserLogs"]] = relationship(back_populates="user", lazy="selectin")


class UserLogs(Base):
    __tablename__ = "user_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user_account.id"), nullable=False)
    action_type: Mapped[str] = mapped_column(String(45), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["UserAccount"] = relationship(back_populates="logs", lazy="joined")
