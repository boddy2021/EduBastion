from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..Models import quiz_models
from typing import List

from ..Database.database import get_db
from ..Models import class_models, user_models
from ..Services import class_service as class_svc

router = APIRouter()


@router.post("/", response_model=class_models.ClassRead)
async def create_class(class_data: class_models.ClassCreate, db: Session = Depends(get_db)):
    try:
        return class_svc.create_class(db, class_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{class_id}", response_model=class_models.ClassRead)
async def get_class_details(class_id: int, db: Session = Depends(get_db)):
    cls = class_svc.get_class_by_id(db, class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    return cls


@router.get("/professor/{professor_id}", response_model=List[class_models.ClassRead])
async def get_professor_classes(professor_id: int, db: Session = Depends(get_db)):
    return class_svc.get_classes_by_professor(db, professor_id)


@router.get("/student/{student_id}", response_model=List[class_models.ClassRead])
async def get_student_classes(student_id: int, db: Session = Depends(get_db)):
    return class_svc.get_classes_for_student(db, student_id)


@router.post("/join")
async def join_class(join_data: class_models.JoinByCodeRequest, db: Session = Depends(get_db)):
    try:
        target_class = class_svc.join_class_by_code(
            db, join_data.student_id, join_data.join_code)
        return {"message": f"Successfully joined class: {target_class.name}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{class_id}/members", response_model=List[user_models.UserRead])
async def get_members(class_id: int, db: Session = Depends(get_db)):
    return class_svc.get_class_members(db, class_id)


@router.delete("/{class_id}/students/{student_id}")
async def remove_student(class_id: int, student_id: int, db: Session = Depends(get_db)):
    success = class_svc.remove_student_from_class(db, class_id, student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Student removed"}


@router.put("/{class_id}", response_model=class_models.ClassRead)
async def update_class(class_id: int, class_data: class_models.ClassBase, db: Session = Depends(get_db)):
    updated_class = class_svc.update_class(db, class_id, class_data)
    if not updated_class:
        raise HTTPException(status_code=404, detail="Class not found")
    return updated_class


@router.delete("/{class_id}")
async def delete_class(class_id: int, db: Session = Depends(get_db)):
    success = class_svc.delete_class(db, class_id)
    if not success:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"message": "Class deleted successfully"}


@router.get("/{class_id}/quizzes", response_model=List[quiz_models.QuizRead])
async def get_class_quizzes(class_id: int, db: Session = Depends(get_db)):
    return class_svc.get_quizzes_for_class(db, class_id)
