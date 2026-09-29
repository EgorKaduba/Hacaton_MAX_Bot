from sqlalchemy import ForeignKey, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.db import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .receipt import Receipt


class ServiceCharge(Base):
    __tablename__ = "service_charges"

    receipt_id: Mapped[int] = mapped_column(ForeignKey("receipts.id", ondelete="CASCADE"))
    section: Mapped[str | None] = mapped_column(String(50))
    service_name: Mapped[str | None] = mapped_column(String(255))
    volume: Mapped[float | None] = mapped_column(Numeric(12, 4))
    unit: Mapped[str | None] = mapped_column(String(20))
    tariff: Mapped[float | None] = mapped_column(Numeric(12, 4))
    amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    benefit: Mapped[float | None] = mapped_column(Numeric(12, 2))
    recalculation: Mapped[float | None] = mapped_column(Numeric(12, 2))
    debt_start: Mapped[float | None] = mapped_column(Numeric(12, 2))
    paid: Mapped[float | None] = mapped_column(Numeric(12, 2))
    total: Mapped[float | None] = mapped_column(Numeric(12, 2))

    receipt: Mapped["Receipt"] = relationship(back_populates="service_charges")