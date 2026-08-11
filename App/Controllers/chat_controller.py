from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from ..Database.database import get_db
from ..Models import chat_models
from ..Services import chat_service as cs

router = APIRouter()


@router.post("/class/{class_id}", response_model=chat_models.PostRead)
async def create_class_post_endpoint(class_id: int, post: chat_models.PostCreate, db: Session = Depends(get_db)):
    db_post = cs.create_class_post(db, class_id, post)
    from ..Services import user_service
    user = user_service.get_user(db, post.author_id)
    return {
        "id": db_post.id,
        "content": db_post.content,
        "author_id": db_post.author_id,
        "author_name": user.username,
        "created_at": db_post.created_at
    }


@router.get("/class/{class_id}", response_model=List[chat_models.PostRead])
async def get_class_posts_endpoint(class_id: int, db: Session = Depends(get_db)):
    return cs.get_class_posts(db, class_id)


@router.post("/course/{course_id}", response_model=chat_models.PostRead)
async def create_course_post_endpoint(course_id: int, post: chat_models.PostCreate, db: Session = Depends(get_db)):
    db_post = cs.create_course_post(db, course_id, post)
    from ..Services import user_service
    user = user_service.get_user(db, post.author_id)
    return {
        "id": db_post.id,
        "content": db_post.content,
        "author_id": db_post.author_id,
        "author_name": user.username,
        "created_at": db_post.created_at
    }


@router.get("/course/{course_id}", response_model=List[chat_models.PostRead])
async def get_course_posts_endpoint(course_id: int, db: Session = Depends(get_db)):
    return cs.get_course_posts(db, course_id)
