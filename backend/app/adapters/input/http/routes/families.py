"""HTTP routes for family catalog."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import get_current_user
from app.adapters.input.http.schemas.catalog import FamilyCreate, FamilyResponse
from app.adapters.output.persistence.models import Family
from app.database import get_db

router = APIRouter(prefix="/families", tags=["families"])


@router.get("", response_model=list[FamilyResponse])
def list_families(db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    return db.query(Family).order_by(Family.id).all()


@router.post("", response_model=FamilyResponse, status_code=status.HTTP_201_CREATED)
def create_family(payload: FamilyCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    family = Family(name=payload.name)
    db.add(family)
    db.commit()
    db.refresh(family)
    return family


@router.get("/{family_id}", response_model=FamilyResponse)
def get_family(family_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    family = db.get(Family, family_id)
    if not family:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")
    return family


@router.put("/{family_id}", response_model=FamilyResponse)
def update_family(family_id: int, payload: FamilyCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    family = db.get(Family, family_id)
    if not family:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")
    family.name = payload.name
    db.commit()
    db.refresh(family)
    return family


@router.delete("/{family_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_family(family_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    family = db.get(Family, family_id)
    if not family:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")
    db.delete(family)
    db.commit()
