import pytest

from App.Core.binoculars import (
    binoculars_score,
    score_to_result,
    MIN_CONFIDENCE,
    MAX_CONFIDENCE,
)


def test_score_is_the_ratio_of_the_two_cross_entropies():
    assert binoculars_score(2.0, 4.0) == 0.5


def test_machine_like_text_scores_lower_than_human_like_text():
    machine_like = binoculars_score(1.0, 3.0)
    human_like = binoculars_score(2.5, 3.0)
    assert machine_like < human_like


def test_zero_cross_perplexity_is_rejected_instead_of_dividing_by_zero():
    with pytest.raises(ValueError):
        binoculars_score(2.0, 0.0)


def test_negative_cross_perplexity_is_rejected():
    with pytest.raises(ValueError):
        binoculars_score(2.0, -1.0)


def test_score_above_threshold_is_reported_as_human():
    result = score_to_result(1.2, threshold=0.9)
    assert result["is_ai"] is False
    assert result["verdict"] == "human"


def test_score_exactly_at_threshold_is_not_flagged():
    result = score_to_result(0.9, threshold=0.9)
    assert result["is_ai"] is False
    assert result["verdict"] == "human"


def test_human_verdict_also_reports_a_confidence():
    result = score_to_result(1.3, threshold=0.9)
    assert result["confidence"] >= MIN_CONFIDENCE


def test_human_confidence_grows_the_further_above_the_threshold():
    near = score_to_result(0.92, threshold=0.9)["confidence"]
    far = score_to_result(1.35, threshold=0.9)["confidence"]
    assert far > near


def test_human_confidence_saturates_instead_of_exceeding_the_cap():
    result = score_to_result(99.0, threshold=0.9)
    assert result["confidence"] == MAX_CONFIDENCE


def test_a_score_sitting_on_the_threshold_is_a_coin_flip_in_both_directions():
    just_below = score_to_result(0.8999, threshold=0.9)["confidence"]
    just_above = score_to_result(0.9001, threshold=0.9)["confidence"]
    assert just_below == MIN_CONFIDENCE
    assert just_above == MIN_CONFIDENCE


def test_verdict_is_ai_below_and_human_above():
    assert score_to_result(0.4, threshold=0.9)["verdict"] == "ai"
    assert score_to_result(1.4, threshold=0.9)["verdict"] == "human"


def test_score_below_threshold_is_flagged():
    result = score_to_result(0.5, threshold=0.9)
    assert result["is_ai"] is True
    assert result["confidence"] >= MIN_CONFIDENCE


def test_confidence_never_drops_below_the_floor():
    result = score_to_result(0.8999, threshold=0.9)
    assert result["confidence"] >= MIN_CONFIDENCE


def test_confidence_is_capped_below_absolute_certainty():
    result = score_to_result(0.0001, threshold=0.9)
    assert result["confidence"] <= MAX_CONFIDENCE


def test_confidence_increases_as_score_falls_further_below_threshold():
    near = score_to_result(0.85, threshold=0.9)["confidence"]
    far = score_to_result(0.30, threshold=0.9)["confidence"]
    assert far > near


def test_raw_score_is_returned_for_auditability():
    result = score_to_result(0.4242, threshold=0.9)
    assert result["score"] == 0.4242


def test_threshold_is_configurable_and_actually_changes_the_verdict():
    score = 0.95
    assert score_to_result(score, threshold=0.9)["is_ai"] is False
    assert score_to_result(score, threshold=1.0)["is_ai"] is True
