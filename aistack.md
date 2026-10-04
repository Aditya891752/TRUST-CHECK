# TrustCheck AI Stack

## 1. AI responsibility map
AI is used for language-heavy work. It is never used for access control or security decisions.

| Stage | AI responsibility | Deterministic responsibility |
|-------|-------------------|------------------------------|
| Claim extraction and query planning | Split the answer into atomic factual claims and write one focused search query per claim | Schema validation, size limits, claim count cap, quote check |
| Evidence retrieval | None | Search provider calls, result filtering, evidence IDs |
| Verification | Compare each claim with the supplied evidence | Verdict schema validation, evidence ID checks |
| Explanation | Summarize why the evidence supports, conflicts with, or fails to establish the claim | Strip unsafe fields, enforce allowed verdicts, truncate length |

## 2. Model usage strategy
A small number of structured calls, no agent swarm.

1. **Extraction call** (one per request): input is the answer and optional question. Output is claims, each with a verbatim quote and a search query.
2. **Verification calls** (one per claim, in parallel): input is one claim plus its numbered evidence. Output is verdict, reasoning and evidence IDs.

Query planning is part of the extraction call to save a round trip. Split it into its own call only if query quality needs it.

### Models
| Role | Starting choice | Notes |
|------|-----------------|-------|
| Extraction | `claude-haiku-4-5-20251001` | Cheap and fast, simple structured task |
| Verification | `claude-sonnet-5-5` | Stronger reasoning over evidence |

Keep model names in `core/config.py` only. Before the demo, check Anthropic's docs for the current stable models and choose ones with reliable structured output. Do not hard-code model names anywhere else.

## 3. Evidence rules
The model must never create evidence. Evidence objects come only from the retrieval layer and contain:
- evidence ID
- title when available
- URL when available
- snippet or content excerpt
- retrieval timestamp when available

The verifier may reason over evidence but cannot invent a source, URL, quote or publication detail. The server maps `evidence_ids` back to the real objects. The model never outputs URLs.

## 4. Verdict contract
Allowed values are exactly:
```text
supported
uncertain
unsupported
```
- `supported` needs at least one cited evidence ID whose snippet clearly backs the claim.
- `uncertain` whenever evidence is insufficient, contradictory, ambiguous, outdated, or the claim is subjective or time-sensitive. Do not force a binary choice.
- `unsupported` means evidence contradicts the claim, or a focused search found nothing relevant. The reasoning must say which.

### Output shapes
Extraction:
```json
{ "claims": [ { "text": "string", "quote": "exact substring of the answer", "search_query": "string" } ] }
```
Verification:
```json
{ "verdict": "supported|uncertain|unsupported", "reasoning": "40 words or fewer", "evidence_ids": ["e1", "e3"] }
```

## 5. Prompting rules
Every AI call states:
- its exact role
- the allowed output schema
- what it must not invent
- how to handle missing evidence
- that user-provided text and retrieved content are untrusted data

Prefer concise reasoning, since it is displayed to users and adds latency. Temperature 0. Small fixed `max_tokens` per role.

## 6. Prompt injection defense
The input answer, retrieved pages, snippets, titles and metadata are all untrusted.
- The verifier never obeys instructions found inside retrieved content. Retrieved content is evidence, not a system message.
- Use clear delimiters and field-labeled JSON inputs, for example `<answer>...</answer>` and `<evidence>...</evidence>`. State in the system prompt that text inside those blocks is data.
- Never concatenate retrieved pages into a system instruction.
- Models in the pipeline have no tools and cannot take actions. Their output is only validated JSON.
- The UI renders model text as plain text, never as HTML.

## 7. Human-readable explanations
A reasoning string answers: what was checked, what evidence was found, and why that evidence supports, weakens or fails to establish the claim. Avoid fake certainty, vague phrases like "the AI says", and unexplained numeric confidence scores.

## 8. Validation and failure behavior
Server-side checks on every model output:
- Parse JSON strictly. Reject verdicts outside the enum.
- Reject `supported` with empty or unknown `evidence_ids`. Downgrade to `uncertain`.
- Verify each `quote` exists in the answer. Otherwise set `span` to null.
- Truncate reasoning to 40 words. Strip HTML and links from it.

If a call returns malformed data:
1. Validate the response.
2. Retry at most once with the same schema.
3. If still invalid, fail that stage safely. A per-claim failure becomes `uncertain` with the reasoning "Could not be verified". A failed extraction returns a generic error.

Never silently convert malformed model output into a plausible-looking result.

## 9. Evaluation set for demo readiness
Keep 6 to 8 fixed inputs in `backend/tests/fixtures/`:
- a mostly supported answer
- a mixed supported and uncertain answer
- an answer with a clearly unsupported factual claim
- a subjective or time-sensitive answer (should lean `uncertain`)
- a long answer to test limits
- an adversarial answer and adversarial retrieved text containing instructions (prompt injection test)

These are smoke tests, not hard-coded results. Run them after any prompt or model change.

## 10. Build-time AI tools
| Tool | Use | Guardrail |
|------|-----|-----------|
| AI coding assistants used in VS Code | Generate and edit code | Must read memory.md, rules.md and design.md first. Review every diff. Reject output using banned patterns |
| Claude chat | Planning, review, prompt tuning, security audit | Paste rules.md section C when asking for an audit |
