"""
Unit and integration tests for Hindi, Hinglish, and Mixed-Language Support (Feature F4).
"""

import pytest
import unicodedata
from fastapi.testclient import TestClient
from app.main import app
from app.core.text import (
    normalize_to_nfc,
    codepoint_to_utf16_offset,
    utf16_span,
    detect_language,
    resolve_response_language
)

client = TestClient(app)

def test_nfc_normalization():
    # Combining characters: 'e' + combining acute accent vs precomposed 'é'
    decomposed = "e\u0301"
    composed = "\u00e9"
    assert normalize_to_nfc(decomposed) == composed
    assert len(normalize_to_nfc(decomposed)) == 1

    # Hindi text normalization
    hindi_raw = "पायथन"
    assert normalize_to_nfc(hindi_raw) == unicodedata.normalize("NFC", hindi_raw)

def test_utf16_offset_helper_with_emoji_and_devanagari():
    # Emoji (astral plane character): 1 Python code point, 2 UTF-16 code units
    text_emoji = "AI 🚀 Check"
    # Python indices: 'A'=0, 'I'=1, ' '=2, '🚀'=3, ' '=4, 'C'=5
    py_pos = text_emoji.find("Check") # index 5 in Python
    assert py_pos == 5
    # In UTF-16, '🚀' takes 2 units, so prefix "AI 🚀 " has 2 + 1 + 2 + 1 = 6 units
    u16_pos = codepoint_to_utf16_offset(text_emoji, py_pos)
    assert u16_pos == 6

    # Devanagari: BMP characters, 1 code point = 1 UTF-16 unit
    text_hindi = "पायथन 1991"
    py_pos_hindi = text_hindi.find("1991")
    u16_pos_hindi = codepoint_to_utf16_offset(text_hindi, py_pos_hindi)
    assert py_pos_hindi == u16_pos_hindi

    # utf16_span
    start_u16, end_u16 = utf16_span(text_emoji, 5, 10)
    assert start_u16 == 6
    assert end_u16 == 11

def test_language_detection():
    # English S1
    s1 = "Python was created by Guido van Rossum and first released in 1991. It is the most widely used programming language."
    assert detect_language(s1) == "en"

    # Hinglish S2
    s2 = "Python ko Guido van Rossum ne banaya tha aur ye pehli baar 1991 mein release hui thi. Ye duniya ki sabse zyada use hone wali language hai."
    assert detect_language(s2) == "hinglish"

    # Hindi S3
    s3 = "पायथन को गुइडो वैन रॉसम ने बनाया था और यह पहली बार १९९१ में जारी हुई थी।"
    assert detect_language(s3) == "hi"

    # Mixed
    mixed = "Python ko 1991 mein release kiya gaya tha and it is widely used."
    assert detect_language(mixed) in ("hinglish", "hi")

def test_response_language_resolution():
    assert resolve_response_language("auto", "hi") == "hi"
    assert resolve_response_language("auto", "hinglish") == "hinglish"
    assert resolve_response_language("auto", "en") == "en"
    assert resolve_response_language("en", "hi") == "en"
    assert resolve_response_language("hi", "en") == "hi"

def test_api_hinglish_s2():
    s2 = "Python ko Guido van Rossum ne banaya tha aur ye pehli baar 1991 mein release hui thi. Python 4.0 2022 mein release hua tha."
    res = client.post("/api/v1/check", json={"answer": s2, "response_language": "auto"})
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "hinglish"
    assert len(data["claims"]) >= 2
    # Claims preserve user script/wording
    assert any("Guido" in c["text"] for c in data["claims"])
    # Reasoning in Hinglish
    assert any("Retrieved sources" in c["reasoning"] or "claim" in c["reasoning"] for c in data["claims"])

def test_api_hindi_s3_with_devanagari_digits():
    s3 = "पायथन को गुइडो वैन रॉसम ने बनाया था और यह पहली बार १९९१ में जारी हुई थी। पायथन 4.0 वर्ष 2022 में जारी हुआ था।"
    res = client.post("/api/v1/check", json={"answer": s3, "response_language": "auto"})
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "hi"
    assert len(data["claims"]) >= 1
    # Check claim is in Devanagari
    first_claim = data["claims"][0]
    assert any("\u0900" <= ch <= "\u097f" for ch in first_claim["text"])
    # Flagged terms should capture Devanagari year १९९१ as date
    assert any(f["text"] == "१९९१" and f["type"] == "date" for f in first_claim["flags"])

def test_api_hindi_input_with_english_response_language():
    s3 = "पायथन को गुइडो वैन रॉसम ने बनाया था और यह पहली बार १९९१ में जारी हुई थी।"
    res = client.post("/api/v1/check", json={"answer": s3, "response_language": "en"})
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "hi"
    # Claims stay in Hindi
    assert any("\u0900" <= ch <= "\u097f" for ch in data["claims"][0]["text"])
    # Reasoning is in English
    assert "Retrieved source" in data["claims"][0]["reasoning"] or "evidence" in data["claims"][0]["reasoning"].lower()

def test_invalid_response_language_rejected():
    res = client.post("/api/v1/check", json={"answer": "Python was released in 1991.", "response_language": "french"})
    assert res.status_code == 400
