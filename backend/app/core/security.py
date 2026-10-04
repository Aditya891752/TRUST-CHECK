from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from .config import settings

def setup_cors(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=r"^chrome-extension://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])

_daily_requests = 0

def check_daily_cap() -> bool:
    global _daily_requests
    if _daily_requests >= settings.DAILY_REQUEST_CAP:
        return False
    _daily_requests += 1
    return True

from collections import defaultdict
import threading

_active_streams = defaultdict(int)
_streams_lock = threading.Lock()

def acquire_stream_slot(ip: str) -> bool:
    """Enforces MAX_CONCURRENT_STREAMS_PER_IP per client IP."""
    with _streams_lock:
        if _active_streams[ip] >= settings.MAX_CONCURRENT_STREAMS_PER_IP:
            return False
        _active_streams[ip] += 1
        return True

def release_stream_slot(ip: str):
    """Releases an active stream slot for an IP."""
    with _streams_lock:
        if _active_streams[ip] > 0:
            _active_streams[ip] -= 1
            if _active_streams[ip] == 0:
                del _active_streams[ip]
