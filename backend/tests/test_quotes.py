import pytest
from app.pipeline.verifier import normalize_text_for_match, truncate_at_word_boundary, verify_claims
from app.api.schemas import Verdict

def test_normalize_text_for_match():
    assert normalize_text_for_match("  Python   was   RELEASED   in 1991. ") == "python was released in 1991."

def test_truncate_at_word_boundary():
    long_str = "The quick brown fox jumps over the lazy dog."
    res = truncate_at_word_boundary(long_str, 20)
    assert len(res) <= 23  # 20 + "..."
    assert not res.startswith("The quick brown fox j")
    assert res == "The quick brown fox..."

@pytest.mark.anyio
async def test_quote_verified_when_in_snippet():
    claims = [{"id": "c1", "text": "Python was released in 1991.", "flags": []}]
    evidence = [[{
        "id": "e1",
        "title": "History",
        "url": "https://example.com",
        "snippet": "Python was created by Guido van Rossum and released in 1991.",
        "retrieved_at": "2026-10-04"
    }]]

    # Mock provider will return the first sentence as quote
    verified = await verify_claims(claims, evidence)
    assert len(verified) == 1
    assert verified[0].verdict == Verdict.SUPPORTED
    assert len(verified[0].evidence) == 1
    assert verified[0].evidence[0].quote is not None
    assert "released in 1991" in verified[0].evidence[0].quote

@pytest.mark.anyio
async def test_fabricated_quote_dropped():
    # Test custom mock returning a quote not present in snippet
    class FakeProvider:
        async def verify_claim(self, claim_text, evidence_items):
            return {
                "verdict": "supported",
                "reasoning": "Claim is supported.",
                "evidence": [{
                    "id": "e1",
                    "stance": "supports",
                    "quote": "This sentence was completely fabricated by the model."
                }]
            }

    claims = [{"id": "c1", "text": "Python release", "flags": []}]
    evidence = [[{
        "id": "e1",
        "title": "History",
        "url": "https://example.com",
        "snippet": "Real snippet without the fabricated sentence.",
        "retrieved_at": "2026-10-04"
    }]]

    verified = await verify_claims(claims, evidence, provider=FakeProvider())
    assert len(verified) == 1
    # Fabricated quote must be rejected (quote is None)
    assert verified[0].evidence[0].quote is None
