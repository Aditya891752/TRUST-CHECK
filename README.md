# TrustCheck

AI answer reliability checker. Paste an AI-generated answer, get a claim-by-claim verification report with evidence and reasoning.

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env   # fill values locally, never commit
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
npm run dev
```

## Project structure

```text
AI-TRUSTCHECK/
  frontend/        React + Vite + TypeScript (Vercel)
  backend/         Python + FastAPI (Render)
  docs/            Architecture, design, and planning documents
  .env.example     Environment variable names (empty values only)
  .gitleaks.toml   Secret scanning configuration
  .gitignore       Ignored files
```

## Deployment

- **Frontend**: Vercel (root directory: `frontend`, framework: Vite)
- **Backend**: Render (root directory: `backend`, runtime: Python)

See `docs/architecture-diagram.md` for the full deployment guide.

## Security

- No secrets in frontend code or client bundles.
- Rate limiting and input validation on the backend.
- See `docs/rules.md` for the complete security checklist.
