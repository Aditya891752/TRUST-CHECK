# F4: Hindi, Hinglish and Mixed-Language Input

## Purpose
Let users paste answers in Hindi (Devanagari), Hinglish (Hindi in Roman script), English, or a mix, and get claims, reasoning and a corrected answer back in the same language.

## User-visible behavior
- The input accepts all three. The placeholder text is bilingual.
- A small "Response language" control with four options: Auto (default), English, Hindi, Hinglish. Auto follows the input.
- Claims keep the user's own wording and script. Reasoning follows the response language.
- Source quotes stay in the source's original language and are never translated.
- Verdict labels stay in English in v1 (Supported, Uncertain, Unsupported). A Hindi sublabel can come later.
- Hindi text renders with correct shaping and spacing. Highlights line up with the right words.

## Backend changes
### Normalization
- Normalize the answer to Unicode NFC. Return it as `answer_normalized`.
- The length limit counts Unicode characters (code points), not bytes. Keep the 4,000 limit.
- All spans (claim spans and flag offsets) are converted to UTF-16 code unit offsets so they match JavaScript string indexes. Add a helper and unit test it with Devanagari and with an emoji (astral character).

### Extraction call
- Returns `language`: `en`, `hi`, `hinglish` or `other`.
- `text` and `quote` stay in the input language and script. `quote` must still be a verbatim substring of the normalized answer.
- `search_query` is written in English for best search coverage. Keep names and terms as in the claim. For India-specific topics the query may include the original proper nouns.
- Do not "correct", transliterate or translate the user's wording.

### Verification and correction calls
- Receive `response_language` (resolved from request or detected language).
- Write `reasoning` and corrected text in that language: Devanagari for `hi`, Roman script Hindi for `hinglish`, English for `en`.
- Quotes stay verbatim in the source language.

### Request schema
Add optional `response_language`: `auto`, `en`, `hi`, `hinglish`. Invalid values return a 400. Default `auto`.

### Number handling
Support Devanagari digits (० to ९) and Hindi month names in the flag logic (see F6). Normalize digits to ASCII only for comparison, never in displayed text.

## Frontend changes
- Fonts: add Noto Sans Devanagari, self-hosted and subsetted, to the font stack after IBM Plex Sans: `"IBM Plex Sans", "Noto Sans Devanagari", sans-serif`. No third-party font request. Update `tokens.css`.
- Devanagari needs more line height than Latin. Use 1.7 for text blocks that contain Devanagari (a `:lang(hi)` rule or a class set from `language`).
- Set `lang="hi"` on elements showing Hindi text for correct rendering and screen readers.
- Highlighting uses `answer_normalized` and the UTF-16 spans from the backend. Never recompute offsets on the client from the raw textarea value.
- New `ResponseLanguage` control (segmented buttons, keyboard accessible). Sends `response_language`.
- Add sample buttons "Hindi sample" and "Hinglish sample" (texts in samples-and-fixtures.md).
- Verify the textarea, counter and claim cards at mobile width with long Hindi text.

## Acceptance tests
1. Hinglish sample: claims in Hinglish, verdicts match the English version of the same text (1991 supported, "4.0 in 2022" unsupported), reasoning in Hinglish.
2. Hindi sample: claims and reasoning in Devanagari. Highlights cover the right words.
3. Mixed Hindi and English sentence: no crash, claims extracted, language reported as `hinglish` or `hi`.
4. `response_language=en` with Hindi input: claims stay Hindi, reasoning in English.
5. Offsets: a Devanagari answer and an answer with an emoji both highlight the correct text.
6. Input over 4,000 characters (counted as characters) is rejected with a generic 400.
7. No mojibake in the JSON response or in the UI. Devanagari digits in a claim are flagged as numbers.
8. Text with combining marks gives the same result before and after NFC normalization.

## Files likely touched
`backend/app/core/text.py` (new: normalization, UTF-16 offset helper), `backend/app/pipeline/claim_extractor.py`, `backend/app/pipeline/verifier.py`, `backend/app/pipeline/corrected_answer.py`, `backend/app/api/schemas.py`, `backend/tests/`, `frontend/src/styles/tokens.css`, `frontend/public/fonts/` (new), `frontend/src/components/CheckForm.tsx`, `frontend/src/components/ResponseLanguage.tsx` (new), `frontend/src/components/HighlightedAnswer.tsx`, `frontend/src/lib/types.ts`.

## Do not
- Do not translate claims into English before checking and then show only English.
- Do not translate or alter source quotes.
- Do not load fonts from a third-party CDN.
- Do not assume one character equals one byte or one UTF-16 unit when computing spans.
