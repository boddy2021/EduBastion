import importlib.util

import pytest

needs_ml_stack = pytest.mark.skipif(
    importlib.util.find_spec("torch") is None
    or importlib.util.find_spec("transformers") is None,
    reason="torch and transformers are not installed",
)


def should_run_ai_detection(quiz_record) -> bool:
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


@needs_ml_stack
def test_disabled_detector_returns_a_neutral_result_without_loading_models():
    from App.Services.ai_detector_service import check_ai_probability

    result = check_ai_probability("A long essay answer written by a student. " * 5)

    assert result == {"is_ai": False, "confidence": 0.0, "score": None}


@needs_ml_stack
@pytest.mark.parametrize("text", ["", "   ", None, "too short"])
def test_short_or_empty_answers_are_never_flagged(text):
    from App.Services.ai_detector_service import check_ai_probability

    assert check_ai_probability(text)["is_ai"] is False
