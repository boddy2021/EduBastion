import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault(
    "DATABASE_URL", "postgresql://test:test@localhost:5432/edubastion_test"
)
os.environ.setdefault("SECRET_KEY", "test-only-key-not-used-in-production")

os.environ.setdefault("AI_DETECTOR_ENABLED", "false")
os.environ.setdefault("AI_DETECTOR_PRELOAD", "false")
