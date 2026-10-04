"""
Tests for Feature F2 (Live Streaming SSE Results).
"""

import pytest
import json
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_stream_returns_sse_and_lifecycle_events():
    ans = "Python was created by Guido van Rossum and first released in 1991. Python 4.0 was released in 2022."
    response = client.post("/api/v1/check/stream", json={"answer": ans})
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")

    lines = response.text.split("\n")
    events = []
    current_event = None

    for line in lines:
        if line.startswith("event: "):
            current_event = line.replace("event: ", "").strip()
        elif line.startswith("data: "):
            data_str = line.replace("data: ", "").strip()
            data = json.loads(data_str)
            events.append((current_event, data))
            current_event = None

    event_names = [e[0] for e in events]
    # Meta must be first
    assert event_names[0] == "meta"
    assert "language" in events[0][1]
    # Claims event after extraction
    assert "claims" in event_names
    # Claim results emitted
    assert "claim_result" in event_names
    # Exactly one terminal event: 'done'
    assert event_names[-1] == "done"
    assert "summary" in events[-1][1]

def test_stream_concurrent_limit_exceeded():
    from app.core.security import acquire_stream_slot, release_stream_slot
    test_ip = "127.0.0.1"

    # Fill stream slots
    assert acquire_stream_slot(test_ip) is True
    assert acquire_stream_slot(test_ip) is True
    # 3rd slot exceeds limit of 2
    assert acquire_stream_slot(test_ip) is False

    # Clean up slots
    release_stream_slot(test_ip)
    release_stream_slot(test_ip)
    assert acquire_stream_slot(test_ip) is True
    release_stream_slot(test_ip)

def test_streaming_disabled_returns_404(monkeypatch):
    monkeypatch.setattr(settings, "STREAMING_ENABLED", False)
    response = client.post("/api/v1/check/stream", json={"answer": "Python was released in 1991."})
    assert response.status_code == 404

def test_invalid_input_before_stream_returns_400():
    response = client.post("/api/v1/check/stream", json={"answer": "   "})
    assert response.status_code == 400
    assert "application/json" in response.headers.get("content-type", "")

def test_non_streaming_endpoint_retains_full_parity():
    ans = "Python was created by Guido van Rossum and first released in 1991."
    response = client.post("/api/v1/check", json={"answer": ans})
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "claims" in data
    assert len(data["claims"]) >= 1
    assert "corrected_answer" in data
