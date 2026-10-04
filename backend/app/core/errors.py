import uuid
from fastapi import Request
from fastapi.responses import JSONResponse

class APIError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    if isinstance(exc, APIError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message, "request_id": request_id}}
        )
    
    # Generic internal error for unhandled exceptions
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "internal", "message": "An internal server error occurred.", "request_id": request_id}}
    )
