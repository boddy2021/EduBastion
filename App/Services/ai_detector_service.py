import logging
import threading

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from . import ai_classifier_service
from ..Core.binoculars import binoculars_score, score_to_result
from ..config import (
    AI_DETECTOR_ENABLED,
    AI_DETECTOR_METHOD,
    AI_DETECTOR_OBSERVER_MODEL,
    AI_DETECTOR_PERFORMER_MODEL,
    AI_DETECTOR_BINOCULARS_THRESHOLD,
    AI_DETECTOR_MIN_TEXT_LENGTH,
    AI_DETECTOR_MAX_TOKENS,
    AI_DETECTOR_DTYPE,
)

logger = logging.getLogger(__name__)

_observer = None
_performer = None
_tokenizer = None
_load_lock = threading.Lock()
_load_started = False


def is_ready() -> bool:
    if AI_DETECTOR_METHOD == "classifier":
        return ai_classifier_service.is_ready()
    return _observer is not None


def warm_up_async() -> None:
    global _load_started

    if AI_DETECTOR_METHOD == "classifier":
        ai_classifier_service.warm_up_async()
        return

    if _load_started or _observer is not None:
        return
    _load_started = True

    def _run():
        try:
            _load()
        except Exception:
            logger.exception(
                "AI detector failed to load; detection stays disabled.")

    threading.Thread(target=_run, name="ai-detector-warmup", daemon=True).start()


def _load() -> None:
    global _observer, _performer, _tokenizer

    if _observer is not None:
        return

    with _load_lock:
        if _observer is not None:
            return

        logger.info(
            "Loading Binoculars model pair: observer=%s performer=%s",
            AI_DETECTOR_OBSERVER_MODEL,
            AI_DETECTOR_PERFORMER_MODEL,
        )

        tokenizer = AutoTokenizer.from_pretrained(AI_DETECTOR_OBSERVER_MODEL)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        dtype = getattr(torch, AI_DETECTOR_DTYPE, torch.float32)

        logger.info("[1/2] loading observer %s (%s)...",
                    AI_DETECTOR_OBSERVER_MODEL, AI_DETECTOR_DTYPE)
        observer = AutoModelForCausalLM.from_pretrained(
            AI_DETECTOR_OBSERVER_MODEL, dtype=dtype, low_cpu_mem_usage=True
        )
        logger.info("[1/2] observer ready.")

        logger.info("[2/2] loading performer %s...", AI_DETECTOR_PERFORMER_MODEL)
        performer = AutoModelForCausalLM.from_pretrained(
            AI_DETECTOR_PERFORMER_MODEL, dtype=dtype, low_cpu_mem_usage=True
        )
        logger.info("[2/2] performer ready.")

        if observer.config.vocab_size != performer.config.vocab_size:
            raise RuntimeError(
                "Observer and performer models must share a tokenizer "
                f"(vocab sizes {observer.config.vocab_size} vs "
                f"{performer.config.vocab_size})."
            )

        observer.eval()
        performer.eval()

        _tokenizer = tokenizer
        _observer = observer
        _performer = performer
        logger.info("Binoculars detector ready.")


def _mean_cross_entropy(logits: torch.Tensor, labels: torch.Tensor) -> float:
    shifted_logits = logits[..., :-1, :].contiguous()
    shifted_labels = labels[..., 1:].contiguous()

    loss = torch.nn.functional.cross_entropy(
        shifted_logits.view(-1, shifted_logits.size(-1)),
        shifted_labels.view(-1),
        reduction="mean",
    )
    return loss.item()


def _mean_cross_perplexity(
    observer_logits: torch.Tensor,
    performer_logits: torch.Tensor,
    chunk_size: int = 32,
) -> float:
    observer = observer_logits[..., :-1, :]
    performer = performer_logits[..., :-1, :]

    positions = observer.shape[1]
    if positions == 0:
        raise ValueError("Text too short to score")

    total = 0.0
    for start in range(0, positions, chunk_size):
        end = min(start + chunk_size, positions)

        observer_probs = torch.softmax(observer[:, start:end, :], dim=-1)
        performer_logprobs = torch.log_softmax(performer[:, start:end, :], dim=-1)

        total += -(observer_probs * performer_logprobs).sum(dim=-1).sum().item()

        del observer_probs, performer_logprobs

    return total / positions


def compute_binoculars_score(text: str) -> float:
    _load()

    encoding = _tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=AI_DETECTOR_MAX_TOKENS,
    )
    input_ids = encoding.input_ids

    if input_ids.shape[1] < 2:
        raise ValueError("Text too short to score")

    with torch.inference_mode():
        observer_logits = _observer(input_ids).logits
        observer_ce = _mean_cross_entropy(observer_logits, input_ids)

        performer_logits = _performer(input_ids).logits
        cross_ppl = _mean_cross_perplexity(observer_logits, performer_logits)

    del observer_logits, performer_logits

    return binoculars_score(observer_ce, cross_ppl)


def check_ai_probability(text: str) -> dict:
    empty_result = {
        "verdict": "not_analyzed",
        "is_ai": False,
        "confidence": 0.0,
        "score": None,
    }

    if not AI_DETECTOR_ENABLED:
        return empty_result

    if not text or len(text.strip()) < AI_DETECTOR_MIN_TEXT_LENGTH:
        return empty_result

    if not is_ready():
        warm_up_async()
        logger.warning(
            "AI detector not ready yet; submission scored without AI detection.")
        return empty_result

    try:
        if AI_DETECTOR_METHOD == "classifier":
            return ai_classifier_service.check(text)
        score = compute_binoculars_score(text)
    except Exception:
        logger.exception("Text analysis failed; defaulting to human-written.")
        return empty_result

    return score_to_result(score, AI_DETECTOR_BINOCULARS_THRESHOLD)
