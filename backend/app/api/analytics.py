from fastapi import APIRouter, Query

from ..deps import SessionDep
from ..schemas.analytics import AnalyticsResponse, CategoryItem
from ..tools.analytics_service import get_analytics, get_categories

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsResponse)
async def analytics(
    session: SessionDep,
    max_user_id: int = 1,
    period: str = Query("half_year", pattern="^(month|half_year|year)$"),
):
    return await get_analytics(session, max_user_id, period)


@router.get("/categories", response_model=list[CategoryItem])
async def analytics_categories(
    session: SessionDep,
    max_user_id: int = 1,
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
):
    return await get_categories(session, max_user_id, year, month)