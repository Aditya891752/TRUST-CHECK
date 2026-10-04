"""
Unit tests for Feature F1 (Corrected Answer and deterministic safety validation).
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.schemas import ClaimSchema, Verdict, ChangeAction
from app.pipeline.corrected_answer import validate_corrected_answer, generate_corrected_answer
from app.core.config import settings

client = TestClient(app)

def test_all_supported_claims_kept():
    claims = [
        ClaimSchema(
            id="c1",
            text="Python was released in 1991.",
            verdict=Verdict.SUPPORTED,
            reasoning="Verified.",
            evidence=[{"id": "e1", "title": "Doc", "url": "https://example.com", "snippet": "Released in 1991.", "retrieved_at": "2026-10-04", "stance": "supports"}]
        )
    ]
    orig = "Python was released in 1991."
    res = validate_corrected_answer(
        text=orig,
        raw_changes=[{"claim_id": "c1", "action": "kept"}],
        original_answer=orig,
        claims=claims,
        language="en"
    )
    assert res is not None
    assert res.text == orig
    assert len(res.changes) == 1
    assert res.changes[0].action == ChangeAction.KEPT

def test_hedged_and_removed_consistency():
    claims = [
        ClaimSchema(
            id="c1",
            text="Python was released in 1991.",
            verdict=Verdict.SUPPORTED,
            reasoning="Verified.",
            evidence=[{"id": "e1", "title": "Doc", "url": "https://example.com", "snippet": "Released in 1991.", "retrieved_at": "2026-10-04", "stance": "supports"}]
        ),
        ClaimSchema(
            id="c2",
            text="Python is the most popular language.",
            verdict=Verdict.UNCERTAIN,
            reasoning="Ranking surveys vary.",
            evidence=[]
        ),
        ClaimSchema(
            id="c3",
            text="Python 4.0 was released in 2022.",
            verdict=Verdict.UNSUPPORTED,
            reasoning="Python 4.0 does not exist.",
            evidence=[]
        )
    ]
    orig = "Python was released in 1991. Python is the most popular language. Python 4.0 was released in 2022."
    corrected_text = "Python was released in 1991. According to some reports, Python is widely used."

    # Valid consistent actions: c1=kept, c2=hedged, c3=removed
    res = validate_corrected_answer(
        text=corrected_text,
        raw_changes=[
            {"claim_id": "c1", "action": "kept"},
            {"claim_id": "c2", "action": "hedged"},
            {"claim_id": "c3", "action": "removed"}
        ],
        original_answer=orig,
        claims=claims,
        language="en"
    )
    assert res is not None
    assert res.changes[0].action == ChangeAction.KEPT
    assert res.changes[1].action == ChangeAction.HEDGED
    assert res.changes[2].action == ChangeAction.REMOVED

def test_validation_rejects_inconsistent_actions():
    claims = [
        ClaimSchema(
            id="c1",
            text="Python was released in 1991.",
            verdict=Verdict.SUPPORTED,
            reasoning="Verified.",
            evidence=[{"id": "e1", "title": "Doc", "url": "https://example.com", "snippet": "Released in 1991.", "retrieved_at": "2026-10-04", "stance": "supports"}]
        )
    ]
    orig = "Python was released in 1991."
    # Supported claim cannot be marked "removed"
    res = validate_corrected_answer(
        text="",
        raw_changes=[{"claim_id": "c1", "action": "removed"}],
        original_answer=orig,
        claims=claims,
        language="en"
    )
    assert res is None

def test_validation_rejects_invented_numbers():
    claims = [
        ClaimSchema(
            id="c1",
            text="Python was released in 1991.",
            verdict=Verdict.SUPPORTED,
            reasoning="Verified.",
            evidence=[{"id": "e1", "title": "Doc", "url": "https://example.com", "snippet": "Released in 1991.", "retrieved_at": "2026-10-04", "stance": "supports"}]
        )
    ]
    orig = "Python was released in 1991."
    # Text introduces invented number 2025
    invented_text = "Python was released in 1991 and updated in 2025."
    res = validate_corrected_answer(
        text=invented_text,
        raw_changes=[{"claim_id": "c1", "action": "kept"}],
        original_answer=orig,
        claims=claims,
        language="en"
    )
    assert res is None

def test_validation_rejects_urls_and_html():
    claims = [
        ClaimSchema(
            id="c1",
            text="Python was released in 1991.",
            verdict=Verdict.SUPPORTED,
            reasoning="Verified.",
            evidence=[{"id": "e1", "title": "Doc", "url": "https://example.com", "snippet": "Released in 1991.", "retrieved_at": "2026-10-04", "stance": "supports"}]
        )
    ]
    orig = "Python was released in 1991."
    # Text contains a link
    bad_text = "Python was released in 1991 (see https://python.org)."
    res = validate_corrected_answer(
        text=bad_text,
        raw_changes=[{"claim_id": "c1", "action": "kept"}],
        original_answer=orig,
        claims=claims,
        language="en"
    )
    assert res is None

@pytest.mark.anyio
async def test_api_returns_corrected_answer():
    ans = "Python was created by Guido van Rossum and first released in 1991. The Moon orbits Earth in about 27 days."
    res = client.post("/api/v1/check", json={"answer": ans})
    assert res.status_code == 200
    data = res.json()
    assert "corrected_answer" in data
    assert data["corrected_answer"] is not None
    assert len(data["corrected_answer"]["text"]) > 0
    assert len(data["corrected_answer"]["changes"]) > 0

@pytest.mark.anyio
async def test_correction_disabled_flag(monkeypatch):
    monkeypatch.setattr(settings, "CORRECTION_ENABLED", False)
    ans = "Python was created by Guido van Rossum and first released in 1991."
    res = client.post("/api/v1/check", json={"answer": ans})
    assert res.status_code == 200
    data = res.json()
    assert data["corrected_answer"] is None
