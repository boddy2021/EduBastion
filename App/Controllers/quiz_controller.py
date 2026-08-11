from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import uuid

from ..Database.database import get_db
from ..Models import quiz_models, submission_models
from ..Services import quiz_service as qs
from ..Services import ai_detector_service
from ..Database import models_db
from ..Services import proctoring_service
from ..security import get_current_user, require_professor

router = APIRouter()
UPLOAD_DIR = "uploaded_files"


@router.post("/", response_model=quiz_models.QuizRead)
async def create_quiz(quiz_data: quiz_models.QuizCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_professor(current_user)
    return qs.create_db_quiz(db, quiz_data)


@router.delete("/{quiz_id}")
async def delete_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_professor(current_user)
    success = qs.delete_quiz(db, quiz_id)
    if not success:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return {"message": "Quiz deleted"}


@router.get("/{quiz_id}/submissions", response_model=List[submission_models.SubmissionRead])
async def get_quiz_submissions(quiz_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_professor(current_user)
    return qs.get_submissions_for_quiz(db, quiz_id)


@router.get("/{quiz_id}/all-submissions")
async def get_all_submissions(quiz_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_professor(current_user)
    from ..Database import models_db
    results = db.query(models_db.QuizResult, models_db.User).join(
        models_db.User).filter(models_db.QuizResult.quiz_id == quiz_id).all()

    quiz = db.query(models_db.Quiz).filter(
        models_db.Quiz.id == quiz_id).first()
    quiz_needs_review = False
    if quiz and quiz.quiz_data and quiz.quiz_data.get('questions'):
        quiz_needs_review = any(
            q.get('type') == 'LongAnswerQuestion'
            for q in quiz.quiz_data['questions']
        )

    output = []
    for res, user in results:
        raw_status = res.status.value if hasattr(
            res.status, "value") else res.status

        display_status = raw_status
        if raw_status != "graded" and quiz_needs_review:
            display_status = "pending_review"

        output.append({
            "id": res.id,
            "student_id": user.id,
            "student_name": user.username,
            "student_email": user.email,
            "final_score": res.final_score,
            "status": display_status,
            "finish_time": res.finish_time
        })
    return output


@router.post("/upload-attachment")
async def upload_attachment(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    require_professor(current_user)
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Could not save file: {e}")

    return {"file_path": file_path, "url": f"http://127.0.0.1:8000/files/{unique_filename}"}


@router.get("/{quiz_id}/take", response_model=quiz_models.QuizStudentView)
async def get_quiz_for_student(quiz_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return qs.get_student_quiz_view(db, quiz_id)


@router.post("/{quiz_id}/submit")
def submit_quiz(quiz_id: int, payload: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    student_id = payload.get("student_id")
    raw_answers = payload.get("answers", [])

    quiz = db.query(models_db.Quiz).filter(
        models_db.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    try:
        sub_data = submission_models.SubmissionCreate(
            student_id=student_id,
            answers=raw_answers
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data: {str(e)}")

    result = qs.evaluate_submission(
        db=db, quiz_id=quiz_id, sub_data=sub_data)

    # Grading is done and persisted; the student is free to leave. AI text
    # detection takes tens of seconds and runs after the response is sent.
    if result["needs_ai_analysis"]:
        background_tasks.add_task(
            qs.analyze_submission_ai, result["submission_id"])

    return {
        "message": "Test submitted and evaluated successfully!",
        "submission_id": result["submission_id"],
        "score": result["score"],
        "ai_analysis_pending": result["needs_ai_analysis"],
    }


@router.get("/{quiz_id}/status/{student_id}")
async def check_submission_status(quiz_id: int, student_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    submission = qs.get_submission_by_student_and_quiz(db, student_id, quiz_id)
    if submission:
        return {
            "submitted": True,
            "submission_id": submission.id,
            "score": submission.final_score,
            "status": submission.status
        }
    return {"submitted": False}


@router.get("/submissions/{submission_id}/details")
async def get_submission_details_endpoint(submission_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    details = qs.get_submission_details(db, submission_id)
    if not details:
        raise HTTPException(status_code=404, detail="Submission not found")

    result = db.query(models_db.QuizResult).filter(
        models_db.QuizResult.id == submission_id).first()

    if result:
        report = proctoring_service.get_proctoring_report(
            db, result.quiz_id, result.student_id)
        details["proctoring_report"] = report

    return details


@router.post("/submissions/{submission_id}/grade")
async def grade_submission(submission_id: int, grade_data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_professor(current_user)
    new_score = grade_data.get('final_score')
    return qs.update_submission_score(db, submission_id, new_score)


@router.get("/{quiz_id}/editor", response_model=quiz_models.QuizCreate)
async def get_quiz_for_edit(quiz_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_professor(current_user)
    quiz = qs.get_quiz_for_editor(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.put("/{quiz_id}")
async def update_quiz_endpoint(quiz_id: int, quiz_data: quiz_models.QuizCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    require_professor(current_user)
    try:
        return qs.update_quiz(db, quiz_id, quiz_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
