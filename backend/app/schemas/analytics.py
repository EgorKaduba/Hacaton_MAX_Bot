from pydantic import BaseModel


class MonthPoint(BaseModel):
    month: int
    year: int
    label: str
    total: float
    

class SummaryMetrics(BaseModel):
    average: float
    maximum: float
    growth_abs: float
    growth_percent: float


class CategoryItem(BaseModel):
    name: str
    total: float
    percent: float
    

class AnalyticsResponse(BaseModel):
    period: str
    points: list[MonthPoint]
    summary: SummaryMetrics