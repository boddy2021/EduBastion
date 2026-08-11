from sqlalchemy.orm import Session
from datetime import datetime
from ..Database import models_db
from ..Models import event_models


def create_event(db: Session, event_data: event_models.EventCreate):
    db_event = models_db.Event(**event_data.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def delete_event(db: Session, event_id: int):
    event = db.query(models_db.Event).filter(
        models_db.Event.id == event_id).first()
    if event:
        db.delete(event)
        db.commit()
        return True
    return False


def update_event(db: Session, event_id: int, event_data: event_models.EventCreate):
    db_event = db.query(models_db.Event).filter(
        models_db.Event.id == event_id).first()
    if not db_event:
        return None

    db_event.title = event_data.title
    db_event.description = event_data.description
    db_event.event_date = event_data.event_date
    db_event.class_id = event_data.class_id

    db.commit()
    db.refresh(db_event)
    return db_event


def get_all_events_for_user(db: Session, user_id: int, role: str):

    events_result = []

    if role == 'student':
        member_classes = db.query(models_db.ClassMember.class_id).filter(
            models_db.ClassMember.student_id == user_id).subquery()

        manual_events = db.query(models_db.Event, models_db.Class).join(
            models_db.Class, models_db.Event.class_id == models_db.Class.id
        ).filter(models_db.Class.id.in_(member_classes)).all()

        quizzes = db.query(models_db.Quiz, models_db.Course, models_db.Class).join(
            models_db.Course, models_db.Quiz.course_id == models_db.Course.id
        ).join(
            models_db.Class, models_db.Course.class_id == models_db.Class.id
        ).filter(models_db.Class.id.in_(member_classes), models_db.Quiz.start_time.isnot(None)).all()

    else:
        manual_events = db.query(models_db.Event, models_db.Class).join(
            models_db.Class, models_db.Event.class_id == models_db.Class.id
        ).filter(models_db.Event.professor_id == user_id).all()

        quizzes = db.query(models_db.Quiz, models_db.Course, models_db.Class).join(
            models_db.Course, models_db.Quiz.course_id == models_db.Course.id
        ).join(
            models_db.Class, models_db.Course.class_id == models_db.Class.id
        ).filter(models_db.Quiz.professor_id == user_id, models_db.Quiz.start_time.isnot(None)).all()

    for event, cls in manual_events:
        events_result.append({
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date,
            "class_id": event.class_id,
            "professor_id": event.professor_id,
            "class_name": cls.name,
            "is_quiz": False
        })

    for quiz, course, cls in quizzes:
        try:
            q_date = datetime.fromisoformat(quiz.start_time) if isinstance(
                quiz.start_time, str) else quiz.start_time
        except:
            continue

        events_result.append({
            "id": quiz.id,
            "title": f"📝 Quiz: {quiz.title}",
            "description": f"Course: {course.title} | Duration: {quiz.time_allocated_minutes} min",
            "event_date": q_date,
            "class_id": cls.id,
            "professor_id": quiz.professor_id,
            "class_name": cls.name,
            "is_quiz": True
        })

    events_result.sort(key=lambda x: x["event_date"])

    now = datetime.now()
    future_events = [
        e for e in events_result if e["event_date"].replace(tzinfo=None) >= now]

    return future_events
