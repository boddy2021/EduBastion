from sqlalchemy.orm import Session
from ..Database import models_db
from ..Models import user_models
from .. import security
import re


def validate_password(password: str):
    if len(password) < 8:
        return "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", password):
        return "Password must contain at least one digit"
    if not re.search(r"[^A-Za-z0-9]", password):
        return "Password must contain at least one special character"
    return None


def get_user_by_username(db: Session, username: str):
    return db.query(models_db.User).filter(models_db.User.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models_db.User).filter(models_db.User.email == email).first()


def get_user(db: Session, user_id: int):
    return db.query(models_db.User).filter(models_db.User.id == user_id).first()


def create_user(db: Session, user: user_models.UserCreate):

    password_error = validate_password(user.password)
    if password_error:
        raise ValueError(password_error)

    db_user_email = get_user_by_email(db, email=user.email)
    if db_user_email:
        raise ValueError("Email already registered")

    db_user_username = get_user_by_username(db, username=user.username)
    if db_user_username:
        raise ValueError("Username already taken")

    db_user = models_db.User(
        username=user.username,
        email=user.email,
        hashed_password=security.get_password_hash(user.password),
        role=user.role
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def get_profile(db: Session, user_id: int):
    return db.query(models_db.UserProfile).filter(models_db.UserProfile.id == user_id).first()


def create_profile(db: Session, user_id: int, profile: user_models.ProfileCreate):

    db_user = get_user(db, user_id)
    if not db_user:
        raise ValueError("User not found")

    db_profile = get_profile(db, user_id)
    if db_profile:
        raise ValueError("Profile already exists for this user")

    db_profile = models_db.UserProfile(
        **profile.model_dump(),
        id=user_id
    )

    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)

    return db_profile


def update_profile(db: Session, user_id: int, profile_data: user_models.ProfileCreate):
    db_profile = get_profile(db, user_id)
    if not db_profile:
        raise ValueError("Profile not found")

    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(db_profile, key, value)

    db.commit()
    db.refresh(db_profile)
    return db_profile
