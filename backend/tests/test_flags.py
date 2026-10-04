import pytest
from app.pipeline.flags import extract_flags_regex, build_claim_flags, check_exact_match_downgrade
from app.api.schemas import FlagSchema

def test_extract_flags_dates_and_numbers():
    claim = "Python 4.0 was released in 2022 and has 206 bones."
    flags = build_claim_flags(claim)
    assert len(flags) >= 2
    types = {f.type for f in flags}
    assert "date" in types
    assert "number" in types
    
    texts = {f.text for f in flags}
    assert "2022" in texts

def test_extract_flags_devanagari():
    claim = "१९९१ में जारी किया गया था"
    flags = build_claim_flags(claim)
    assert len(flags) >= 1
    assert flags[0].text == "१९९१"

def test_exact_match_downgrade_when_figure_missing():
    flags = [FlagSchema(type="date", text="1995", start=0, end=4)]
    evidence = ["Python was created by Guido and released in 1991."]
    res = check_exact_match_downgrade(flags, evidence)
    assert res["downgrade"] is True
    assert "1995" in res["note"]

def test_exact_match_pass_when_figure_present():
    flags = [FlagSchema(type="date", text="1991", start=0, end=4)]
    evidence = ["Python was first released in 1991."]
    res = check_exact_match_downgrade(flags, evidence)
    assert res["downgrade"] is False

def test_exact_match_devanagari_to_ascii_match():
    # Devanagari 1991 matched against ASCII 1991 in snippet
    flags = [FlagSchema(type="date", text="१९९१", start=0, end=4)]
    evidence = ["Python was released in 1991."]
    res = check_exact_match_downgrade(flags, evidence)
    assert res["downgrade"] is False

def test_flags_cap_at_five():
    claim = "In 1991, 1992, 1993, 1994, 1995, 1996, 1997"
    flags = build_claim_flags(claim)
    assert len(flags) <= 5
