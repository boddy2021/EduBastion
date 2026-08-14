from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from ..Database import models_db
from ..Models import proctoring_models
import os
import cv2
import time
from fastapi import UploadFile
import shutil
from . import voice_analyzer_service
from ..config import PROCTORING_IMAGE_DIR

import logging

logger = logging.getLogger(__name__)


def calculate_trust_score(leave_count: int, time_away_seconds: float) -> int:
    score = 100
    score -= (leave_count * 10)
    score -= int(time_away_seconds / 2)
    return max(0, score)


def process_proctoring_image(db: Session, quiz_id: int, student_id: int, image: UploadFile):
    base_folder = os.path.join(
        PROCTORING_IMAGE_DIR, f"quiz_{quiz_id}", f"student_{student_id}")
    os.makedirs(base_folder, exist_ok=True)

    timestamp = int(time.time())
    file_path = os.path.join(base_folder, f"snapshot_{timestamp}.jpg")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)

    img = cv2.imread(file_path)
    if img is None:
        return {"status": "error", "message": "The image could not be read.", "faces_detected": 1}

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    fete = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(50, 50))
    numar_fete = len(fete)

    for (x, y, w, h) in fete:
        cv2.rectangle(img, (x, y), (x+w, y+h), (0, 0, 255), 3)
    cv2.imwrite(file_path, img)
    logger.debug("Proctoring frame analysed: %s faces", numar_fete)

    return {"status": "success", "faces_detected": numar_fete, "saved_path": file_path}


def create_new_proctoring_log(db: Session, data: proctoring_models.ProctoringSubmit):
    score = 100

    score -= (data.leave_count * 10)
    score -= int(data.time_away_seconds / 2)
    score -= (data.face_not_found_warnings * 5)

    if data.multiple_faces_detected:
        score -= 20

    quiz_result = db.query(models_db.QuizResult).filter(
        models_db.QuizResult.quiz_id == data.quiz_id,
        models_db.QuizResult.student_id == data.student_id
    ).order_by(models_db.QuizResult.id.desc()).first()

    ai_summary = summarize_ai_findings(
        quiz_result.answers_json if quiz_result else None)
    ai_frauds = ai_summary["ai_frauds"]
    highest_ai_prob = ai_summary["highest_ai_prob"]

    score -= ai_frauds * AI_FRAUD_PENALTY

    quiz = db.query(models_db.Quiz).filter(
        models_db.Quiz.id == data.quiz_id).first()
    quiz_questions = quiz.quiz_data.get(
        "questions", []) if quiz and quiz.quiz_data else []

    voice_analysis = voice_analyzer_service.analyze_transcript_for_cheating(
        transcript=getattr(data, 'audio_transcript', ''),
        quiz_questions=quiz_questions
    )

    if voice_analysis["has_cheated"]:
        score -= voice_analysis["penalty_points"]

    score = max(0, score)

    final_detailed_logs = {
        "voice_analysis": {
            "transcript": data.audio_transcript or "",
            "has_cheated": voice_analysis["has_cheated"],
            "penalty_applied": voice_analysis["penalty_points"],
            "fraud_reasons": voice_analysis["details"]
        },
        "keyboard_analysis": {
            "suspicious_keys_pressed": data.key_logs or []
        },
        "ai_analysis": {
            "ai_frauds_detected": ai_frauds,
            "highest_ai_prob": highest_ai_prob,
            "analysis_pending": ai_summary["analysis_pending"],
        }
    }

    new_session = models_db.ProctoringSession(
        quiz_id=data.quiz_id,
        student_id=data.student_id,
        leave_count=data.leave_count,
        time_away_seconds=data.time_away_seconds,
        trust_score=score,
        face_not_found_warnings=data.face_not_found_warnings,
        multiple_faces_detected=data.multiple_faces_detected,
        ai_text_probability=highest_ai_prob,
        speech_detected=voice_analysis["has_cheated"],
        audio_transcript=data.audio_transcript or "",
        detailed_logs=final_detailed_logs
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


AI_FRAUD_PENALTY = 40


def summarize_ai_findings(answers_json) -> dict:
    ai_frauds = 0
    highest_ai_prob = 0.0
    pending = False

    for answer in (answers_json or []):
        if answer.get("ai_analysis_pending"):
            pending = True
            continue
        if answer.get("is_ai_generated") is True:
            ai_frauds += 1
            confidence = answer.get("ai_confidence", 0) or 0
            highest_ai_prob = max(highest_ai_prob, confidence)

    return {
        "ai_frauds": ai_frauds,
        "highest_ai_prob": highest_ai_prob,
        "analysis_pending": pending,
    }


def refresh_ai_findings(db: Session, quiz_id: int, student_id: int) -> None:
    session = db.query(models_db.ProctoringSession).filter(
        models_db.ProctoringSession.quiz_id == quiz_id,
        models_db.ProctoringSession.student_id == student_id
    ).order_by(models_db.ProctoringSession.id.desc()).first()

    if not session:
        return

    quiz_result = db.query(models_db.QuizResult).filter(
        models_db.QuizResult.quiz_id == quiz_id,
        models_db.QuizResult.student_id == student_id
    ).order_by(models_db.QuizResult.id.desc()).first()

    if not quiz_result:
        return

    summary = summarize_ai_findings(quiz_result.answers_json)

    logs = dict(session.detailed_logs or {})
    previous = (logs.get("ai_analysis") or {}).get("ai_frauds_detected", 0) or 0

    penalty_delta = (summary["ai_frauds"] - previous) * AI_FRAUD_PENALTY
    session.trust_score = max(0, min(100, session.trust_score - penalty_delta))
    session.ai_text_probability = summary["highest_ai_prob"]

    logs["ai_analysis"] = {
        "ai_frauds_detected": summary["ai_frauds"],
        "highest_ai_prob": summary["highest_ai_prob"],
        "analysis_pending": summary["analysis_pending"],
    }
    session.detailed_logs = logs
    flag_modified(session, "detailed_logs")

    db.commit()


def get_proctoring_report(db: Session, quiz_id: int, student_id: int):
    session = db.query(models_db.ProctoringSession).filter(
        models_db.ProctoringSession.quiz_id == quiz_id,
        models_db.ProctoringSession.student_id == student_id
    ).first()

    if not session:
        return None

    cheating_probability = 100 - session.trust_score

    return {
        "trust_score": session.trust_score,
        "cheating_probability": cheating_probability,
        "leave_count": session.leave_count,
        "time_away_seconds": session.time_away_seconds,
        "face_warnings": session.face_not_found_warnings,
        "multiple_faces": session.multiple_faces_detected,
        "speech_detected": session.speech_detected,
        "ai_text_probability": session.ai_text_probability,
        "detailed_logs": session.detailed_logs,
        "audio_transcript": session.audio_transcript
    }
