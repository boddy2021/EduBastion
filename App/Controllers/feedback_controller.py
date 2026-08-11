from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..Models import feedback_models
from ..Services import feedback_service as fs
from sqlalchemy.orm import Session
from ..Database.database import get_db

router = APIRouter()


@router.post("/feedback", response_model=feedback_models.FeedbackRead)
async def submit_feedback(
    feedback_in: feedback_models.FeedbackCreate,
    db: Session = Depends(get_db)
):
    try:
        created_feedback = fs.create_feedback(db=db, feedback_data=feedback_in)
        return created_feedback
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to submit feedback: {e}")


@router.get("/users/{user_id}/feedback/received", response_model=List[feedback_models.FeedbackRead])
async def get_received_feedback(
    user_id: int,
    db: Session = Depends(get_db)
):
    feedback_list = fs.get_feedback_for_user(db=db, user_id=user_id)
    return feedback_list


@router.get("/users/{user_id}/feedback/sent", response_model=List[feedback_models.FeedbackRead])
async def get_sent_feedback(
    user_id: int,
    db: Session = Depends(get_db)
):
    feedback_list = fs.get_feedback_sent_by_user(db=db, user_id=user_id)
    return feedback_list


@router.get("/feedback/result/{result_id}", response_model=List[feedback_models.FeedbackRead])
async def get_result_feedback(
    result_id: int,
    db: Session = Depends(get_db)
):
    return fs.get_feedback_for_result(db=db, result_id=result_id)
