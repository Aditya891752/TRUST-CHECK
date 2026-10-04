import pytest
from app.core.security import limiter

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Resets slowapi in-memory storage before each test to prevent 429 across large test suites."""
    try:
        limiter._storage.reset()
    except Exception:
        pass
    yield
    try:
        limiter._storage.reset()
    except Exception:
        pass
