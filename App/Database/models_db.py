from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DECIMAL, TIMESTAMP, TEXT, Float, JSON
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from .db_enums import UserRole, UserSex, ContentType, QuizStatus, ProctoringEvent


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(ENUM(UserRole, name="user_role",
                  create_type=False), nullable=False)

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    courses = relationship("Course", back_populates="professor")
    quizzes = relationship("Quiz", back_populates="professor")
    results = relationship("QuizResult", back_populates="student")
    logs = relationship("ProctoringLog", back_populates="student")
    feedback_sent = relationship(
        "Feedback", foreign_keys="[Feedback.sender_id]", back_populates="sender")
    feedback_received = relationship(
        "Feedback", foreign_keys="[Feedback.receiver_id]", back_populates="receiver")


class UserProfile(Base):
    __tablename__ = "userprofiles"
    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    first_name = Column(String(255))
    last_name = Column(String(255))
    phone = Column(String(20))
    sex = Column(ENUM(UserSex, name="user_sex", create_type=False))
    address = Column(String(500))
    university = Column(String(255))
    user = relationship("User", back_populates="profile")


class ClassMember(Base):
    __tablename__ = "class_members"
    id = Column(Integer, primary_key=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)


class Class(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    professor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    join_code = Column(String(10), unique=True, nullable=False)

    professor = relationship("User")
    courses = relationship("Course", back_populates="class_parent")
    posts = relationship(
        "ClassPost", back_populates="class_parent", cascade="all, delete-orphan")


class ClassPost(Base):
    __tablename__ = "class_posts"
    id = Column(Integer, primary_key=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(TEXT, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    class_parent = relationship("Class", back_populates="posts")
    author = relationship("User")


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(String)
    professor_id = Column(Integer, ForeignKey("users.id"))
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)

    professor = relationship("User", back_populates="courses")
    class_parent = relationship("Class", back_populates="courses")
    modules = relationship(
        "Module", back_populates="course", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="course")
    posts = relationship("CoursePost", back_populates="course",
                         cascade="all, delete-orphan")


class CoursePost(Base):
    __tablename__ = "course_posts"
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(TEXT, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="posts")
    author = relationship("User")


class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String)

    course = relationship("Course", back_populates="modules")
    resources = relationship(
        "ModuleResource", back_populates="module", cascade="all, delete-orphan")


class ModuleResource(Base):
    __tablename__ = "module_resources"
    id = Column(Integer, primary_key=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    title = Column(String(255), nullable=False)
    file_type = Column(String(50))
    file_path = Column(String)

    module = relationship("Module", back_populates="resources")


class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True)
    professor_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255), nullable=False)
    time_allocated_minutes = Column(Integer)
    quiz_data = Column(JSONB, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"))
    enable_proctoring = Column(Boolean, default=False)
    start_time = Column(TIMESTAMP(timezone=True), default=None)

    professor = relationship("User", back_populates="quizzes")
    course = relationship("Course", back_populates="quizzes")
    results = relationship("QuizResult", back_populates="quiz")


class QuizResult(Base):
    __tablename__ = "quizresults"
    id = Column(Integer, primary_key=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(TIMESTAMP(timezone=True), default=None)
    finish_time = Column(TIMESTAMP(timezone=True))
    answers_json = Column(JSONB)
    final_score = Column(DECIMAL(5, 2))
    status = Column(ENUM(QuizStatus, name="quiz_status",
                    create_type=False), default="started")

    quiz = relationship("Quiz", back_populates="results")
    student = relationship("User", back_populates="results")
    logs = relationship("ProctoringLog", back_populates="result")
    feedbacks = relationship("Feedback", back_populates="result")


class ProctoringLog(Base):
    __tablename__ = "proctoringlogs"
    id = Column(Integer, primary_key=True)
    result_id = Column(Integer, ForeignKey("quizresults.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_type = Column(ENUM(
        ProctoringEvent, name="proctoring_event", create_type=False), nullable=False)
    timestamp = Column(TIMESTAMP(timezone=True), default=None)
    details = Column(JSONB)

    result = relationship("QuizResult", back_populates="logs")
    student = relationship("User", back_populates="logs")


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    result_id = Column(Integer, ForeignKey("quizresults.id"), nullable=True)
    comments = Column(TEXT, nullable=False)
    rating = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=None)

    sender = relationship("User", foreign_keys=[
                          sender_id], back_populates="feedback_sent")
    receiver = relationship("User", foreign_keys=[
                            receiver_id], back_populates="feedback_received")
    result = relationship("QuizResult", back_populates="feedbacks")


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(TEXT, nullable=True)
    event_date = Column(TIMESTAMP(timezone=True), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    professor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    class_ref = relationship("Class", backref="events")
    professor = relationship("User", foreign_keys=[professor_id])


class ProctoringSession(Base):
    __tablename__ = "proctoring_sessions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey(
        "quizzes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)

    leave_count = Column(Integer, default=0)
    time_away_seconds = Column(Float, default=0.0)

    face_not_found_warnings = Column(Integer, default=0)
    multiple_faces_detected = Column(Boolean, default=False)
    speech_detected = Column(Boolean, default=False)
    ai_text_probability = Column(Float, default=0.0)

    trust_score = Column(Integer, default=100)
    audio_transcript = Column(TEXT, nullable=True)

    detailed_logs = Column(JSONB, default={})

    quiz = relationship("Quiz")
    student = relationship("User")
