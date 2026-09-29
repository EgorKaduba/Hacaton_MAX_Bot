from sqlalchemy import ForeignKey, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.db import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .receipt import Receipt


class Recalculation(Base):
    receipt_id: Mapped[int] = mapped_column(ForeignKey("receipts.id", ondelete="CASCADE"))
    service_name: Mapped[str | None] = mapped_column(String(255))
    reason: Mapped[str | None] = mapped_column(String(500))
    amount: Mapped[float | None] = mapped_column(Numeric(12, 2))

    receipt: Mapped["Receipt"] = relationship(back_populates="recalculations")