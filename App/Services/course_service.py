from sqlalchemy.orm import Session
from ..Database import models_db
from ..Models import course_models


def get_course(db: Session, course_id: int):
    return db.query(models_db.Course).filter(models_db.Course.id == course_id).first()


def get_courses_by_professor(db: Session, professor_id: int):
    return db.query(models_db.Course).filter(models_db.Course.professor_id == professor_id).all()


def create_course(db: Session, course: course_models.CourseCreate):
    db_course = models_db.Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


def create_module(db: Session, course_id: int, module: course_models.ModuleCreate):
    db_module = models_db.Module(**module.model_dump(), course_id=course_id)
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module


def get_modules_for_course(db: Session, course_id: int):
    return db.query(models_db.Module).filter(models_db.Module.course_id == course_id).all()


def add_resource_to_module(db: Session, module_id: int, resource: course_models.ResourceBase):
    db_resource = models_db.ModuleResource(
        **resource.model_dump(), module_id=module_id)
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource


def delete_resource(db: Session, resource_id: int):
    resource = db.query(models_db.ModuleResource).filter(
        models_db.ModuleResource.id == resource_id).first()
    if resource:
        db.delete(resource)
        db.commit()
        return True
    return False


def update_course(db: Session, course_id: int, course_data: course_models.CourseBase):
    db_course = db.query(models_db.Course).filter(
        models_db.Course.id == course_id).first()
    if not db_course:
        return None

    db_course.title = course_data.title
    db_course.description = course_data.description
    db.commit()
    db.refresh(db_course)
    return db_course


def delete_course(db: Session, course_id: int):
    db_course = db.query(models_db.Course).filter(
        models_db.Course.id == course_id).first()
    if not db_course:
        return False
    db.delete(db_course)
    db.commit()
    return True


def update_module(db: Session, module_id: int, module_data: course_models.ModuleBase):
    db_module = db.query(models_db.Module).filter(
        models_db.Module.id == module_id).first()
    if not db_module:
        return None

    db_module.title = module_data.title
    db.commit()
    db.refresh(db_module)
    return db_module


def delete_module(db: Session, module_id: int):
    db_module = db.query(models_db.Module).filter(
        models_db.Module.id == module_id).first()
    if not db_module:
        return False
    db.delete(db_module)
    db.commit()
    return True
