"""Test configuration.

Provides a throwaway environment so the suite runs without a real database,
a real .env file, or a network connection.
"""

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault(
    "DATABASE_URL", "postgresql://test:test@localhost:5432/edubastion_test"
)
os.environ.setdefault("SECRET_KEY", "test-only-key-not-used-in-production")

# Never download ~2.5 GB of models during a test run.
os.environ.setdefault("AI_DETECTOR_ENABLED", "false")
os.environ.setdefault("AI_DETECTOR_PRELOAD", "false")
