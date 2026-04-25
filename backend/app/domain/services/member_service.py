"""Domain service for member management use cases."""
from dataclasses import dataclass

from app.domain.entities.member import Member
from app.ports.output.member_repository_port import MemberRepositoryPort


class MemberNotFoundException(ValueError):
    pass


@dataclass
class MemberService:
    member_repo: MemberRepositoryPort

    def count_members(self) -> int:
        return self.member_repo.count()

    def list_members(self, limit: int = 100, offset: int = 0) -> list[Member]:
        return self.member_repo.list(limit=limit, offset=offset)

    def get_member(self, member_id: int) -> Member:
        member = self.member_repo.get_by_id(member_id)
        if member is None:
            raise MemberNotFoundException(f"Member with id {member_id} was not found.")
        return member

    def create_member(self, member: Member) -> int:
        return self.member_repo.create(member)

    def update_member(self, member: Member) -> None:
        updated = self.member_repo.update(member)
        if not updated:
            raise MemberNotFoundException(f"Member with id {member.id} was not found.")

    def delete_member(self, member_id: int) -> None:
        deleted = self.member_repo.delete(member_id)
        if not deleted:
            raise MemberNotFoundException(f"Member with id {member_id} was not found.")