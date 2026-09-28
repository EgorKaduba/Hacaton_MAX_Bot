from pydantic import BaseModel
from datetime import datetime

class ErrorSchema(BaseModel):
    type: str
    section: str | None = None

    severity: str
    confidence: str = "confirmed"

    description: str
    actual: float | None = None
    expected: float | None = None
    delta: float | None = None

    legal_ref: str | None = None
    recommended_action: str | None = None

class ErrorsResponse(BaseModel):
    receipt_id: int
    has_errors: bool
    errors: list[ErrorSchema]
    checked_at: datetime

    model_config = {"from_attributes": True}