MANUAL_REVIEW_TYPES = {"LongAnswerQuestion"}
MAX_GRADE = 10.0


def grade_question(question: dict, student_answer) -> dict:
    q_type = question.get("type")
    correct = question.get("answer")
    max_points = float(question.get("points", 0.0) or 0.0)

    if q_type in MANUAL_REVIEW_TYPES:
        return {"is_correct": False, "points": 0.0, "manual_review": True}

    ok = False

    if q_type == "MultipleChoiceQuestion":
        ok = str(student_answer) == str(correct)

    elif q_type == "TrueFalseQuestion":
        ok = str(student_answer).lower() == str(correct).lower()

    elif q_type == "CheckBoxQuestion":
        if isinstance(student_answer, list) and isinstance(correct, list):
            ok = sorted(str(x) for x in student_answer) == sorted(
                str(x) for x in correct)

    elif q_type == "ShortAnswerQuestion":
        if student_answer is not None and str(student_answer).strip():
            ok = str(student_answer).strip().lower() == str(correct).strip().lower()


    return {
        "is_correct": ok,
        "points": max_points if ok else 0.0,
        "manual_review": False,
    }
