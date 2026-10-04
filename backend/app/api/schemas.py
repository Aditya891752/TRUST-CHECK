from pydantic import BaseModel, Field
from typing import List, Optional

class CheckRequest(BaseModel):
    answer: str = Field(..., min_length=1, max_length=4000)
    question: Optional[str] = Field(None, max_length=500)

class EvidenceSchema(BaseModel):
    id: str
    title: str
    url: str
    snippet: str
    retrieved_at: str

class SpanSchema(BaseModel):
    start: int
    end: int

class ClaimSchema(BaseModel):
    id: str
    text: str
    span: Optional[SpanSchema]
    verdict: str
    reasoning: str
    evidence: List[EvidenceSchema]

class CheckResponse(BaseModel):
    request_id: str
    summary: dict
    claims: List[ClaimSchema]

class ErrorResponse(BaseModel):
    error: dict
