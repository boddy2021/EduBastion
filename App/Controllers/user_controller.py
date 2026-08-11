from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..Models import user_models
from ..Services import user_service as us
from .. import security
from typing import List

from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = us.get_user_by_email(db, email=login_data.email)

    if not user:
        raise HTTPException(
            status_code=400, detail="Incorrect email or password")

    if not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=400, detail="Incorrect email or password")

    role_value = user.role.value if hasattr(user.role, "value") else user.role

    access_token = security.create_access_token({
        "sub": str(user.id),
        "user_id": user.id,
        "role": role_value,
    })

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "user_id": user.id,
        "role": role_value,
        "email": user.email
    }


@router.post("/", response_model=user_models.UserRead)
async def create_new_user(
    user_data: user_models.UserCreate,
    db: Session = Depends(get_db)
):
    try:
        new_user = us.create_user(db=db, user=user_data)
        return new_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}")


@router.get("/{user_id}", response_model=user_models.UserRead)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    db_user = us.get_user(db=db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.post("/{user_id}/profile", response_model=user_models.ProfileRead)
async def create_user_profile(
    user_id: int,
    profile_data: user_models.ProfileCreate,
    db: Session = Depends(get_db)
):
    try:
        new_profile = us.create_profile(
            db=db, user_id=user_id, profile=profile_data)
        return new_profile
    except ValueError as e:
        error_detail = str(e)
        if "User not found" in error_detail:
            raise HTTPException(status_code=404, detail=error_detail)
        else:
            raise HTTPException(status_code=400, detail=error_detail)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}")


@router.get("/{user_id}/profile", response_model=user_models.ProfileRead)
async def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    db_profile = us.get_profile(db=db, user_id=user_id)
    if db_profile is None:
        raise HTTPException(
            status_code=404, detail="Profile not found for this user")
    return db_profile


@router.get("/{user_id}/has_profile")
async def check_user_has_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    profile = us.get_profile(db=db, user_id=user_id)

    if profile:
        return {"has_profile": True}
    else:
        return {"has_profile": False}


@router.put("/{user_id}/profile", response_model=user_models.ProfileRead)
async def update_user_profile(
    user_id: int,
    profile_data: user_models.ProfileCreate,
    db: Session = Depends(get_db)
):
    try:
        updated_profile = us.update_profile(
            db=db, user_id=user_id, profile_data=profile_data)
        return updated_profile
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update profile: {e}")
