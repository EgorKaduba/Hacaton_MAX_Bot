from sqlalchemy import ForeignKey, String, Numeric, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.db import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User
    from .service_charge import ServiceCharge
    from .meter_info import MeterInfo
    from .coefficient import Coefficient
    from .recalculation import Recalculation
    from .check_result import CheckResult


class Receipt(Base):
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    period_month: Mapped[str | None] = mapped_column(String(20))
    period_year: Mapped[int | None]
    file_path: Mapped[str | None] = mapped_column(String(500))
    raw_data: Mapped[dict | None] = mapped_column(JSONB)
    total_with_insurance: Mapped[float | None] = mapped_column(Numeric(12, 2))
    total_without_insurance: Mapped[float | None] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(20), default="uploaded")

    user: Mapped["User"] = relationship(back_populates="receipts")
    service_charges: Mapped[list["ServiceCharge"]] = relationship(
        back_populates="receipt", cascade="all, delete-orphan"
    )
    meter_infos: Mapped[list["MeterInfo"]] = relationship(
        back_populates="receipt", cascade="all, delete-orphan"
    )
    coefficients: Mapped[list["Coefficient"]] = relationship(
        back_populates="receipt", cascade="all, delete-orphan"
    )
    recalculations: Mapped[list["Recalculation"]] = relationship(
        back_populates="receipt", cascade="all, delete-orphan"
    )
    check_result: Mapped["CheckResult | None"] = relationship(
        back_populates="receipt", uselist=False, cascade="all, delete-orphan"
    )