from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.receipt import Receipt
from ..models.user import User


MONTH_NAMES_RU = {
    1: "январь", 2: "февраль", 3: "март", 4: "апрель",
    5: "май", 6: "июнь", 7: "июль", 8: "август",
    9: "сентябрь", 10: "октябрь", 11: "ноябрь", 12: "декабрь",
}
MONTH_NAMES = {
    1: "янв", 2: "фев", 3: "мар", 4: "апр",
    5: "май", 6: "июн", 7: "июл", 8: "авг",
    9: "сен", 10: "окт", 11: "ноя", 12: "дек",
}
MONTH_NUMBERS = {
    "январь": 1, "февраль": 2, "март": 3, "апрель": 4,
    "май": 5, "июнь": 6, "июль": 7, "август": 8,
    "сентябрь": 9, "октябрь": 10, "ноябрь": 11, "декабрь": 12,
}
CATEGORY_KEYWORDS = {
    "Отопление": ["отопление"],
    "Горячая вода": ["горячее", "гвс"],
    "Холодная вода": ["холодное", "хвс", "водоотведение"],
    "Электроэнергия": ["электр", "эл.энерг"],
    "Газ": ["газ"],
    "Содержание жилья": ["содержание"],
    "Капремонт": ["капитальный", "капремонт"],
    "ТКО": ["тко", "обращение с твёрдыми"],
}


def _categorize(service_name: str) -> str:
    if not service_name:
        return "Прочее"
    name_lower = service_name.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in name_lower for kw in keywords):
            return category
    return "Прочее"


def _get_period_range(period: str) -> int:
    return {"month": 1, "half_year": 6, "year": 12}.get(period, 6)


async def get_analytics(
    session: AsyncSession,
    max_user_id: int,
    period: str = "half_year",
) -> dict:
    user = await session.scalar(
        select(User).where(User.max_user_id == max_user_id)
    )
    if not user:
        return _empty_response(period)

    months_count = _get_period_range(period)
    receipts = await session.scalars(
        select(Receipt)
        .where(Receipt.user_id == user.id)
        .order_by(Receipt.period_year, Receipt.period_month)
        .options(selectinload(Receipt.service_charges))
    )
    receipts = receipts.all()

    if not receipts:
        return _empty_response(period)
    recent = receipts[-months_count:]
    points = []
    for r in recent:
        if not r.period_year or not r.period_month:
            continue
        month_num = MONTH_NUMBERS.get((r.period_month or "").lower())
        if not month_num:
            continue
        points.append({
            "month": month_num,
            "year": r.period_year,
            "label": MONTH_NAMES.get(month_num, "?"),
            "total": float(r.total_without_insurance or 0),
        })
    totals = [p["total"] for p in points]
    if not totals:
        return _empty_response(period)

    average = sum(totals) / len(totals)
    maximum = max(totals)

    growth_abs = 0.0
    growth_percent = 0.0
    if len(totals) >= 2 and totals[-2] > 0:
        growth_abs = totals[-1] - totals[-2]
        growth_percent = (growth_abs / totals[-2]) * 100

    return {
        "period": period,
        "points": points,
        "summary": {
            "average": round(average, 2),
            "maximum": round(maximum, 2),
            "growth_abs": round(growth_abs, 2),
            "growth_percent": round(growth_percent, 1),
        }
    }


def _empty_response(period: str) -> dict:
    return {
        "period": period,
        "points": [],
        "summary": {
            "average": 0.0,
            "maximum": 0.0,
            "growth_abs": 0.0,
            "growth_percent": 0.0,
        }
    }
    
async def get_categories(
    session: AsyncSession,
    max_user_id: int,
    year: int,
    month: int,
) -> list[dict]:
    user = await session.scalar(
        select(User).where(User.max_user_id == max_user_id)
    )
    if not user:
        return []
    month_name = MONTH_NAMES_RU.get(month)
    if not month_name:
        return []
    receipt = await session.scalar(
        select(Receipt)
        .where(
            Receipt.user_id == user.id,
            Receipt.period_year == year,
            Receipt.period_month == month_name,
        )
        .options(selectinload(Receipt.service_charges))
    )
    if not receipt:
        return []

    categories_map = defaultdict(float)
    for sc in receipt.service_charges:
        if sc.total is None:
            continue
        category = _categorize(sc.service_name or "")
        categories_map[category] += float(sc.total)

    total = sum(categories_map.values())
    return [
        {
            "name": name,
            "total": round(amount, 2),
            "percent": round((amount / total) * 100, 1) if total else 0,
        }
        for name, amount in sorted(categories_map.items(), key=lambda x: -x[1])
    ]