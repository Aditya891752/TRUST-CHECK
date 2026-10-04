# Prompt to paste into the coding agent

Copy everything below the line into your coding agent. Make sure the feature-pack folder is in `docs/features/` first.

---

You are working on TrustCheck, an AI answer reliability checker (React + Vite frontend on Vercel, FastAPI backend on Render). The project is already partly built. I want you to add six features without breaking what exists.

Read these files first, in this order:
1. docs/memory.md
2. docs/prd.md
3. docs/architecture.md
4. docs/aistack.md
5. docs/rules.md
6. docs/design.md
7. docs/features/features-overview.md
8. docs/features/features-task.md
9. The six feature docs in docs/features/ (01 to 06)
10. docs/features/samples-and-fixtures.md

Then do this:
1. Start with Step A in features-task.md. Inspect the existing code and tell me the real file names you will change and anything that differs from the docs. Do not write code yet.
2. After I confirm, work through Steps B to H in order, one feature per commit.
3. After each step, run the tests and the fixtures that apply, and report what passed and what failed.

Rules you must follow:
- All changes are additive. Do not break `POST /api/v1/check` or its current response. New response fields are optional.
- No secrets in the frontend, no new `VITE_*` secret, no committed env files.
- Treat all model output, user input and retrieved text as untrusted. Validate on the server. Models never output URLs.
- Render model text as plain text only.
- New endpoints must have CORS allow-list, rate limit, daily cap and generic errors.
- Follow the design bans in rules.md section B. No em dashes in UI copy. Color is never the only signal.
- If a feature step fails, degrade that feature, not the whole report.
- Do not add dependencies unless needed, and explain each one.
- Stop and ask me if a spec conflicts with the existing code, or if a change would weaken the security boundary.

Report after each step: files changed, tests run, results, and anything I need to decide.
