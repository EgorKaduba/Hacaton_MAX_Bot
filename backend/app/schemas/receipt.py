from pydantic import BaseModel


class ReceiptBase(BaseModel):
    id: int
    period_month: str | None
    period_year: int | None
    total_without_insurance: float | None
    total_with_insurance: float | None
    status: str
    
class ReceiptUploadResponse(ReceiptBase):
    model_config = {"from_attributes": True}

class ReceiptsListItem(ReceiptBase):
    model_config = {"from_attributes": True}
    
class ServiceChargeResponse(BaseModel):
    id: int
    section: str | None
    service_name: str | None
    volume: float | None
    unit: str | None
    tariff: float | None
    amount: float | None
    benefit: float | None
    recalculation: float | None
    debt_start: float | None
    paid: float | None
    total: float | None

    model_config = {"from_attributes": True}
    
class MeterInfoResponse(BaseModel):
    id: int
    service_name: str | None
    meter_type: str | None
    meter_number: str | None
    previous_reading: float | None
    current_reading: float | None
    consumption: float | None

    model_config = {"from_attributes": True}


class CoefficientResponse(BaseModel):
    id: int
    service_name: str | None
    coefficient: float | None
    excess_amount: float | None

    model_config = {"from_attributes": True}


class RecalculationResponse(BaseModel):
    id: int
    service_name: str | None
    reason: str | None
    amount: float | None

    model_config = {"from_attributes": True}
    
class ReceiptDetailResponse(ReceiptBase):
    service_charges: list[ServiceChargeResponse] = []
    meter_infos: list[MeterInfoResponse] = []
    coefficients: list[CoefficientResponse] = []
    recalculations: list[RecalculationResponse] = []

    model_config = {"from_attributes": True}

    
    