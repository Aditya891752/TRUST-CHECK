import uuid
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded

class APIError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")

async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    request_id = get_request_id(request)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message, "request_id": request_id}}
    )

async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = get_request_id(request)
    # Extract clean, user-safe error summary without exposing internals
    errors = exc.errors()
    msg = "Invalid request format."
    if errors:
        first = errors[0]
        field = first.get("loc", [""])[-1]
        msg = f"Invalid field '{field}': {first.get('msg', 'validation failed')}"
    return JSONResponse(
        status_code=400,
        content={"error": {"code": "bad_request", "message": msg, "request_id": request_id}}
    )

async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    request_id = get_request_id(request)
    return JSONResponse(
        status_code=429,
        content={"error": {"code": "rate_limited", "message": "Too many requests. Please wait a moment before trying again.", "request_id": request_id}}
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    request_id = get_request_id(request)
    code_map = {
        400: "bad_request",
        404: "not_found",
        429: "rate_limited",
        502: "upstream_unavailable",
        504: "timeout"
    }
    code = code_map.get(exc.status_code, "internal")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": code, "message": exc.detail or "Request failed.", "request_id": request_id}}
    )

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = get_request_id(request)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "internal", "message": "An unexpected error occurred. Please try again later.", "request_id": request_id}}
    )
