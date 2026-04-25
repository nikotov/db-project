"""HTTP schemas for catalog entities: Family, MemberStatus."""
from pydantic import BaseModel, ConfigDict, Field


class FamilyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=45)


class FamilyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class MemberStatusCreate(BaseModel):
    name: str = Field(min_length=1, max_length=45)


class MemberStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
