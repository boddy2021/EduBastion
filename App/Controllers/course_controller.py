
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..Models import course_models
from ..Services import course_service as cs
from ..Database import models_db
from typing import List
import shutil
import os
import uuid

router = APIRouter()
UPLOAD_DIR = "uploaded_files"


@router.post("/", response_model=course_models.CourseRead)
async def create_new_course(course_data: course_models.CourseCreate, db: Session = Depends(get_db)):
    return cs.create_course(db=db, course=course_data)


@router.get("/by-class/{class_id}", response_model=List[course_models.CourseRead])
async def get_courses_by_class(class_id: int, db: Session = Depends(get_db)):
    return db.query(models_db.Course).filter(models_db.Course.class_id == class_id).all()


@router.get("/{course_id}", response_model=course_models.CourseRead)
async def get_course_by_id(course_id: int, db: Session = Depends(get_db)):
    db_course = cs.get_course(db, course_id)
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    return db_course


@router.post("/{course_id}/modules", response_model=course_models.ModuleRead)
async def add_module(course_id: int, module_data: course_models.ModuleCreate, db: Session = Depends(get_db)):
    db_module = models_db.Module(
        **module_data.model_dump(), course_id=course_id)
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module


@router.post("/modules/{module_id}/upload")
async def upload_resource(module_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Could not save file: {e}")
    db_resource = models_db.ModuleResource(
        module_id=module_id,
        title=file.filename,
        file_type=file_ext,
        file_path=file_path
    )
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return {"id": db_resource.id, "title": db_resource.title, "file_type": db_resource.file_type}


@router.delete("/resources/{resource_id}")
async def delete_resource(resource_id: int, db: Session = Depends(get_db)):
    resource = db.query(models_db.ModuleResource).filter(
        models_db.ModuleResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.file_path and os.path.exists(resource.file_path):
        os.remove(resource.file_path)
    db.delete(resource)
    db.commit()
    return {"message": "Resource deleted"}


@router.put("/{course_id}", response_model=course_models.CourseRead)
async def update_course(course_id: int, course_data: course_models.CourseBase, db: Session = Depends(get_db)):
    updated = cs.update_course(db, course_id, course_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Course not found")
    return updated


@router.delete("/{course_id}")
async def delete_course(course_id: int, db: Session = Depends(get_db)):
    success = cs.delete_course(db, course_id)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted"}


@router.put("/modules/{module_id}", response_model=course_models.ModuleRead)
async def update_module(module_id: int, module_data: course_models.ModuleBase, db: Session = Depends(get_db)):
    updated = cs.update_module(db, module_id, module_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Module not found")
    return updated


@router.delete("/modules/{module_id}")
async def delete_module(module_id: int, db: Session = Depends(get_db)):
    success = cs.delete_module(db, module_id)
    if not success:
        raise HTTPException(status_code=404, detail="Module not found")
    return {"message": "Module deleted"}
