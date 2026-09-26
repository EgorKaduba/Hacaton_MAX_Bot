from sqlalchemy import ForeignKey, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.db import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .receipt import Receipt


class MeterInfo(Base):
    __tablename__ = "meter_infos"

    receipt_id: Mapped[int] = mapped_column(ForeignKey("receipts.id", ondelete="CASCADE"))
    provider_code: Mapped[str | None] = mapped_column(String(50))
    service_name: Mapped[str | None] = mapped_column(String(255))
    meter_type: Mapped[str | None] = mapped_column(String(20))
    meter_number: Mapped[str | None] = mapped_column(String(50))
    verification_date: Mapped[str | None] = mapped_column(String(20))
    previous_reading: Mapped[float | None] = mapped_column(Numeric(12, 3))
    current_reading: Mapped[float | None] = mapped_column(Numeric(12, 3))
    consumption: Mapped[float | None] = mapped_column(Numeric(12, 3))
    norm_residential: Mapped[float | None] = mapped_column(Numeric(12, 4))
    norm_odn: Mapped[float | None] = mapped_column(Numeric(12, 4))
    total_residential: Mapped[float | None] = mapped_column(Numeric(12, 3))
    total_odn: Mapped[float | None] = mapped_column(Numeric(12, 3))

    receipt: Mapped["Receipt"] = relationship(back_populates="meter_infos")