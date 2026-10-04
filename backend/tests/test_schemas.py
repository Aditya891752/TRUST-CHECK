import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient
from app.main import app
from app.api.schemas import (
    CheckRequest,
    CheckResponse,
    ClaimSchema,
    EvidenceSchema,
    SpanSchema,
    SummarySchema,
    Verdict
)

client = TestClient(app)

def test_check_request_valid():
    req = CheckRequest(answer="Python was released in 1991.")
    assert req.answer == "Python was released in 1991."
    assert req.question is None

def test_check_request_with_question():
    req = CheckRequest(answer="Python was released in 1991.", question="When was Python released?")
    assert req.question == "When was Python released?"

def test_check_request_empty_rejected():
    with pytest.raises(ValidationError):
        CheckRequest(answer="")

def test_check_request_whitespace_rejected():
    with pytest.raises(ValidationError):
        CheckRequest(answer="   \n\t  ")

def test_check_request_too_long_rejected():
    with pytest.raises(ValidationError):
        CheckRequest(answer="a" * 4001)

def test_check_request_question_too_long_rejected():
    with pytest.raises(ValidationError):
        CheckRequest(answer="Valid answer", question="q" * 501)

def test_span_validation():
    span = SpanSchema(start=0, end=10)
    assert span.start == 0
    assert span.end == 10

    with pytest.raises(ValidationError):
        SpanSchema(start=10, end=5)

def test_claim_supported_without_evidence_downgrades():
    # Per PRD: 'supported' requires at least one cited evidence item.
    # When none provided, validator automatically safeguards it to 'uncertain'.
    claim = ClaimSchema(
        id="c1",
        text="A statement.",
        verdict=Verdict.SUPPORTED,
        reasoning="Some reasoning.",
        evidence=[]
    )
    assert claim.verdict == Verdict.UNCERTAIN

def test_claim_supported_with_evidence():
    evidence = EvidenceSchema(
        id="e1",
        title="Python History",
        url="https://python.org",
        snippet="Released in 1991.",
        retrieved_at="2026-10-04T10:00:00Z"
    )
    claim = ClaimSchema(
        id="c1",
        text="A statement.",
        verdict=Verdict.SUPPORTED,
        reasoning="Some reasoning.",
        evidence=[evidence]
    )
    assert claim.verdict == Verdict.SUPPORTED

def test_api_check_valid_endpoint():
    response = client.post("/api/v1/check", json={"answer": "The Earth orbits the Sun."})
    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert data["request_id"].startswith("req_")
    assert "summary" in data
    assert "claims" in data

def test_api_check_invalid_payload_returns_generic_error():
    response = client.post("/api/v1/check", json={"answer": "   "})
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "bad_request"
    assert "request_id" in data["error"]
    assert "traceback" not in data

def test_api_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
