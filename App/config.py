"""Settings from the environment / a gitignored .env. No secrets in source."""

import os
import secrets
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _load_dotenv() -> None:
    """Minimal .env loader, so the project keeps zero extra runtime deps."""
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


_load_dotenv()


PLACEHOLDER = "CHANGE_ME"


def _required(name: str) -> str:
    """Reject unedited placeholders. Checked anywhere in the string, not just
    at the start -- a URL hides it in the middle: postgres://u:CHANGE_ME@h/db."""
    value = os.environ.get(name)

    if not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}.\n"
            f"Copy .env.example to .env and fill in a real value."
        )

    if PLACEHOLDER in value:
        raise RuntimeError(
            f"{name} still contains the placeholder '{PLACEHOLDER}'.\n"
            f"Edit .env and replace it with a real value."
        )

    return value


# --- Database ---------------------------------------------------------------
DATABASE_URL: str = _required("DATABASE_URL")

# --- Authentication ---------------------------------------------------------
SECRET_KEY: str = os.environ.get("SECRET_KEY") or secrets.token_urlsafe(48)
if PLACEHOLDER in SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY still contains the placeholder value. Generate one with:\n"
        '  python -c "import secrets; print(secrets.token_urlsafe(48))"'
    )

ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "720")
)

# --- CORS -------------------------------------------------------------------
CORS_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

# --- File uploads -----------------------------------------------------------
UPLOAD_DIR: str = os.environ.get("UPLOAD_DIR", "uploaded_files")
PROCTORING_IMAGE_DIR: str = os.environ.get(
    "PROCTORING_IMAGE_DIR", "proctoring_images")

# --- AI text detection ------------------------------------------------------
# Master switch for AI text detection.
AI_DETECTOR_ENABLED: bool = os.environ.get(
    "AI_DETECTOR_ENABLED", "true"
).strip().lower() in ("1", "true", "yes", "on")

# Load at startup instead of on the first submission mid-exam.
AI_DETECTOR_PRELOAD: bool = os.environ.get(
    "AI_DETECTOR_PRELOAD", "false"
).strip().lower() in ("1", "true", "yes", "on")

# "classifier" - supervised detector, ~500MB, works on modest hardware
# "binoculars" - zero-shot, needs a large model pair to be competitive
AI_DETECTOR_METHOD: str = os.environ.get(
    "AI_DETECTOR_METHOD", "classifier").strip().lower()

AI_CLASSIFIER_MODEL: str = os.environ.get(
    "AI_CLASSIFIER_MODEL", "Hello-SimpleAI/chatgpt-detector-roberta")

# P(machine-generated) at or above this is raised to the professor.
# High on purpose: a false accusation costs more than a missed detection.
AI_CLASSIFIER_THRESHOLD: float = float(
    os.environ.get("AI_CLASSIFIER_THRESHOLD", "0.90"))

# Binoculars needs two models sharing a tokenizer: a base and its instruct twin.
AI_DETECTOR_OBSERVER_MODEL: str = os.environ.get(
    "AI_DETECTOR_OBSERVER_MODEL", "Qwen/Qwen3-0.6B-Base"
)
AI_DETECTOR_PERFORMER_MODEL: str = os.environ.get(
    "AI_DETECTOR_PERFORMER_MODEL", "Qwen/Qwen3-0.6B"
)

# Below this ratio = flagged. Model-pair specific; re-run calibrate_detector.py
# after changing either model.
AI_DETECTOR_BINOCULARS_THRESHOLD: float = float(
    os.environ.get("AI_DETECTOR_BINOCULARS_THRESHOLD", "0.9015")
)

AI_DETECTOR_MIN_TEXT_LENGTH: int = int(
    os.environ.get("AI_DETECTOR_MIN_TEXT_LENGTH", "60")
)

# Memory scales linearly with this (~600KB/token per model on Qwen3).
AI_DETECTOR_MAX_TOKENS: int = int(os.environ.get("AI_DETECTOR_MAX_TOKENS", "384"))

# bfloat16 halves weight memory. Re-calibrate after changing it.
AI_DETECTOR_DTYPE: str = os.environ.get("AI_DETECTOR_DTYPE", "float32").strip()
