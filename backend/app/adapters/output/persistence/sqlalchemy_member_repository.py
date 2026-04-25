"""SQLAlchemy member repository adapter."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.adapters.output.persistence.models import Member as MemberModel
from app.adapters.output.persistence.models import GenderEnum, MaritalStatusEnum
from app.domain.entities.member import Member
from app.domain.enums import Gender, MaritalStatus
from app.ports.output.member_repository_port import MemberRepositoryPort


class SQLAlchemyMemberRepository(MemberRepositoryPort):
    """Persists member aggregates through SQLAlchemy."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def count(self) -> int:
        statement = select(func.count()).select_from(MemberModel)
        return int(self._db.execute(statement).scalar_one())

    def list(self, limit: int = 100, offset: int = 0) -> list[Member]:
        statement = (
            select(MemberModel)
            .order_by(MemberModel.id.asc())
            .offset(offset)
            .limit(limit)
        )
        rows = self._db.execute(statement).scalars().all()
        return [self._to_domain(row) for row in rows]

    def get_by_id(self, member_id: int) -> Member | None:
        row = self._db.get(MemberModel, member_id)
        if row is None:
            return None
        return self._to_domain(row)

    def create(self, member: Member) -> int:
        row = MemberModel(
            name=member.name,
            middle_name=member.middle_name,
            last_name_parental=member.last_name_parental,
            last_name_maternal=member.last_name_maternal,
            address=member.address,
            birth_date=member.birth_date,
            gender=GenderEnum(member.gender.value),
            phone=member.phone,
            email=member.email,
            created_at=member.created_at,
            updated_at=member.updated_at,
            marital_status=(
                MaritalStatusEnum(member.marital_status.value)
                if member.marital_status is not None
                else None
            ),
            family_role=member.family_role,
            is_baptized=member.is_baptized,
            baptized_location=member.baptized_location,
            member_status_id=member.member_status_id,
            family_id=member.family_id,
        )
        self._db.add(row)
        self._db.flush()
        self._db.commit()
        self._db.refresh(row)
        return row.id

    def update(self, member: Member) -> bool:
        row = self._db.get(MemberModel, member.id)
        if row is None:
            return False

        row.name = member.name
        row.middle_name = member.middle_name
        row.last_name_parental = member.last_name_parental
        row.last_name_maternal = member.last_name_maternal
        row.address = member.address
        row.birth_date = member.birth_date
        row.gender = GenderEnum(member.gender.value)
        row.phone = member.phone
        row.email = member.email
        row.updated_at = member.updated_at
        row.marital_status = (
            MaritalStatusEnum(member.marital_status.value)
            if member.marital_status is not None
            else None
        )
        row.family_role = member.family_role
        row.is_baptized = member.is_baptized
        row.baptized_location = member.baptized_location
        row.member_status_id = member.member_status_id
        row.family_id = member.family_id

        self._db.commit()
        return True

    def delete(self, member_id: int) -> bool:
        row = self._db.get(MemberModel, member_id)
        if row is None:
            return False

        self._db.delete(row)
        self._db.commit()
        return True

    @staticmethod
    def _to_domain(row: MemberModel) -> Member:
        return Member(
            id=row.id,
            name=row.name,
            middle_name=row.middle_name,
            last_name_parental=row.last_name_parental,
            last_name_maternal=row.last_name_maternal,
            address=row.address,
            birth_date=row.birth_date,
            gender=Gender(row.gender.value),
            phone=row.phone,
            email=row.email,
            created_at=row.created_at,
            updated_at=row.updated_at,
            marital_status=MaritalStatus(row.marital_status.value) if row.marital_status is not None else None,
            family_role=row.family_role,
            is_baptized=row.is_baptized,
            baptized_location=row.baptized_location,
            member_status_id=row.member_status_id,
            family_id=row.family_id,
        )