"""AI text detection with a supervised classifier.

Runs locally rather than calling a detection API: exam answers are personal
data and shouldn't leave the institution.

Long answers exceed the 512-token window, so they're scored in chunks and
averaged. Averaging rather than max, otherwise a long answer gets flagged
just for being long.
"""

import logging
import threading

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from ..config import (
    AI_CLASSIFIER_MODEL,
    AI_CLASSIFIER_THRESHOLD,
    AI_DETECTOR_DTYPE,
)

logger = logging.getLogger(__name__)

WORDS_PER_CHUNK = 320
MAX_CHUNKS = 8

_model = None
_tokenizer = None
_lock = threading.Lock()
_loading = False


def is_ready() -> bool:
    return _model is not None


def load() -> None:
    global _model, _tokenizer

    if _model is not None:
        return

    with _lock:
        if _model is not None:
            return

        logger.info("Loading AI classifier %s...", AI_CLASSIFIER_MODEL)
        tok = AutoTokenizer.from_pretrained(AI_CLASSIFIER_MODEL)
        dtype = getattr(torch, AI_DETECTOR_DTYPE, torch.float32)
        mdl = AutoModelForSequenceClassification.from_pretrained(
            AI_CLASSIFIER_MODEL, dtype=dtype
        )
        mdl.eval()

        _tokenizer = tok
        _model = mdl
        logger.info("AI classifier ready. Labels: %s", mdl.config.id2label)


def warm_up_async() -> None:
    global _loading
    if _loading or _model is not None:
        return
    _loading = True

    def run():
        try:
            load()
        except Exception:
            logger.exception("Classifier failed to load; detection disabled.")

    threading.Thread(target=run, name="ai-classifier-warmup", daemon=True).start()


def _ai_label_index() -> int:
    """Read from config, so swapping checkpoints can't silently invert verdicts."""
    for idx, name in _model.config.id2label.items():
        if any(k in str(name).lower()
               for k in ("chatgpt", "ai", "machine", "generated", "fake")):
            return int(idx)
    return 1


def _chunks(text: str) -> list[str]:
    words = text.split()
    if len(words) <= WORDS_PER_CHUNK:
        return [text]

    out = []
    for i in range(0, len(words), WORDS_PER_CHUNK):
        piece = " ".join(words[i:i + WORDS_PER_CHUNK])
        if len(piece.split()) >= 20:
            out.append(piece)
        if len(out) >= MAX_CHUNKS:
            break
    return out or [text]


def ai_probability(text: str) -> float:
    load()
    ai_idx = _ai_label_index()

    probs = []
    with torch.inference_mode():
        for piece in _chunks(text):
            enc = _tokenizer(piece, return_tensors="pt",
                             truncation=True, max_length=512)
            logits = _model(input_ids=enc["input_ids"],
                            attention_mask=enc["attention_mask"]).logits
            probs.append(torch.softmax(logits.float(), dim=-1)[0, ai_idx].item())

    return sum(probs) / len(probs)


def check(text: str) -> dict:
    """Three verdicts: between 0.5 and the threshold the model leans machine
    but not enough to raise to a professor, and saying so beats rounding it
    down to "human"."""
    p = ai_probability(text)

    if p >= AI_CLASSIFIER_THRESHOLD:
        verdict, confidence = "ai", p * 100
    elif p >= 0.5:
        verdict, confidence = "uncertain", p * 100
    else:
        verdict, confidence = "human", (1 - p) * 100

    return {
        "verdict": verdict,
        "is_ai": verdict == "ai",
        "confidence": round(confidence, 1),
        "score": round(p, 4),
    }
