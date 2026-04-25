from abc import ABC, abstractmethod

from app.domain.entities.member import Member


class MemberRepositoryPort(ABC):
    @abstractmethod
    def count(self) -> int: ...

    @abstractmethod
    def list(self, limit: int = 100, offset: int = 0) -> list[Member]: ...

    @abstractmethod
    def get_by_id(self, member_id: int) -> Member | None: ...

    @abstractmethod
    def create(self, member: Member) -> int: ...

    @abstractmethod
    def update(self, member: Member) -> bool: ...

    @abstractmethod
    def delete(self, member_id: int) -> bool: ...