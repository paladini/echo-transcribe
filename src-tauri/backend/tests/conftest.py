"""Point data dirs at a temp folder before `main` imports and mkdirs."""

import os
import sys
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

_TEST_DATA = Path(tempfile.mkdtemp(prefix="echo-transcribe-test-"))
os.environ["ECHO_DATA_DIR"] = str(_TEST_DATA)
