"""
Google Gemini API integration for TrustCheck (Free Tier Support).
Uses Gemini 2.0 Flash / 1.5 Flash with structured JSON outputs.
"""

import json
import re
import logging
from typing import List, Dict, Any, Optional
import httpx
from ..core.config import settings, MAX_CLAIMS
from .anthropic import EXTRACTION_SYSTEM_PROMPT, VERIFICATION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

class GeminiProvider:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL or "gemini-2.0-flash"
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=20.0)
        return self._client

    async def extract_claims_and_queries(
        self,
        answer: str,
        question: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Extract atomic claims and search queries using Gemini."""
        if not self.api_key:
            return self._mock_extract(answer)

        user_content = f"<answer>\n{answer}\n</answer>"
        if question:
            user_content = f"<question>\n{question}\n</question>\n" + user_content

        payload = {
            "system_instruction": {
                "parts": [{"text": EXTRACTION_SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_content}]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "responseMimeType": "application/json"
            }
        }

        url = f"{GEMINI_API_ENDPOINT.format(model=self.model)}?key={self.api_key}"

        for attempt in range(2):
            try:
                client = await self._get_client()
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_text = parts[0].get("text", "").strip()
                            cleaned = self._clean_json(raw_text)
                            parsed = json.loads(cleaned)
                            claims = parsed.get("claims", [])
                            if isinstance(claims, list) and len(claims) > 0:
                                return claims[:MAX_CLAIMS]
                else:
                    logger.warning("Gemini extract error %s: %s", response.status_code, response.text[:200])
            except Exception as e:
                logger.warning("Gemini extract attempt %s failed: %s", attempt + 1, e)
                if attempt == 1:
                    break

        return self._mock_extract(answer)

    async def verify_claim(
        self,
        claim_text: str,
        evidence_items: List[Dict[str, Any]],
        response_language: str = "en"
    ) -> Dict[str, Any]:
        """Verify an atomic claim against retrieved evidence in requested response language."""
        if not self.api_key:
            return self._mock_verify(claim_text, evidence_items, response_language=response_language)

        evidence_str = ""
        for ev in evidence_items:
            evidence_str += f"<evidence id=\"{ev.get('id', '')}\">\n"
            evidence_str += f"Title: {ev.get('title', '')}\n"
            evidence_str += f"Snippet: {ev.get('snippet', '')}\n"
            evidence_str += f"</evidence>\n"

        user_content = (
            f"<response_language>{response_language}</response_language>\n\n"
            f"<claim>\n{claim_text}\n</claim>\n\n"
            f"{evidence_str}"
        )

        payload = {
            "system_instruction": {
                "parts": [{"text": VERIFICATION_SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_content}]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "responseMimeType": "application/json"
            }
        }

        url = f"{GEMINI_API_ENDPOINT.format(model=self.model)}?key={self.api_key}"

        for attempt in range(2):
            try:
                client = await self._get_client()
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_text = parts[0].get("text", "").strip()
                            cleaned = self._clean_json(raw_text)
                            parsed = json.loads(cleaned)

                            verdict = parsed.get("verdict", "uncertain").lower()
                            if verdict not in ("supported", "uncertain", "unsupported"):
                                verdict = "uncertain"

                            reasoning = self._clean_reasoning(parsed.get("reasoning", ""))
                            ev_items = parsed.get("evidence", [])

                            parsed_evidence = []
                            valid_ids = {ev.get("id") for ev in evidence_items}
                            for item in ev_items:
                                eid = item.get("id")
                                if eid in valid_ids:
                                    stance = item.get("stance", "neutral").lower()
                                    if stance not in ("supports", "contradicts", "neutral"):
                                        stance = "neutral"
                                    parsed_evidence.append({
                                        "id": eid,
                                        "stance": stance,
                                        "quote": item.get("quote")
                                    })

                            return {
                                "verdict": verdict,
                                "reasoning": reasoning,
                                "evidence": parsed_evidence
                            }
                else:
                    logger.warning("Gemini verify error %s: %s", response.status_code, response.text[:200])
            except Exception as e:
                logger.warning("Gemini verify attempt %s failed: %s", attempt + 1, e)
                if attempt == 1:
                    break

        return self._mock_verify(claim_text, evidence_items, response_language=response_language)

    async def generate_corrected_draft(
        self,
        original_answer: str,
        claims_payload: List[Dict[str, Any]],
        language: str = "en"
    ) -> Optional[str]:
        """Generate corrected draft JSON string via Gemini."""
        if not self.api_key:
            return None

        from ..pipeline.corrected_answer import CORRECTION_SYSTEM_PROMPT

        user_content = (
            f"<answer>\n{original_answer}\n</answer>\n\n"
            f"Target Language: {language}\n\n"
            f"Claims and Verification Results:\n{json.dumps(claims_payload, ensure_ascii=False)}"
        )

        payload = {
            "system_instruction": {
                "parts": [{"text": CORRECTION_SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_content}]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "responseMimeType": "application/json"
            }
        }

        url = f"{GEMINI_API_ENDPOINT.format(model=self.model)}?key={self.api_key}"

        try:
            client = await self._get_client()
            response = await client.post(url, json=payload, timeout=settings.CORRECTION_TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return self._clean_json(parts[0].get("text", "").strip())
        except Exception as e:
            logger.warning("Gemini correction failed: %s", e)

        return None

    def _clean_json(self, text: str) -> str:
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        return text.strip()

    def _clean_reasoning(self, text: str) -> str:
        text = re.sub(r"<[^>]+>", "", text)
        words = text.strip().split()
        if len(words) > 40:
            return " ".join(words[:40]) + "..."
        return " ".join(words)

    def _mock_extract(self, answer: str) -> List[Dict[str, Any]]:
        from .anthropic import AnthropicProvider
        return AnthropicProvider()._mock_extract(answer)

    def _mock_verify(
        self,
        claim_text: str,
        evidence_items: List[Dict[str, Any]],
        response_language: str = "en"
    ) -> Dict[str, Any]:
        from .anthropic import AnthropicProvider
        return AnthropicProvider()._mock_verify(claim_text, evidence_items, response_language=response_language)
