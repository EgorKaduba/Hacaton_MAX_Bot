from datetime import date
from sqlalchemy import String, Numeric, Date
from sqlalchemy.orm import Mapped, mapped_column

from ..core.db import Base


class Reference(Base):
    municipality: Mapped[str] = mapped_column(String(100), index=True)
    service_name: Mapped[str] = mapped_column(String(255))
    value_type: Mapped[str] = mapped_column(String(50))
    value: Mapped[float] = mapped_column(Numeric(12, 4))
    valid_from: Mapped[date | None] = mapped_column(Date)
    valid_to: Mapped[date | None] = mapped_column(Date)