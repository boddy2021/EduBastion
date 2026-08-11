"""Binoculars scoring maths (Hans et al., ICML 2024, arXiv:2401.12070).

Split out from the service so it can be tested without loading the models.
"""

MIN_CONFIDENCE = 50.0
MAX_CONFIDENCE = 99.9

# scores are unbounded above, so saturate the "human" side somewhere:
# 1.5x threshold reads as ~99.9% human
HUMAN_MARGIN_SPAN = 0.5


def binoculars_score(observer_ce: float, cross_ppl: float) -> float:
    """observer cross-entropy / cross-perplexity. Lower = more machine-like."""
    if cross_ppl <= 0:
        raise ValueError("cross_ppl must be positive")
    return observer_ce / cross_ppl


def _scaled_confidence(margin: float) -> float:
    conf = MIN_CONFIDENCE + margin * (MAX_CONFIDENCE - MIN_CONFIDENCE)
    return round(max(MIN_CONFIDENCE, min(MAX_CONFIDENCE, conf)), 1)


def score_to_result(score: float, threshold: float) -> dict:
    """Verdict + confidence, reported in both directions.

    "not flagged" and "checked, reads as human" are different claims and the
    professor needs to tell them apart. Confidence floors at 50 either way —
    a score sitting on the threshold is a coin flip.
    """
    if score < threshold:
        margin = (threshold - score) / threshold
        return {
            "verdict": "ai",
            "is_ai": True,
            "confidence": _scaled_confidence(margin),
            "score": round(score, 4),
        }

    margin = min(1.0, (score - threshold) / (threshold * HUMAN_MARGIN_SPAN))
    return {
        "verdict": "human",
        "is_ai": False,
        "confidence": _scaled_confidence(margin),
        "score": round(score, 4),
    }
