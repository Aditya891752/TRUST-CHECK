from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .core.config import settings
from .core.security import setup_cors, limiter, check_daily_cap
from .core.errors import APIError, global_exception_handler
from .api.routes import router

app_kwargs = {}
if settings.ENV == "production":
    app_kwargs = {
        "docs_url": None,
        "redoc_url": None,
        "openapi_url": None,
    }

app = FastAPI(**app_kwargs)

setup_cors(app)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(APIError, global_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

@app.middleware("http")
async def daily_cap_middleware(request: Request, call_next):
    if request.url.path == "/api/v1/check" and not check_daily_cap():
        return JSONResponse(
            status_code=429,
            content={"error": {"code": "daily_cap", "message": "Daily request cap reached. Try again tomorrow.", "request_id": getattr(request.state, "request_id", "unknown")}}
        )
    return await call_next(request)

app.include_router(router, prefix="/api/v1")

@app.get("/api/health")
async def health():
    return {"status": "ok"}
