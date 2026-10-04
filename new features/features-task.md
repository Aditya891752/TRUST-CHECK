# Feature Pack Task Plan (GSD style)

Apply the six features to the existing codebase. Small atomic tasks, one commit per task, verify before moving on. Feature specs are in the numbered docs. Shared contract is in features-overview.md.

## State
- Current step: A
- Last verified: nothing yet
- Blockers: none
Update this block after every task.

## Step A: Read and map (no code changes)
- [ ] Read memory.md, prd.md, architecture.md, aistack.md, rules.md, design.md, then features-overview.md.
- [ ] List the real file names for the pipeline, schemas, routes, config, components and types. The paths in the feature docs are expected names. Use the real ones.
- [ ] Run the existing tests and note the baseline (pass or fail).
- [ ] Confirm the current response shape matches architecture.md section 5. Note any differences.
Done when: a short mapping note exists (in the PR description or memory.md) and the baseline is recorded.

## Step B: F6 number, date and name flags
- [ ] Add `flag_terms` to the extraction schema and prompt.
- [ ] Add `pipeline/flags.py` (regex plus model terms, offsets, cap).
- [ ] Pass flags to the verifier and add the exact-match downgrade.
- [ ] Add `flags` to the response schema.
- [ ] Add `FlagChips.tsx` and underline flagged terms in `ClaimCard.tsx`.
- [ ] Unit tests from 06 acceptance list.
Done when: S1 shows date and number flags and the S6 wrong-date case is not `supported`.
Commit: `feat: number and date flags`

## Step C: F3 exact source quote
- [ ] Extend the verifier output with `stance` and `quote`.
- [ ] Add server checks: evidence ID exists, quote is a verbatim substring, truncation, stance enum, `supported` needs a supporting item.
- [ ] Merge stance and quote into the evidence objects in the response.
- [ ] Add `QuoteBlock.tsx` and update `EvidenceList.tsx`.
- [ ] Unit tests from 03 acceptance list.
Done when: supported claims show a verified quote and a fabricated quote is dropped in a test.
Commit: `feat: exact source quotes`

## Step D: F5 injection test sample and notices
- [ ] Add `core/injection.py` with patterns and tests.
- [ ] Scan the input and retrieved snippets. Exclude flagged snippets from verifier input.
- [ ] Read the `instruction_in_input` hint from extraction.
- [ ] Add `notices` to the response schema.
- [ ] Add `NoticeBanner.tsx` and the "Injection test" sample button.
- [ ] Add fixtures S4, S5 and the mock source fixture. Add the differential test.
Done when: S4 shows the banner and gives the same verdicts as S1.
Commit: `feat: injection notices and test sample`

## Step E: F4 Hindi and Hinglish
- [ ] Add `core/text.py`: NFC normalization and the UTF-16 offset helper, with tests (Devanagari and emoji).
- [ ] Return `answer_normalized` and `language`. Convert all spans and flag offsets to UTF-16.
- [ ] Update extraction, verification and (later) correction prompts for language handling and response language.
- [ ] Add `response_language` to the request schema and the `ResponseLanguage` control.
- [ ] Self-host Noto Sans Devanagari. Update `tokens.css`, add `lang` attributes and the Devanagari line height.
- [ ] Switch highlighting to use `answer_normalized`.
- [ ] Add Hindi and Hinglish sample buttons (S2, S3).
Done when: S2 and S3 give the same verdict pattern as S1, with reasoning in the right language and correct highlights.
Commit: `feat: hindi and hinglish support`

## Step F: F1 corrected answer
- [ ] Add `pipeline/corrected_answer.py` with the prompt rules and all seven validation checks.
- [ ] Add `CORRECTION_ENABLED` and the 12 second timeout.
- [ ] Add `corrected_answer` to the response schema. Failure returns null.
- [ ] Add `CorrectedAnswer.tsx` with change markers and the Copy button.
- [ ] Unit tests from 01 acceptance list. Use S7.
Done when: S7 gives a corrected answer with no new facts and validation failures degrade to null.
Commit: `feat: corrected answer`

## Step G: F2 live streaming
- [ ] Refactor the pipeline into `run_check(request, emit)`. Keep the non-streaming route working on top of it.
- [ ] Add `POST /api/v1/check/stream` with the event format, headers, pings, disconnect handling, concurrency limit and timeout.
- [ ] Add `STREAMING_ENABLED`, `MAX_CONCURRENT_STREAMS_PER_IP`, `STREAM_TIMEOUT_SECONDS`.
- [ ] Add `lib/stream.ts` (fetch plus ReadableStream parser) with unit tests for split chunks.
- [ ] Update `App.tsx`, `ClaimCard.tsx`, `ProgressStatus.tsx`, `SummaryStrip.tsx` for incremental state, Cancel and fallback.
- [ ] Deploy and verify progressive delivery on Render and Vercel.
Done when: events visibly arrive one by one on the deployed app and the normal endpoint still works.
Commit: `feat: live streaming results`

## Step H: Final pass
- [ ] Run every fixture in samples-and-fixtures.md and the full test suite.
- [ ] Security recheck on the stream endpoint and new fields: rules.md rows 1, 6, 7, 9, 11. No secrets in `dist/`, `/docs` still 404, rate limit and concurrency limit work, errors generic.
- [ ] Design recheck against rules.md section B: no banned patterns, contrast on new components, color never the only signal, no em dashes in new copy.
- [ ] Mobile check with long Hindi text and with streaming.
- [ ] Update memory.md with the lines in features-overview.md section 8.
- [ ] Update the demo script: add the quote, flags, corrected answer, Hinglish and injection steps.
Done when: all checks pass on the deployed apps.
Commit: `chore: feature pack final pass`

## Cut list if running behind
Cut in this order:
1. "Show flagged claims only" toggle
2. Change markers in the corrected answer (keep plain text with Copy)
3. Hindi sample and the response language control (keep Auto)
4. Streaming (keep the normal endpoint)

Never cut: server-side quote verification, evidence ID checks, injection delimiters and schema validation, rate limiting on any new endpoint, plain-text rendering of model output.

## Commit format
`type: short description`. Never commit with failing tests or a failed secret scan.
