FROM python:3.12-slim

# Переменные окружения Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Рабочая директория
WORKDIR /app

# Системные зависимости:
# - gcc, libpq-dev — для psycopg2 (синхронный драйвер для Alembic)
# - libpoppler-cpp-dev, poppler-utils — для pdfplumber (парсинг PDF)
# - curl — для healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    poppler-utils \
    libpoppler-cpp-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Сначала зависимости — для кэширования
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Затем код
COPY . .

# Папка для загруженных PDF
RUN mkdir -p /app/uploads

EXPOSE 8000

# Healthcheck — чтобы docker-compose знал, что бэкенд жив
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/docs || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]