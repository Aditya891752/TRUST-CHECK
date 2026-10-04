"""
Unicode normalization, UTF-16 offset mapping, and language detection module for TrustCheck (Feature F4).
"""

import re
import unicodedata
from typing import Tuple, Optional

# Common Hinglish marker words (Roman script Hindi)
HINGLISH_MARKERS = {
    "hai", "hain", "tha", "thi", "the", "ko", "ne", "ki", "ka", "ke",
    "mein", "me", "se", "aur", "ye", "yeh", "woh", "wo", "kya", "kyun",
    "kar", "karo", "karna", "diya", "diye", "hota", "hoti", "hote",
    "raha", "rahi", "rahe", "gaya", "gayi", "gaye", "sabse", "zyada",
    "jyada", "pehli", "pehla", "baar", "banaya", "wala", "wali", "wale",
    "duniya", "bhi", "toh", "ab", "jab", "par", "pe", "kuch", "bahut"
}

def normalize_to_nfc(text: str) -> str:
    """Normalizes text to Unicode NFC form."""
    if not text:
        return ""
    return unicodedata.normalize("NFC", text)

def codepoint_to_utf16_offset(text: str, codepoint_index: int) -> int:
    """
    Converts a Python character (Unicode code point) index to a UTF-16 code unit offset
    matching JavaScript string indexing (length, slice, and indexOf).
    """
    if codepoint_index <= 0:
        return 0
    if codepoint_index >= len(text):
        return len(text.encode("utf-16-le")) // 2
    prefix = text[:codepoint_index]
    return len(prefix.encode("utf-16-le")) // 2

def utf16_span(text: str, start: int, end: int) -> Tuple[int, int]:
    """Converts a (start, end) code point range to UTF-16 code unit offsets."""
    return codepoint_to_utf16_offset(text, start), codepoint_to_utf16_offset(text, end)

def detect_language(text: str) -> str:
    """
    Detects the primary language of the text.
    Returns: 'hi' (Devanagari), 'hinglish', 'en', or 'other'.
    """
    if not text or not text.strip():
        return "en"

    # Check for Devanagari Unicode block (U+0900 to U+097F)
    devanagari_chars = len(re.findall(r"[\u0900-\u097F]", text))
    total_letters = len(re.findall(r"\w", text))

    if devanagari_chars > 0 and (total_letters == 0 or devanagari_chars / total_letters > 0.15):
        return "hi"

    # Check for Hinglish markers in lowercased Roman text
    words = [w.lower() for w in re.findall(r"[a-zA-Z]+", text)]
    if words:
        hinglish_hits = sum(1 for w in words if w in HINGLISH_MARKERS)
        # If at least 2 distinct Hinglish markers or >= 10% of words are markers
        if hinglish_hits >= 2 or (len(words) > 3 and hinglish_hits / len(words) >= 0.12):
            return "hinglish"

    # Default to English
    return "en"

def resolve_response_language(requested: Optional[str], detected: str) -> str:
    """
    Resolves final response language:
    'auto' (or None) uses the detected input language ('hi', 'hinglish', or 'en').
    Explicit 'en', 'hi', or 'hinglish' overrides.
    """
    if not requested or requested.lower() == "auto":
        return detected if detected in ("hi", "hinglish", "en") else "en"
    req_lower = requested.lower()
    if req_lower in ("hi", "hinglish", "en"):
        return req_lower
    return "en"
