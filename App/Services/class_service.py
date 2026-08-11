from sqlalchemy.orm import Session
from ..Database import models_db
from ..Models import class_models
import random
import string


def generate_join_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def create_class(db: Session, class_data: class_models.ClassCreate):
    new_code = generate_join_code()
    db_class = models_db.Class(
        name=class_data.name,
        professor_id=class_data.professor_id,
        join_code=new_code
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class


def get_class_by_id(db: Session, class_id: int):
    return db.query(models_db.Class).filter(models_db.Class.id == class_id).first()


def get_classes_by_professor(db: Session, professor_id: int):
    return db.query(models_db.Class).filter(models_db.Class.professor_id == professor_id).all()


def get_classes_for_student(db: Session, student_id: int):
    memberships = db.query(models_db.ClassMember).filter(
        models_db.ClassMember.student_id == student_id).all()
    class_ids = [m.class_id for m in memberships]
    return db.query(models_db.Class).filter(models_db.Class.id.in_(class_ids)).all()


def join_class_by_code(db: Session, student_id: int, join_code: str):
    target_class = db.query(models_db.Class).filter(
        models_db.Class.join_code == join_code).first()
    if not target_class:
        raise ValueError("Invalid join code")

    existing = db.query(models_db.ClassMember).filter(
        models_db.ClassMember.class_id == target_class.id,
        models_db.ClassMember.student_id == student_id
    ).first()

    if existing:
        raise ValueError("Student is already in this class")

    new_member = models_db.ClassMember(
        class_id=target_class.id, student_id=student_id)
    db.add(new_member)
    db.commit()
    return target_class


def get_class_members(db: Session, class_id: int):
    memberships = db.query(models_db.ClassMember).filter(
        models_db.ClassMember.class_id == class_id).all()
    student_ids = [m.student_id for m in memberships]
    return db.query(models_db.User).filter(models_db.User.id.in_(student_ids)).all()


def remove_student_from_class(db: Session, class_id: int, student_id: int):
    member = db.query(models_db.ClassMember).filter(
        models_db.ClassMember.class_id == class_id,
        models_db.ClassMember.student_id == student_id
    ).first()

    if member:
        db.delete(member)
        db.commit()
        return True
    return False


def update_class(db: Session, class_id: int, class_data: class_models.ClassBase):
    db_class = db.query(models_db.Class).filter(
        models_db.Class.id == class_id).first()
    if not db_class:
        return None

    db_class.name = class_data.name
    db.commit()
    db.refresh(db_class)
    return db_class


def delete_class(db: Session, class_id: int):
    db_class = db.query(models_db.Class).filter(
        models_db.Class.id == class_id).first()
    if not db_class:
        return False

    db.delete(db_class)
    db.commit()
    return True


def get_class_members(db: Session, class_id: int):
    db_class = db.query(models_db.Class).filter(
        models_db.Class.id == class_id).first()
    if not db_class:
        return []

    memberships = db.query(models_db.ClassMember).filter(
        models_db.ClassMember.class_id == class_id).all()

    user_ids = [m.student_id for m in memberships]
    user_ids.append(db_class.professor_id)

    return db.query(models_db.User).filter(models_db.User.id.in_(user_ids)).all()


def get_quizzes_for_class(db: Session, class_id: int):
    return db.query(models_db.Quiz).join(models_db.Course).filter(models_db.Course.class_id == class_id).all()
