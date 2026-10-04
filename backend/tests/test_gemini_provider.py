import pytest
from app.providers.gemini import GeminiProvider
from app.providers.factory import get_llm_provider
from app.core.config import settings

@pytest.mark.anyio
async def test_gemini_provider_mock_fallback():
    provider = GeminiProvider(api_key="")
    claims = await provider.extract_claims_and_queries("The Moon is a satellite. It orbits Earth.")
    assert len(claims) >= 1
    assert "text" in claims[0]

    verified = await provider.verify_claim(
        claim_text="The Moon orbits Earth.",
        evidence_items=[{"id": "e1", "title": "Moon", "snippet": "The Moon orbits Earth."}]
    )
    assert verified["verdict"] == "supported"
    assert len(verified["evidence"]) == 1

def test_provider_factory_routing():
    # When GEMINI_API_KEY is configured
    original_gemini = settings.GEMINI_API_KEY
    try:
        settings.GEMINI_API_KEY = "test_gemini_key"
        p = get_llm_provider()
        assert isinstance(p, GeminiProvider)
        assert p.api_key == "test_gemini_key"
    finally:
        settings.GEMINI_API_KEY = original_gemini
