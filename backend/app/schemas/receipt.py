from pydantic import BaseModel


class ReceiptUploadResponse(BaseModel):
    id: int
    period_month: str | None
    period_year: int | None
    total_without_insurance: float | None
    total_with_insurance: float | None
    status: str

    model_config = {"from_attributes": True}