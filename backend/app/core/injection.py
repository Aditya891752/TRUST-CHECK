"""
Prompt injection detection and sanitization module for TrustCheck (Feature F5).
Detects prompt-injection patterns in user input and retrieved source snippets.
"""

import re
from typing import List, Dict, Any

INJECTION_PATTERNS = [
    # English
    r"ignore\s+(?:all|any|your|the)?\s*(?:previous|prior|above)\s+instructions",
    r"disregard\s+(?:the\s+)?(?:system|previous)\s+(?:prompt|instructions)",
    r"you\s+are\s+now",
    r"(?:mark|label|rate)\s+(?:every|all|each|this)?\s*claims?\s*(?:as\s+)?supported",
    r"note\s+to\s+the\s+(?:fact-?checking|verification|checker)\s+system",
    r"reveal\s+(?:your\s+)?(?:system\s+)?prompt",
    r"system\s+override",
    # Hinglish
    r"(?:pichhle|purane)\s+instructions\s+ko\s+ignore",
    r"sabhi\s+claims\s+ko\s+supported\s*(?:mark|kar)",
    r"checker\s+ke\s+liye\s+note",
    # Hindi (Devanagari)
    r"पिछले\s+निर्देशों\s+को\s+अनदेखा",
    r"सभी\s+दावों\s+को\s+सही\s*(?:मानें|चिह्नित)",
]

COMPILED_PATTERNS = [re.compile(p, flags=re.IGNORECASE) for p in INJECTION_PATTERNS]

def scan_for_injection(text: str) -> List[Dict[str, Any]]:
    """
    Scans text for adversarial prompt-injection patterns.
    Returns matches with safe, plain-text excerpts (max 80 chars, control chars stripped).
    """
    if not text:
        return []

    # Strip control characters (except common whitespace) and normalize spaces
    clean_text = "".join(ch for ch in text if ord(ch) >= 32 or ch in " \t\n\r")
    clean_text = re.sub(r"\s+", " ", clean_text).strip()

    matches: List[Dict[str, Any]] = []

    for pattern in COMPILED_PATTERNS:
        m = pattern.search(clean_text)
        if m:
            start = max(0, m.start() - 10)
            end = min(len(clean_text), m.end() + 20)
            raw_excerpt = clean_text[start:end].strip()
            
            # Truncate excerpt cleanly to 80 chars max
            if len(raw_excerpt) > 80:
                raw_excerpt = raw_excerpt[:77] + "..."

            matches.append({
                "matched_pattern": pattern.pattern,
                "excerpt": raw_excerpt
            })

    return matches
