# TrustCheck Demo Guide (Vibeathon Presentation)

## 1. Quick Warm-up (5 minutes before presenting)
Warm up the Render service to prevent free-tier spin-up latency:
```bash
curl https://trustcheck-api.onrender.com/api/health
```
Ensure response is `{"status": "ok"}`.

---

## 2. Three-Minute Live Demo Script

### Step 1: Context & Problem (30 seconds)
- *"AI answers sound authoritative even when they contain hallucinations, outdated information, or subtle inaccuracies."*
- *"TrustCheck doesn't ask users to trust another opaque AI score. Instead, it exposes the complete transparent chain from claims to web evidence to grounded verdicts."*

### Step 2: The Check Flow (45 seconds)
1. Open the TrustCheck web interface.
2. Click **"Use sample answer"** button (or paste an AI response).
3. Click **"Check reliability"**.
4. Point out the live progress indicator transitioning through:
   - *Extracting atomic factual claims*
   - *Searching for external web evidence*
   - *Comparing claims against retrieved evidence*

### Step 3: Inspecting Results (60 seconds)
1. **Summary Strip**: Show aggregate breakdown (e.g. *3 claims: 1 supported, 1 uncertain, 1 unsupported*).
2. **Highlighted Answer**: Show original text tinted by verdict with clickable character spans.
3. **Claim 1 (Supported)**: Open the card, explain that the evidence explicitly confirms the claim, and show the cited external domain link.
4. **Claim 2 (Uncertain)**: Explain that evidence is thin, conflicting, or inconclusive—TrustCheck never forces a false positive.
5. **Claim 3 (Unsupported)**: Show where the claim asserted the Eiffel Tower was in Berlin, while retrieved evidence proves Paris.

### Step 4: Closing & Transparency (45 seconds)
- *"Trust is our product. By grounding every statement in verifiable, retrieved evidence, we give researchers, developers, and students a fast, reliable verification instrument."*

---

## 3. Demo Fallback Scenarios
| Scenario | Action |
|----------|--------|
| Wi-Fi failure during presentation | Run locally: backend on `localhost:8000`, frontend on `localhost:5173` with MockSearchProvider. |
| Search API rate-limit or timeout | Pipeline automatically gracefully degrades affected claims to `uncertain` with clear reasoning rather than failing the report. |
