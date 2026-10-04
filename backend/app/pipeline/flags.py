"""
Flags extraction and normalization module for TrustCheck (Feature F6).
Detects numbers, dates, and names in claim texts using regex and model terms.
Provides exact-match verification checks against evidence.
"""

import re
from typing import List, Dict, Any, Optional
from ..api.schemas import FlagSchema

# Devanagari digit translation table
DEVANAGARI_DIGITS = str.maketrans("०१२३४५६७८९", "0123456789")

MONTHS = [
    # English
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
    "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
    # Hindi
    "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
]

def normalize_digits(text: str) -> str:
    """Translates Devanagari digits to standard ASCII digits."""
    return text.translate(DEVANAGARI_DIGITS)

def extract_flags_regex(text: str) -> List[Dict[str, Any]]:
    """Extracts date and number flags deterministically via regex."""
    flags: List[Dict[str, Any]] = []
    
    # 1. Year dates: 1000 to 2099 (ASCII & Devanagari)
    year_pattern = re.compile(r"\b([12][0-9]{3}|[१२][०-९]{3})\b")
    for m in year_pattern.finditer(text):
        flags.append({
            "type": "date",
            "text": m.group(1),
            "start": m.start(),
            "end": m.end()
        })

    # 2. Month dates (e.g., "15 August 1947", "July 1969", "१५ अगस्त")
    months_re = "|".join(re.escape(m) for m in MONTHS)
    month_date_pattern = re.compile(rf"\b(?:\d{{1,2}}\s+)?(?:{months_re})(?:\s+\d{{2,4}})?\b", flags=re.IGNORECASE)
    for m in month_date_pattern.finditer(text):
        val = m.group(0).strip()
        # Avoid duplicate overlapping match with simple 4-digit year if already captured
        if not any(f["start"] == m.start() and f["end"] == m.end() for f in flags):
            flags.append({
                "type": "date",
                "text": val,
                "start": m.start(),
                "end": m.end()
            })

    # 3. Numbers: percentages, quantities with units, currencies, decimals (e.g. 4.0, 330 m, ₹500, $10, 8,849)
    number_pattern = re.compile(
        r"(?:[\$₹€£]\s*[0-9०-९]+(?:[,\.][0-9०-९]+)*|[0-9०-९]+(?:[,\.][0-9०-९]+)*(?:\s*(?:%|percent|km|m|kg|cm|miles|metres|meters|degrees|bones|protons|years|days))?)"
    )
    for m in number_pattern.finditer(text):
        val = m.group(0).strip()
        # Skip single small words or years already marked as date
        if any(f["start"] <= m.start() and m.end() <= f["end"] for f in flags):
            continue
        if len(val) >= 1:
            flags.append({
                "type": "number",
                "text": val,
                "start": m.start(),
                "end": m.end()
            })

    return flags

def build_claim_flags(claim_text: str, model_flag_terms: Optional[List[Dict[str, str]]] = None) -> List[FlagSchema]:
    """
    Combines deterministic regex flags with model-extracted terms (e.g. names).
    Filters out any term that does not appear verbatim in claim_text.
    Caps at 5 flags per claim.
    """
    regex_flags = extract_flags_regex(claim_text)
    combined: List[Dict[str, Any]] = list(regex_flags)

    # Process model extracted terms (e.g. name, date, number)
    if model_flag_terms:
        for item in model_flag_terms:
            t_type = item.get("type", "name").lower()
            if t_type not in ("date", "number", "name"):
                t_type = "name"
            term_text = item.get("text", "").strip()
            if not term_text:
                continue

            # Check if term appears verbatim in claim_text
            pos = claim_text.find(term_text)
            if pos != -1:
                # Avoid exact duplicates
                if not any(c["start"] == pos and c["end"] == pos + len(term_text) for c in combined):
                    combined.append({
                        "type": t_type,
                        "text": term_text,
                        "start": pos,
                        "end": pos + len(term_text)
                    })

    # Sort by start offset
    combined.sort(key=lambda x: x["start"])

    # Remove overlapping spans
    clean_flags: List[FlagSchema] = []
    last_end = -1
    for f in combined:
        if f["start"] >= last_end:
            clean_flags.append(FlagSchema(
                type=f["type"],
                text=f["text"],
                start=f["start"],
                end=f["end"]
            ))
            last_end = f["end"]
            if len(clean_flags) >= 5:
                break

    return clean_flags

def check_exact_match_downgrade(flags: List[FlagSchema], evidence_snippets: List[str]) -> Dict[str, Any]:
    """
    Server check for 'supported' claims:
    If any date or number flag cannot be found in the evidence snippets (after normalization),
    returns downgrade=True and note.
    """
    if not flags or not evidence_snippets:
        return {"downgrade": False, "note": ""}

    combined_evidence = " ".join(evidence_snippets).lower()
    combined_evidence_norm = normalize_digits(combined_evidence).replace(",", "").replace(" ", "")

    missing_figures = []
    missing_names = []

    for f in flags:
        norm_term = normalize_digits(f.text).lower().replace(",", "").replace(" ", "")
        
        # Check if term or numeric part appears in normalized evidence
        found = (norm_term in combined_evidence_norm) or (f.text.lower() in combined_evidence)

        if not found:
            if f.type in ("date", "number"):
                missing_figures.append(f.text)
            elif f.type == "name":
                missing_names.append(f.text)

    if missing_figures:
        return {
            "downgrade": True,
            "note": f"Exact figure ({', '.join(missing_figures)}) not found in sources."
        }
    elif missing_names:
        return {
            "downgrade": False,
            "note": f"Name '{missing_names[0]}' was not specifically confirmed by sources."
        }

    return {"downgrade": False, "note": ""}
