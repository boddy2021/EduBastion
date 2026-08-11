from sqlalchemy.orm import Session
from ..Database import models_db
from ..Models import chat_models


def create_class_post(db: Session, class_id: int, post_data: chat_models.PostCreate):
    db_post = models_db.ClassPost(
        class_id=class_id,
        author_id=post_data.author_id,
        content=post_data.content
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


def get_class_posts(db: Session, class_id: int):
    results = db.query(models_db.ClassPost, models_db.User).join(models_db.User).filter(
        models_db.ClassPost.class_id == class_id).order_by(models_db.ClassPost.created_at.desc()).all()

    posts = []
    for post, user in results:
        posts.append({
            "id": post.id,
            "content": post.content,
            "author_id": post.author_id,
            "author_name": user.username,
            "created_at": post.created_at
        })
    return posts


def create_course_post(db: Session, course_id: int, post_data: chat_models.PostCreate):
    db_post = models_db.CoursePost(
        course_id=course_id,
        author_id=post_data.author_id,
        content=post_data.content
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


def get_course_posts(db: Session, course_id: int):
    results = db.query(models_db.CoursePost, models_db.User).join(models_db.User).filter(
        models_db.CoursePost.course_id == course_id).order_by(models_db.CoursePost.created_at.desc()).all()

    posts = []
    for post, user in results:
        posts.append({
            "id": post.id,
            "content": post.content,
            "author_id": post.author_id,
            "author_name": user.username,
            "created_at": post.created_at
        })
    return posts
