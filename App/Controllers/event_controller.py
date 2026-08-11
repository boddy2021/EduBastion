from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from ..Database.database import get_db
from ..Models import event_models
from ..Services import event_service as es

router = APIRouter()


@router.post("/", response_model=event_models.EventRead)
async def create_event(event_data: event_models.EventCreate, db: Session = Depends(get_db)):
    db_event = es.create_event(db, event_data)
    return {**db_event.__dict__, "is_quiz": False, "class_name": "New Event"}


@router.delete("/{event_id}")
async def delete_event(event_id: int, db: Session = Depends(get_db)):
    success = es.delete_event(db, event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted"}


@router.get("/user/{user_id}/{role}", response_model=List[event_models.EventRead])
async def get_user_events(user_id: int, role: str, db: Session = Depends(get_db)):
    if role not in ['student', 'professor']:
        raise HTTPException(status_code=400, detail="Invalid role")
    return es.get_all_events_for_user(db, user_id, role)


@router.put("/{event_id}", response_model=event_models.EventRead)
async def update_event(event_id: int, event_data: event_models.EventCreate, db: Session = Depends(get_db)):
    updated_event = es.update_event(db, event_id, event_data)
    if not updated_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return {**updated_event.__dict__, "is_quiz": False, "class_name": "Updated Event"}
