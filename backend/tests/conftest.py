import sys
from pathlib import Path


# Ensure backend package root is importable when pytest runs from repository root.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
