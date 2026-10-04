"""
LLM Provider Factory for TrustCheck.
Automatically routes to Gemini (free tier) or Anthropic based on configured API keys.
"""

from typing import Any
from ..core.config import settings
from .gemini import GeminiProvider
from .anthropic import AnthropicProvider

def get_llm_provider() -> Any:
    """
    Returns GeminiProvider if GEMINI_API_KEY is configured,
    or AnthropicProvider if ANTHROPIC_API_KEY is configured.
    Defaults to GeminiProvider.
    """
    if settings.GEMINI_API_KEY:
        return GeminiProvider()
    if settings.ANTHROPIC_API_KEY:
        return AnthropicProvider()
    return GeminiProvider()
