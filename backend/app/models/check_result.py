from datetime import datetime
from sqlalchemy import ForeignKey, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.db import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .receipt import Receipt


class CheckResult(Base):
    __tablename__ = "check_results"

    receipt_id: Mapped[int] = mapped_column(
        ForeignKey("receipts.id", ondelete="CASCADE"), unique=True
    )
    has_errors: Mapped[bool] = mapped_column(Boolean, default=False)
    errors: Mapped[list | None] = mapped_column(JSONB)
    checked_at: Mapped[datetime | None] = mapped_column(DateTime)

    receipt: Mapped["Receipt"] = relationship(back_populates="check_result")