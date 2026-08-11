from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..Models import proctoring_models
from ..Services import proctoring_service
from fastapi import File, UploadFile, Form

router = APIRouter()


@router.post("/log", response_model=proctoring_models.ProctoringSessionRead)
def log_proctoring_data(data: proctoring_models.ProctoringSubmit, db: Session = Depends(get_db)):
    try:
        new_log = proctoring_service.create_new_proctoring_log(db, data)
        return new_log
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error saving anti-cheat logs: {str(e)}")


@router.post("/upload-image")
def upload_proctoring_image(
    quiz_id: int = Form(...),
    student_id: int = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        result = proctoring_service.process_proctoring_image(
            db, quiz_id, student_id, image)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
