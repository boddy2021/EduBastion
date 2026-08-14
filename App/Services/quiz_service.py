import logging

from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from ..Database import models_db
from ..Models import quiz_models, submission_models
from datetime import datetime, timedelta
from ..Services import ai_detector_service
from ..Core.grading import grade_question, MAX_GRADE

logger = logging.getLogger(__name__)


def create_db_quiz(db: Session, quiz_data: quiz_models.QuizCreate):
    questions_list = [q.model_dump() for q in quiz_data.questions]

    db_quiz = models_db.Quiz(
        title=quiz_data.title,
        time_allocated_minutes=quiz_data.duration,
        start_time=quiz_data.start_time,
        course_id=quiz_data.course_id,
        professor_id=quiz_data.professor_id,
        enable_proctoring=quiz_data.enable_proctoring,
        quiz_data={
            "language": getattr(quiz_data, 'language', 'ro-RO'),
            "proctoring_settings": getattr(quiz_data, 'proctoring_settings', {"camera": True, "audio": True, "tab_switch": True}),
            "questions": questions_list
        }
    )

    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


def delete_quiz(db: Session, quiz_id: int):
    quiz = db.query(models_db.Quiz).filter(
        models_db.Quiz.id == quiz_id).first()
    if not quiz:
        return False

    results = db.query(models_db.QuizResult).filter(
        models_db.QuizResult.quiz_id == quiz_id).all()
    result_ids = [r.id for r in results]

    if result_ids:
        db.query(models_db.ProctoringLog).filter(models_db.ProctoringLog.result_id.in_(
            result_ids)).delete(synchronize_session=False)
        db.query(models_db.Feedback).filter(models_db.Feedback.result_id.in_(
            result_ids)).delete(synchronize_session=False)
        db.query(models_db.QuizResult).filter(
            models_db.QuizResult.quiz_id == quiz_id).delete(synchronize_session=False)

    db.delete(quiz)
    db.commit()
    return True


def get_student_quiz_view(db: Session, quiz_id: int):
    quiz = db.query(models_db.Quiz).filter(
        models_db.Quiz.id == quiz_id).first()
    if not quiz:
        raise ValueError("Quiz not found")

    now = datetime.now()

    start_time = quiz.start_time
    if start_time and start_time.tzinfo:
        start_time = start_time.replace(tzinfo=None)

    quiz_status = "active"
    questions_to_send = []

    if start_time:
        end_time = start_time + timedelta(minutes=quiz.time_allocated_minutes)

        if now < start_time:
            quiz_status = "waiting"
        elif now > end_time:
            quiz_status = "finished"
        else:
            quiz_status = "active"
    else:
        quiz_status = "active"

    quiz_language = quiz.quiz_data.get(
        'language', 'ro-RO') if quiz.quiz_data else 'ro-RO'

    if quiz_status == "active":
        if quiz.quiz_data and 'questions' in quiz.quiz_data:
            for i, q in enumerate(quiz.quiz_data['questions']):
                q_clean = {
                    "index": i,
                    "text": q.get('text', ''),
                    "type": q.get('type', 'MultipleChoiceQuestion'),
                    "title": q.get('title') if q.get('title') else f"Question {i+1}",
                    "choices": q.get('choices', []),
                    "link": q.get('link'),
                    "links": q.get('links', []),
                    "image_url": q.get('image_url')
                }
                questions_to_send.append(q_clean)

    proctoring_settings = quiz.quiz_data.get('proctoring_settings', {"camera": True, "audio": True, "tab_switch": True}) if quiz.quiz_data else {
        "camera": True, "audio": True, "tab_switch": True}

    return {
        "quiz_id": quiz.id,
        "title": quiz.title,
        "duration": quiz.time_allocated_minutes,
        "start_time": start_time,
        "server_time": now,
        "quiz_status": quiz_status,
        "language": quiz_language,
        "enable_proctoring": quiz.enable_proctoring,
        "proctoring_settings": proctoring_settings,
        "questions": questions_to_send
    }


def should_run_ai_detection(quiz_record) -> bool:
    settings = (quiz_record.quiz_data or {}).get("proctoring_settings") or {}
    return bool(quiz_record.enable_proctoring) and settings.get("ai_text", True)


def evaluate_submission(db: Session, quiz_id: int, sub_data: submission_models.SubmissionCreate):
    quiz_record = db.query(models_db.Quiz).filter(
        models_db.Quiz.id == quiz_id).first()
    original_questions = quiz_record.quiz_data['questions']

    earned_points = 0.0
    total_questions = len(original_questions)
    requires_manual_review = False

    needs_ai_analysis = False
    analyzed_answers = []

    for idx, q_original in enumerate(original_questions):
        student_ans_val = sub_data.answers[idx] if idx < len(
            sub_data.answers) else None

        result = grade_question(q_original, student_ans_val)
        earned_points += result["points"]

        pending_ai = False
        if result["manual_review"] and student_ans_val:
            if should_run_ai_detection(quiz_record):
                pending_ai = True
                needs_ai_analysis = True

        if result["manual_review"]:
            requires_manual_review = True

        analyzed_answers.append({
            "text": student_ans_val,
            "is_ai_generated": False,
            "ai_confidence": 0.0,
            "ai_analysis_pending": pending_ai,
        })

    final_grade = min(MAX_GRADE, round(earned_points, 2))

    db_result = models_db.QuizResult(
        quiz_id=quiz_id,
        student_id=sub_data.student_id,
        answers_json=analyzed_answers,
        final_score=final_grade,
        status="finished"
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)

    return {
        "submission_id": db_result.id,
        "score": round(final_grade, 2),
        "total_questions": total_questions,
        "needs_ai_analysis": needs_ai_analysis,
    }


def analyze_submission_ai(submission_id: int) -> None:
    from ..Database.database import SessionLocal

    db = SessionLocal()
    try:
        submission = db.query(models_db.QuizResult).filter(
            models_db.QuizResult.id == submission_id).first()
        if not submission:
            logger.warning("Submission %s vanished before AI analysis.",
                           submission_id)
            return

        quiz = db.query(models_db.Quiz).filter(
            models_db.Quiz.id == submission.quiz_id).first()
        if not quiz or not should_run_ai_detection(quiz):
            return

        answers = list(submission.answers_json or [])
        changed = False

        for answer in answers:
            if not answer.get("ai_analysis_pending"):
                continue

            text = answer.get("text")
            if text:
                result = ai_detector_service.check_ai_probability(str(text))
                answer["is_ai_generated"] = result["is_ai"]
                answer["ai_confidence"] = result["confidence"]
                answer["ai_verdict"] = result.get("verdict", "not_analyzed")
                answer["ai_score"] = result.get("score")

            answer["ai_analysis_pending"] = False
            changed = True

        if changed:
            submission.answers_json = answers
            flag_modified(submission, "answers_json")
            db.commit()

            from ..Services import proctoring_service
            proctoring_service.refresh_ai_findings(
                db, submission.quiz_id, submission.student_id)

            logger.info("AI analysis completed for submission %s.", submission_id)

    except Exception:
        logger.exception("AI analysis failed for submission %s.", submission_id)
        db.rollback()
    finally:
        db.close()


def get_submission_details(db: Session, submission_id: int):
    submission = db.query(models_db.QuizResult).filter(
        models_db.QuizResult.id == submission_id).first()
    if not submission:
        return None

    quiz = db.query(models_db.Quiz).filter(
        models_db.Quiz.id == submission.quiz_id).first()
    questions_data = quiz.quiz_data['questions']
    student_answers = submission.answers_json

    detailed_results = []
    has_manual_review = False

    for i, q in enumerate(questions_data):
        raw_user_ans = student_answers[i] if i < len(student_answers) else None

        is_ai_gen = False
        ai_conf = 0.0
        ai_pending = False
        ai_verdict = "not_analyzed"
        ai_score = None

        if isinstance(raw_user_ans, dict) and "text" in raw_user_ans:
            user_ans = raw_user_ans["text"]
            is_ai_gen = raw_user_ans.get("is_ai_generated", False)
            ai_conf = raw_user_ans.get("ai_confidence", 0.0)
            ai_pending = raw_user_ans.get("ai_analysis_pending", False)
            ai_verdict = raw_user_ans.get("ai_verdict", "not_analyzed")
            ai_score = raw_user_ans.get("ai_score")
        else:
            user_ans = raw_user_ans

        if ai_pending:
            ai_verdict = "pending"

        correct_ans = q.get('answer')
        question_points = float(q.get('points', 0.0) or 0.0)

        result = grade_question(q, user_ans)
        is_correct = result["is_correct"]
        manual_review = result["manual_review"]

        if manual_review:
            has_manual_review = True

        detailed_results.append({
            "question_text": q['text'],
            "type": q['type'],
            "user_answer": user_ans,
            "is_ai_generated": is_ai_gen,
            "ai_confidence": ai_conf,
            "ai_verdict": ai_verdict,
            "ai_score": ai_score,
            "ai_analysis_pending": ai_pending,
            "correct_answer": correct_ans,
            "is_correct": is_correct,
            "manual_review": manual_review,
            "choices": q.get('choices'),
            "image_url": q.get('image_url'),
            "points": question_points
        })

    display_status = submission.status
    if has_manual_review:
        display_status = "pending_review"

    return {
        "submission_id": submission.id,
        "student_id": submission.student_id,
        "score": submission.final_score,
        "status": display_status,
        "quiz_title": quiz.title,
        "details": detailed_results
    }


def get_submission_by_student_and_quiz(db: Session, student_id: int, quiz_id: int):
    return db.query(models_db.QuizResult).filter(
        models_db.QuizResult.student_id == student_id,
        models_db.QuizResult.quiz_id == quiz_id
    ).first()


def update_submission_score(db: Session, submission_id: int, new_score: float):
    submission = db.query(models_db.QuizResult).filter(
        models_db.QuizResult.id == submission_id).first()
    if submission:
        submission.final_score = new_score
        submission.status = "graded"
        db.commit()
        db.refresh(submission)
        return submission
    return None


def get_submissions_for_quiz(db: Session, quiz_id: int):
    return db.query(models_db.QuizResult).filter(models_db.QuizResult.quiz_id == quiz_id).all()


def update_quiz(db: Session, quiz_id: int, quiz_data: quiz_models.QuizCreate):
    db_quiz = db.query(models_db.Quiz).filter(
        models_db.Quiz.id == quiz_id).first()
    if not db_quiz:
        raise ValueError("Quiz not found")

    db_quiz.title = quiz_data.title
    db_quiz.time_allocated_minutes = quiz_data.duration
    db_quiz.start_time = quiz_data.start_time

    questions_list = [q.model_dump() for q in quiz_data.questions]

    db_quiz.quiz_data = {
        "language": getattr(quiz_data, 'language', 'ro-RO'),
        "proctoring_settings": getattr(quiz_data, 'proctoring_settings', {"camera": True, "audio": True, "tab_switch": True}),
        "questions": questions_list
    }
    db_quiz.enable_proctoring = quiz_data.enable_proctoring

    db.commit()
    db.refresh(db_quiz)
    return db_quiz


def get_quiz_for_editor(db: Session, quiz_id: int):
    quiz = db.query(models_db.Quiz).filter(
        models_db.Quiz.id == quiz_id).first()
    if not quiz:
        return None

    quiz_language = quiz.quiz_data.get(
        'language', 'ro-RO') if quiz.quiz_data else 'ro-RO'

    return {
        "id": quiz.id,
        "title": quiz.title,
        "duration": quiz.time_allocated_minutes,
        "start_time": quiz.start_time,
        "course_id": quiz.course_id,
        "professor_id": quiz.professor_id,
        "language": quiz_language,
        "questions": quiz.quiz_data.get('questions', [])
    }
