from pydantic import BaseModel
from datetime import datetime

class ErrorSchema(BaseModel):
    type: str
    severity: str
    description: str
    actual: float | None = None
    expected: float | None = None

class ErrorsResponse(BaseModel):
    receipt_id: int
    has_errors: bool
    errors: list[ErrorSchema]
    checked_at: datetime

    model_config = {"from_attributes": True}