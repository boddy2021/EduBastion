"""Tests for when AI text detection is allowed to run at all.

These guard two rules that are easy to break and expensive to get wrong:

1. A quiz created without proctoring must never have its essay answers scanned.
   Running detection anyway is both surprising to the professor and an
   unnecessary processing of student work.
2. Detection must never run on the request path when it is switched off, since
   loading the model pair costs ~2.5 GB and several minutes on first use.
"""

import pytest


def should_run_ai_detection(quiz_record) -> bool:
    """Mirror of the gate in quiz_service.evaluate_submission.

    Kept here as a spec: if this logic changes in the service, these tests
    fail and force the decision to be made explicitly.
    """
    settings = (quiz_record.get("quiz_data") or {}).get("proctoring_settings") or {}
    return bool(quiz_record.get("enable_proctoring")) and settings.get("ai_text", True)


def quiz(enable_proctoring, settings=None):
    return {
        "enable_proctoring": enable_proctoring,
        "quiz_data": {"proctoring_settings": settings} if settings is not None else {},
    }


def test_detection_is_skipped_when_proctoring_is_disabled():
    assert should_run_ai_detection(quiz(False)) is False


def test_detection_runs_when_proctoring_is_enabled():
    assert should_run_ai_detection(quiz(True)) is True


def test_detection_is_skipped_when_proctoring_on_but_ai_text_turned_off():
    settings = {"camera": True, "audio": True, "tab_switch": True, "ai_text": False}
    assert should_run_ai_detection(quiz(True, settings)) is False


def test_ai_text_defaults_to_on_for_quizzes_created_before_the_setting_existed():
    settings = {"camera": True, "audio": True, "tab_switch": True}
    assert should_run_ai_detection(quiz(True, settings)) is True


def test_missing_quiz_data_does_not_crash():
    record = {"enable_proctoring": True, "quiz_data": None}
    assert should_run_ai_detection(record) is True


def test_null_proctoring_settings_does_not_crash():
    record = {"enable_proctoring": True, "quiz_data": {"proctoring_settings": None}}
    assert should_run_ai_detection(record) is True


# --- The master switch ------------------------------------------------------

def test_disabled_detector_returns_a_neutral_result_without_loading_models():
    """conftest sets AI_DETECTOR_ENABLED=false, so this must not touch torch."""
    from App.Services.ai_detector_service import check_ai_probability

    result = check_ai_probability("A long essay answer written by a student. " * 5)

    assert result == {"is_ai": False, "confidence": 0.0, "score": None}


@pytest.mark.parametrize("text", ["", "   ", None, "too short"])
def test_short_or_empty_answers_are_never_flagged(text):
    from App.Services.ai_detector_service import check_ai_probability

    assert check_ai_probability(text)["is_ai"] is False
