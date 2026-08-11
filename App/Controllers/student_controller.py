from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..Models import quiz_models, submission_models
from ..Services import quiz_service as qs
from ..Core.Quiz.quiz import Quiz

router = APIRouter()


def get_and_rebuild_quiz(quiz_id: int, db: Session) -> Quiz:
    quiz_record = qs.get_db_quiz(db, quiz_id)
    if not quiz_record:
        raise HTTPException(status_code=404, detail="Quiz not found")

    try:
        quiz_object = qs.rehydrate_quiz_from_db(db_quiz=quiz_record)
        return quiz_object
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to load/rebuild quiz: {e}")


@router.get("/quizzes/{quiz_id}", response_model=quiz_models.QuizStudentView)
async def get_quiz_for_student(quiz_id: int, db: Session = Depends(get_db)):
    quiz_object = get_and_rebuild_quiz(quiz_id, db)
    safe_quiz_view = qs.create_student_quiz_view(quiz_object, quiz_id)
    return safe_quiz_view


@router.post("/quizzes/{quiz_id}/submit", response_model=submission_models.SubmissionResult)
async def submit_quiz(
    quiz_id: int,
    submission: submission_models.SubmissionCreate,
    db: Session = Depends(get_db)
):

    quiz_object = get_and_rebuild_quiz(quiz_id, db)

    if len(submission.answers) != len(quiz_object.questions):
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect number of answers. Expected {len(quiz_object.questions)}, got {len(submission.answers)}"
        )

    results_list = qs.check_quiz(quiz_object, submission.answers)
    score = sum(1 for result in results_list if result is True)

    try:
        db_submission = qs.save_db_submission(
            db=db,
            quiz_id=quiz_id,
            student_id=submission.student_id,
            answers=submission.answers,
            score=score,
            status="graded"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to save submission: {e}")

    return submission_models.SubmissionResult(
        submission_id=db_submission.id,
        student_id=db_submission.student_id,
        quiz_id=db_submission.quiz_id,
        score=db_submission.final_score,
        total_questions=len(results_list),
        results=results_list
    )
