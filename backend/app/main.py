import uuid
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded

from .core.config import settings
from .core.security import setup_cors, limiter, check_daily_cap
from .core.errors import (
    APIError,
    api_error_handler,
    validation_error_handler,
    rate_limit_handler,
    http_exception_handler,
    global_exception_handler
)
from .api.routes import router

app_kwargs = {}
if settings.ENV == "production":
    app_kwargs = {
        "docs_url": None,
        "redoc_url": None,
        "openapi_url": None,
    }

app = FastAPI(title="TrustCheck API", **app_kwargs)

# 1. CORS
setup_cors(app)

# 2. Rate limiter state
app.state.limiter = limiter

# 3. Request ID middleware
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
    request.state.request_id = req_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response

# 4. Daily cap middleware
@app.middleware("http")
async def daily_cap_middleware(request: Request, call_next):
    if request.url.path in ("/api/v1/check", "/api/v1/check/stream") and not check_daily_cap():
        req_id = getattr(request.state, "request_id", "unknown")
        return JSONResponse(
            status_code=429,
            content={"error": {"code": "daily_cap", "message": "Daily request cap reached. Try again tomorrow.", "request_id": req_id}}
        )
    return await call_next(request)

# 5. Exception Handlers
app.add_exception_handler(APIError, api_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# 6. Routes
app.include_router(router, prefix="/api/v1")

@app.get("/api/health")
async def health():
    return {"status": "ok"}
