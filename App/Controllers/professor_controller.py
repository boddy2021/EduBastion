from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..Models import quiz_models, submission_models
from ..Services import quiz_service as qs
from typing import List

router = APIRouter()

router = APIRouter()


@router.post("/quizzes", response_model=quiz_models.QuizRead)
async def create_new_quiz(
    quiz_data: quiz_models.QuizCreate,
    db: Session = Depends(get_db)
):
    try:
        new_quiz_object = qs.build_quiz_from_datamodel(quiz_data)

        db_quiz = qs.create_db_quiz(
            db=db,
            quiz=new_quiz_object,
            professor_id=quiz_data.professor_id,
            course_id=quiz_data.course_id
        )
        return {
            "id": db_quiz.id,
            "title": db_quiz.title,
            "duration": db_quiz.time_allocated_minutes,
            "course_id": db_quiz.course_id,
            "professor_id": db_quiz.professor_id
        }

    except (ValueError, TypeError, IndexError) as e:
        raise HTTPException(
            status_code=400, detail=f"Error creating quiz: {e}")


@router.get("/{professor_id}/quizzes", response_model=List[quiz_models.QuizRead])
async def get_quizzes_for_professor(professor_id: int, db: Session = Depends(get_db)):
    db_quizzes = qs.get_db_quizzes_by_professor(db, professor_id=professor_id)
    if not db_quizzes:
        return []
    return db_quizzes


@router.get("/quizzes/{quiz_id}/submissions", response_model=List[submission_models.SubmissionRead])
async def get_submissions_for_quiz(quiz_id: int, db: Session = Depends(get_db)):
    db_submissions = qs.get_db_submissions_for_quiz(db, quiz_id)
    return db_submissions
