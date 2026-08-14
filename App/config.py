import os
import secrets
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _load_dotenv() -> None:
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


DATABASE_URL: str = _required("DATABASE_URL")

SECRET_KEY: str = os.environ.get("SECRET_KEY") or secrets.token_urlsafe(48)
if PLACEHOLDER in SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY still contains the placeholder value. Generate one with:\n"
        '  python -c "import secrets; print(secrets.token_urlsafe(48))"'
    )

ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "720")
)

CORS_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

UPLOAD_DIR: str = os.environ.get("UPLOAD_DIR", "uploaded_files")
PROCTORING_IMAGE_DIR: str = os.environ.get(
    "PROCTORING_IMAGE_DIR", "proctoring_images")

AI_DETECTOR_ENABLED: bool = os.environ.get(
    "AI_DETECTOR_ENABLED", "true"
).strip().lower() in ("1", "true", "yes", "on")

AI_DETECTOR_PRELOAD: bool = os.environ.get(
    "AI_DETECTOR_PRELOAD", "false"
).strip().lower() in ("1", "true", "yes", "on")

AI_DETECTOR_METHOD: str = os.environ.get(
    "AI_DETECTOR_METHOD", "classifier").strip().lower()

AI_CLASSIFIER_MODEL: str = os.environ.get(
    "AI_CLASSIFIER_MODEL", "Hello-SimpleAI/chatgpt-detector-roberta")

AI_CLASSIFIER_THRESHOLD: float = float(
    os.environ.get("AI_CLASSIFIER_THRESHOLD", "0.90"))

AI_DETECTOR_OBSERVER_MODEL: str = os.environ.get(
    "AI_DETECTOR_OBSERVER_MODEL", "Qwen/Qwen3-0.6B-Base"
)
AI_DETECTOR_PERFORMER_MODEL: str = os.environ.get(
    "AI_DETECTOR_PERFORMER_MODEL", "Qwen/Qwen3-0.6B"
)

AI_DETECTOR_BINOCULARS_THRESHOLD: float = float(
    os.environ.get("AI_DETECTOR_BINOCULARS_THRESHOLD", "0.9015")
)

AI_DETECTOR_MIN_TEXT_LENGTH: int = int(
    os.environ.get("AI_DETECTOR_MIN_TEXT_LENGTH", "60")
)

AI_DETECTOR_MAX_TOKENS: int = int(os.environ.get("AI_DETECTOR_MAX_TOKENS", "384"))

AI_DETECTOR_DTYPE: str = os.environ.get("AI_DETECTOR_DTYPE", "float32").strip()
