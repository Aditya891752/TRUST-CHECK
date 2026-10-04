# F6: Number, Date and Name Flags

## Purpose
Figures, dates and proper names are where AI answers most often invent details. Flag them on each claim and require that the exact value appears in the evidence before a claim can be `supported`.

## User-visible behavior
- Claims that contain a date, number or name show chips: "Date: 1991", "Number: 330 m", "Name: Guido van Rossum". Chips have text labels and a neutral tint.
- Inside the claim text, each flagged term is underlined (underline, not color only).
- When the exact value was not found in the sources, the reasoning says so, for example "The date 2022 does not appear in the sources" or "Sources give 1995, not 1991".
- Optional (Could): a "Show flagged claims only" toggle above the claim list.

## Backend changes
### Extraction output
Add `flag_terms` to each claim from the extractor:
```json
"flag_terms": [ { "type": "date", "text": "1991" }, { "type": "name", "text": "Guido van Rossum" } ]
```
Types are `date`, `number`, `name`.

### Deterministic flagging
New `pipeline/flags.py`:
- `date`: four-digit years (1000 to 2099), month names in English and Hindi (जनवरी through दिसंबर), numeric dates, and common Hinglish month spellings.
- `number`: digits (ASCII and Devanagari ० to ९), percentages, currency symbols (₹, $, and similar), and quantities with units.
- `name`: from the extractor only. Regex is unreliable for names.
- Final flags are the union of the regex results and the model's `flag_terms`. Each term must appear in the claim text as a substring, otherwise drop it. Compute `start` and `end` as UTF-16 offsets inside the claim text.
- Cap at 5 flags per claim.

### Exact-match check
The verifier receives the flags for the claim. Prompt rules:
- Every flagged number, date and name in the claim must be found in the cited evidence.
- If the evidence gives a different value, the verdict cannot be `supported`, and the reasoning must state the differing value.

Server check after the verifier returns, for `supported` claims:
1. For each flag of type `date` or `number`, normalize and compare against the snippets of the evidence items with stance `supports`. Normalization: Devanagari digits to ASCII, remove thousands separators (commas, spaces), lowercase, unify currency symbols and unit spellings.
2. If any flagged date or number is not found in those snippets, downgrade to `uncertain` and append "Exact figure not found in sources." to the reasoning (respect the response language).
3. For `name` flags, a missing name only adds a note to the reasoning. It does not downgrade by itself.
This check only downgrades. It never upgrades a verdict.

### Response
Claims include `flags` with `type`, `text`, `start`, `end`.

## Frontend changes
- New `components/FlagChips.tsx`: renders chips from `flags`. Plain text, neutral tint, text label "Date" or "Number" or "Name", then the value.
- `ClaimCard.tsx` underlines flagged terms in the claim text using the offsets. If offsets look wrong (out of range), skip underlining and still show chips.
- Chips are not the only signal for the verdict. They sit next to it, never replace it.
- Tolerate missing `flags`.

## Acceptance tests
1. "Python 4.0 was released in 2022": flags include `number` (4.0) and `date` (2022). Verdict `unsupported`.
2. "Python was first released in 1991": `date` flag, verdict `supported`, 1991 found in the supporting snippet.
3. "Python was first released in 1995" with evidence saying 1991: not `supported`, reasoning states the difference.
4. A model verdict of `supported` where the year is absent from the evidence is downgraded to `uncertain` by the server.
5. Hindi claim with Devanagari digits ("१९९१ में"): flagged as a date and matched to "1991" in an English snippet.
6. Claim with a name that appears in no source: note added, verdict not downgraded by that alone.
7. Flag offsets underline the right term in a Devanagari claim.
8. A claim with no figures, dates or names has an empty `flags` array.

## Files likely touched
`backend/app/pipeline/flags.py` (new), `backend/app/pipeline/claim_extractor.py`, `backend/app/pipeline/verifier.py`, `backend/app/api/schemas.py`, `backend/tests/test_flags.py` (new), `frontend/src/components/FlagChips.tsx` (new), `frontend/src/components/ClaimCard.tsx`, `frontend/src/lib/types.ts`.

## Do not
- Do not let a model-only flag survive if the term is not in the claim text.
- Do not upgrade a verdict based on the exact-match check.
- Do not treat a missing figure in the sources as proof the claim is false. It means the claim is not established.
