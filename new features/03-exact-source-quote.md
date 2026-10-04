# F3: Exact Quote From the Source

## Purpose
For each verdict, show the exact sentence from the source that supports or contradicts the claim. Users see the evidence itself, not only the model's summary of it.

## User-visible behavior
- In each claim's evidence list, every source shows:
  - title and domain (link opens in a new tab)
  - a stance label in text: "Supports", "Contradicts" or "Related", with a shape marker
  - the quote, with the quoted words emphasized inside the snippet
- If no verified quote exists, the item shows the snippet only with the note "No exact quote available".
- The quote is a short excerpt with attribution. It is never longer than `QUOTE_MAX_CHARS`.

## Backend changes
### Verifier output
Extend the verification output:
```json
{ "verdict": "...", "reasoning": "...",
  "evidence": [ { "id": "e1", "stance": "supports", "quote": "verbatim sentence or null" } ] }
```
Prompt rules:
- Cite only evidence IDs you were given.
- `quote` must be copied character for character from that evidence snippet. Choose the shortest sentence or clause that carries the meaning.
- If no sentence directly supports or contradicts the claim, use stance `neutral` and `quote: null`.
- Never translate a quote. Never paraphrase it. Never output a URL.

### Server verification (deterministic)
1. Evidence ID must exist in the evidence set for that claim. Otherwise drop the item.
2. Normalize both strings (Unicode NFKC, collapse whitespace, trim) and require the quote to be a substring of the snippet. If not, set `quote = null` and keep the stance. Log a counter `quote_rejected` (no content).
3. Truncate quotes to `QUOTE_MAX_CHARS` at a word boundary. Never cut inside a word.
4. `stance` must be one of `supports`, `contradicts`, `neutral`. Otherwise `neutral`.
5. Verdict rules:
   - `supported` needs at least one evidence item with stance `supports`. Otherwise downgrade to `uncertain`.
   - `unsupported` because of contradiction should have at least one `contradicts` item. If none exists, the reasoning must say that no evidence was found.
6. Merge the stance and quote into the evidence objects returned by the retrieval layer. The response never contains a URL that did not come from retrieval.

### Config
`QUOTE_MAX_CHARS` (default 200).

## Frontend changes
- New `components/QuoteBlock.tsx`. Props: `snippet`, `quote`, `stance`.
- Find the quote inside the snippet and emphasize it with bold text on a tinted background (not a colored border, not a left stripe). If it cannot be found, show the quote on its own.
- Plain text rendering only. Never `dangerouslySetInnerHTML`.
- `EvidenceList.tsx` renders a `QuoteBlock` per evidence item, ordered: supports, contradicts, neutral.
- Stance text labels use the verdict shape markers from design.md. Contrast must meet AA.
- Links use `rel="noopener noreferrer"` and show the domain in the mono font.
- Tolerate missing `stance` and `quote` (older backend).

## Acceptance tests
1. Supported claim: at least one evidence item has stance `supports` and a quote that is a substring of its snippet.
2. Unsupported claim with contradicting evidence: a `contradicts` item is shown.
3. Fabricated quote (mock verifier returns text not in the snippet): `quote` becomes null, no crash.
4. `supported` with no `supports` item: downgraded to `uncertain`.
5. Quote longer than the limit is truncated at a word boundary.
6. Quote with different whitespace or Unicode form still matches after normalization.
7. UI: item without a quote shows "No exact quote available".
8. A snippet containing HTML tags renders as text, not markup.

## Files likely touched
`backend/app/pipeline/verifier.py`, `backend/app/api/schemas.py`, `backend/app/core/config.py`, `backend/tests/`, `frontend/src/components/QuoteBlock.tsx` (new), `frontend/src/components/EvidenceList.tsx`, `frontend/src/lib/types.ts`.

## Do not
- Do not let the model choose or edit URLs.
- Do not show a quote that failed the substring check.
- Do not display long passages from a source. Short excerpts with a link only.
