from sqlalchemy import BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.db import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .receipt import Receipt


class User(Base):
    max_user_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)

    receipts: Mapped[list["Receipt"]] = relationship(back_populates="user")