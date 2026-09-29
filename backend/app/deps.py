from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from typing import Annotated
from .core.db import async_session_maker


async def get_async_session():
	async with async_session_maker() as session:
		async with session.begin():
			yield session


SessionDep = Annotated[AsyncSession, Depends(get_async_session)]
