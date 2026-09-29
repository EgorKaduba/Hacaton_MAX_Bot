from fastapi import FastAPI

from .core.config import settings
from .api.receipts import router as receipts_router
from .api.analytics import router as analytics_router
from .api.ai import router as ai_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    contact={
        "name": settings.ADMIN_NAME,
        "email": settings.ADMIN_EMAIL
    },
    debug=settings.DEBUG
)
app.include_router(receipts_router)
app.include_router(analytics_router)
app.include_router(ai_router)

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "description": "Мини-приложение MAX для помощи в работе с квитанциями ЖКХ",
        "docs": "/api/docs"
    }
