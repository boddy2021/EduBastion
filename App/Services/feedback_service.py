from sqlalchemy.orm import Session
from ..Models import feedback_models
from ..Database import models_db
from typing import List
from datetime import datetime, timezone


def create_feedback(db: Session, feedback_data: feedback_models.FeedbackCreate) -> models_db.Feedback:
    feedback_dict = feedback_data.model_dump()
    db_feedback = models_db.Feedback(**feedback_dict)

    if db_feedback.created_at is None:
        db_feedback.created_at = datetime.now(timezone.utc)

    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)

    print(
        f"[LOG-Feedback] Feedback {db_feedback.id} created from {db_feedback.sender_id} to {db_feedback.receiver_id}")
    return db_feedback


def get_feedback_for_user(db: Session, user_id: int) -> List[models_db.Feedback]:
    return db.query(models_db.Feedback).filter(models_db.Feedback.receiver_id == user_id).all()


def get_feedback_sent_by_user(db: Session, user_id: int) -> List[models_db.Feedback]:
    return db.query(models_db.Feedback).filter(models_db.Feedback.sender_id == user_id).all()


def get_feedback_for_result(db: Session, result_id: int) -> List[models_db.Feedback]:
    return db.query(models_db.Feedback).filter(models_db.Feedback.result_id == result_id).all()
