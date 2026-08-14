import pytest

from App.Core.grading import grade_question


def question(q_type, answer, points=1.0):
    return {"type": q_type, "answer": answer, "points": points}


def test_multiple_choice_correct_answer_earns_full_points():
    result = grade_question(question("MultipleChoiceQuestion", "B", 2.5), "B")
    assert result["is_correct"] is True
    assert result["points"] == 2.5


def test_multiple_choice_wrong_answer_earns_nothing():
    result = grade_question(question("MultipleChoiceQuestion", "B", 2.5), "C")
    assert result["is_correct"] is False
    assert result["points"] == 0.0


def test_multiple_choice_compares_as_string_so_int_and_str_match():
    result = grade_question(question("MultipleChoiceQuestion", 3), "3")
    assert result["is_correct"] is True


@pytest.mark.parametrize("student_answer", ["true", "True", "TRUE"])
def test_true_false_is_case_insensitive(student_answer):
    result = grade_question(question("TrueFalseQuestion", "True"), student_answer)
    assert result["is_correct"] is True


def test_true_false_wrong_answer():
    result = grade_question(question("TrueFalseQuestion", "True"), "false")
    assert result["is_correct"] is False


def test_checkbox_order_does_not_matter():
    result = grade_question(
        question("CheckBoxQuestion", ["A", "B", "C"], 3.0), ["C", "A", "B"]
    )
    assert result["is_correct"] is True
    assert result["points"] == 3.0


def test_checkbox_partial_selection_is_not_correct():
    result = grade_question(question("CheckBoxQuestion", ["A", "B", "C"]), ["A", "B"])
    assert result["is_correct"] is False
    assert result["points"] == 0.0


def test_checkbox_extra_selection_is_not_correct():
    result = grade_question(
        question("CheckBoxQuestion", ["A", "B"]), ["A", "B", "C"]
    )
    assert result["is_correct"] is False


def test_checkbox_non_list_answer_is_handled_gracefully():
    result = grade_question(question("CheckBoxQuestion", ["A", "B"]), "A")
    assert result["is_correct"] is False


def test_short_answer_ignores_case_and_surrounding_whitespace():
    result = grade_question(question("ShortAnswerQuestion", "Cluj-Napoca"), "  cluj-napoca ")
    assert result["is_correct"] is True


def test_short_answer_empty_string_is_not_correct():
    result = grade_question(question("ShortAnswerQuestion", "Cluj"), "   ")
    assert result["is_correct"] is False


def test_short_answer_none_is_not_correct():
    result = grade_question(question("ShortAnswerQuestion", "Cluj"), None)
    assert result["is_correct"] is False


def test_long_answer_is_flagged_for_manual_review_and_auto_awards_nothing():
    result = grade_question(
        question("LongAnswerQuestion", None, 5.0), "A long essay answer."
    )
    assert result["manual_review"] is True
    assert result["points"] == 0.0


def test_unknown_question_type_earns_nothing_instead_of_crashing():
    result = grade_question(question("SomeFutureQuestionType", "x"), "x")
    assert result["is_correct"] is False
    assert result["points"] == 0.0


def test_missing_points_field_defaults_to_zero():
    result = grade_question({"type": "TrueFalseQuestion", "answer": "True"}, "True")
    assert result["is_correct"] is True
    assert result["points"] == 0.0


def test_null_points_field_does_not_crash():
    result = grade_question(
        {"type": "TrueFalseQuestion", "answer": "True", "points": None}, "True"
    )
    assert result["points"] == 0.0
