from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator
from ..core.config import ANSWER_MAX_LENGTH, QUESTION_MAX_LENGTH, MAX_CLAIMS

class Verdict(str, Enum):
    SUPPORTED = "supported"
    UNCERTAIN = "uncertain"
    UNSUPPORTED = "unsupported"

class CheckRequest(BaseModel):
    answer: str = Field(..., min_length=1, max_length=ANSWER_MAX_LENGTH, description="AI answer to check (1-4000 characters)")
    question: Optional[str] = Field(None, max_length=QUESTION_MAX_LENGTH, description="Optional original prompt/question (max 500 characters)")

    @field_validator("answer")
    @classmethod
    def validate_answer_not_whitespace(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Answer cannot be empty or purely whitespace.")
        return v

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            return None
        return v

class SpanSchema(BaseModel):
    start: int = Field(..., ge=0, description="Start character index in the answer")
    end: int = Field(..., ge=0, description="End character index in the answer")

    @field_validator("end")
    @classmethod
    def validate_end_after_start(cls, end: int, info) -> int:
        start = info.data.get("start")
        if start is not None and end < start:
            raise ValueError("Span end index must be greater than or equal to start index.")
        return end

class FlagSchema(BaseModel):
    type: str = Field(..., description="Flag type: 'date', 'number', or 'name'")
    text: str = Field(..., description="Flagged term value")
    start: int = Field(..., ge=0, description="Start character offset in claim text")
    end: int = Field(..., ge=0, description="End character offset in claim text")

class EvidenceSchema(BaseModel):
    id: str = Field(..., description="Stable local evidence identifier (e.g. e1, e2)")
    title: str = Field("", description="Title of the source webpage")
    url: str = Field(..., description="Canonical URL of the retrieved evidence")
    snippet: str = Field(..., description="Retrieved excerpt or snippet")
    retrieved_at: str = Field(..., description="ISO 8601 UTC retrieval timestamp")

class ClaimSchema(BaseModel):
    id: str = Field(..., description="Stable local claim identifier (e.g. c1, c2)")
    text: str = Field(..., description="Atomic factual statement")
    span: Optional[SpanSchema] = Field(None, description="Character range in the original answer, or null if unlocated")
    verdict: Verdict = Field(..., description="Verification state: supported, uncertain, or unsupported")
    reasoning: str = Field(..., max_length=500, description="Plain language explanation (40 words or fewer)")
    evidence: List[EvidenceSchema] = Field(default_factory=list, description="Retrieved evidence items cited for this claim")
    flags: List[FlagSchema] = Field(default_factory=list, description="Extracted dates, numbers, and names")

    @model_validator(mode="after")
    def check_supported_has_evidence(self) -> "ClaimSchema":
        # PRD rule: 'supported' requires at least one cited evidence item.
        if self.verdict == Verdict.SUPPORTED and not self.evidence:
            self.verdict = Verdict.UNCERTAIN
        return self

class SummarySchema(BaseModel):
    supported: int = Field(0, ge=0)
    uncertain: int = Field(0, ge=0)
    unsupported: int = Field(0, ge=0)

class CheckResponse(BaseModel):
    request_id: str = Field(..., description="Unique tracking identifier for the request")
    summary: SummarySchema = Field(..., description="Aggregate counts per verdict")
    claims: List[ClaimSchema] = Field(default_factory=list, max_length=MAX_CLAIMS, description="Atomic claims and evaluations")

class ErrorDetailSchema(BaseModel):
    code: str = Field(..., description="Standardized error code")
    message: str = Field(..., description="User-safe error explanation")
    request_id: str = Field(..., description="Request tracking identifier")

class ErrorResponse(BaseModel):
    error: ErrorDetailSchema
