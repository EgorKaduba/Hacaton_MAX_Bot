# КвитДом — цифровой помощник по квитанциям ЖКХ

Мини-приложение в МАХ для жителей многоквартирных домов: загрузка квитанции, проверка начислений на ошибки, формирование претензии в управляющую компанию, аналитика расходов и AI-помощник по вопросам ЖКУ.

- **Продакшн:** https://kvitdom-bot.ru
- **API:** https://kvitdom-bot.ru/api
- **Репозиторий:** https://github.com/EgorKaduba/Hacaton_MAX_Bot

---

## Проблема

Житель получает квитанцию, видит итоговую сумму — и не понимает, из чего она сложилась. Ошибки в начислениях (неверный тариф, забытый перерасчёт, двойное начисление, повышающий коэффициент без оснований) замечаются редко, потому что проверить каждую строку вручную сложно, а нормативы и формулы — неочевидны. Итог: переплата, которую никто не оспаривает, потому что непонятно, с чего начать.

## Решение

«КвитДом» — мини-приложение в МАХ, которое:

1. **Распознаёт квитанцию.** Пользователь загружает PDF ЕПД — сервис извлекает период, услуги, объёмы, тарифы, перерасчёты, коэффициенты и показания счётчиков.
2. **Проверяет начисления.** Восемь автоматических проверок находят арифметические ошибки, несоответствия тарифам, дубли, проблемы с перерасчётами и коэффициентами.
3. **Формирует претензию.** По найденным ошибкам генерируется PDF-жалоба в управляющую компанию с таблицей расхождений, правовым обоснованием и требованиями о перерасчёте.
4. **Показывает аналитику.** Динамика расходов по месяцам, структура по услугам и категориям, сравнение с предыдущими периодами.
5. **Отвечает на вопросы.** AI-помощник объясняет начисления простыми словами и указывает на аномалии.

---

## Основной пользовательский сценарий

1. Пользователь открывает мини-приложение в МАХ.
2. Нажимает «Добавить квитанцию» и загружает PDF ЕПД.
3. Сервис распознаёт данные и показывает их для проверки.
4. Запускается автоматическая проверка начислений.
5. Если найдены ошибки — открывается экран с их списком и кнопкой «Подать жалобу».
6. По нажатию формируется PDF-претензия, её можно скачать или отправить в чат.
7. Все загруженные квитанции доступны в разделе «Квитанции», аналитика — в разделе «Аналитика», вопросы — в разделе «AI-помощник».

---

## Состав и архитектура решения

КвитДом — клиент-серверное приложение: React-мини-приложение в МАХ общается с backend на FastAPI, который хранит данные в PostgreSQL и опционально использует LLM для AI-помощника.

Backend (FastAPI + SQLAlchemy async + PostgreSQL):

- `backend/app/api/receipts.py` — загрузка, список, детали, проверка, генерация жалобы;
- `backend/app/api/analytics.py` — аналитика и категории;
- `backend/app/api/ai.py` — чат с AI-помощником;
- `backend/app/tools/parse_epd.py` — парсинг PDF-квитанции через pdfplumber;
- `backend/app/tools/errors_check.py` — 8 проверок начислений;
- `backend/app/tools/complaint_generator.py` — генерация PDF-претензии через fpdf2;
- `backend/app/tools/receipt_service.py` — сохранение распознанной квитанции;
- `backend/app/tools/analytics_service.py` — агрегация расходов по периодам;
- `backend/app/tools/ai_service.py` — обёртка над LLM с контекстом квитанций;
- `backend/app/models/` — SQLAlchemy-модели (User, Receipt, ServiceCharge, MeterInfo, Coefficient, Recalculation, CheckResult);
- `backend/app/schemas/` — Pydantic-схемы запросов и ответов;
- `backend/app/core/` — config, db, зависимости;
- `backend/alembic/` — миграции схемы БД;
- `backend/fonts/` — шрифты Liberation Serif для PDF-жалобы;
- `backend/Dockerfile`, `backend/requirements.txt`.

Frontend (React 19 + Vite + MaxUI):

- `frontend/src/api/` — клиент API, обёртки над эндпоинтами, мок-данные;
- `frontend/src/bridge/max.js` — обёртка над MAX Bridge (back button, haptic, storage, share, download);
- `frontend/src/pages/` — экраны онбординга, главной, квитанций, ошибок, жалобы, аналитики, AI-помощника, профиля, помощи;
- `frontend/src/components/` — UI-компоненты (Card, Row, Donut, ProgressRing, Sheet, TabBar);
- `frontend/src/state/draft.jsx` — состояние сценария «добавить квитанцию»;
- `frontend/src/hooks/` — useApi, useProcess, useUser;
- `frontend/src/utils/` — форматирование, работа с периодами, параметры квитанций;
- `frontend/nginx.conf` — конфиг nginx для продакшна (проксирование /api на backend);
- `frontend/Dockerfile`, `frontend/package.json`, `frontend/vite.config.js`.

Структура репозитория:

```
Hacaton_MAX_Bot/
├── backend/                    # FastAPI-приложение
│   ├── alembic/                # миграции
│   ├── app/                    # код приложения
│   │   ├── api/                # эндпоинты
│   │   ├── core/               # config, db
│   │   ├── models/             # SQLAlchemy-модели
│   │   ├── schemas/            # Pydantic-схемы
│   │   └── tools/              # парсер, проверки, генератор жалоб
│   ├── fonts/                  # шрифты для PDF-жалобы
│   ├── alembic.ini
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── requirements.txt
│   └── __init__.py
├── frontend/                   # React-приложение
│   ├── src/                    # исходники
│   ├── Dockerfile
│   ├── nginx.conf              # конфиг nginx для продакшна
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── package-lock.json
│   ├── jsconfig.json
│   ├── .env.example
│   └── .dockerignore
├── receipt_examples/           # тестовые PDF-квитанции
│   ├── ЕПД_июнь_2026.pdf
│   ├── ЕПД_июль_2026.pdf
│   ├── ЕПД_июль_2026_с_ошибками.pdf
│   └── ЕПД_август_2026.pdf
├── DATA-API.yaml               # конфиг обязательных HTTP-проверок
├── openapi.json                # OpenAPI 3.1 со всеми эндпоинтами
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Быстрый запуск

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate         # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp ../.env.example .env
# отредактировать .env: PROJECT_NAME, ADMIN_NAME, ADMIN_EMAIL,
# POSTGRES_*, при необходимости LLM_*

alembic upgrade head
uvicorn app.main:app --reload
```

Backend поднимется на `http://127.0.0.1:8000`. Документация — `http://127.0.0.1:8000/docs`, OpenAPI — `/openapi.json`.

### 2. Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# VITE_API_URL=/api
# BACKEND_URL=http://127.0.0.1:8000

npm run dev
```

Frontend поднимется на `http://127.0.0.1:5173`. Через прокси Vite запросы `/api/*` уходят на backend.

### 3. Одной командой (Docker Compose)

```bash
docker compose up --build
```

Поднимает PostgreSQL, backend и frontend. Frontend раздаётся через nginx, который проксирует `/api/*` на backend.

---

## Переменные окружения

### Backend (`backend/.env`)

| Переменная | Назначение | Пример |
|---|---|---|
| `PROJECT_NAME` | Название сервиса | `КвитДом` |
| `PROJECT_VERSION` | Версия | `1.0.0` |
| `ADMIN_NAME` | Контактное лицо | `Ivan Ivanov` |
| `ADMIN_EMAIL` | Контактный email | `admin@example.com` |
| `DEBUG` | Режим отладки | `True` |
| `POSTGRES_SERVER` | Хост PostgreSQL | `localhost` |
| `POSTGRES_PORT` | Порт PostgreSQL | `5432` |
| `POSTGRES_DB` | Имя БД | `domkvit` |
| `POSTGRES_USER` | Пользователь БД | `domkvit` |
| `POSTGRES_PASSWORD` | Пароль БД | `secret` |
| `LLM_ENABLED` | Включён ли AI-помощник | `False` |
| `LLM_BASE_URL` | Базовый URL LLM API | `https://text.pollinations.ai/openai` |
| `LLM_API_KEY` | Ключ LLM (если требуется) | `""` |
| `LLM_MODEL` | Название модели | `openai` |

### Frontend (`frontend/.env.local`)

| Переменная | Назначение | Пример |
|---|---|---|
| `VITE_API_URL` | Префикс API (проксируется Vite) | `/api` |
| `BACKEND_URL` | Куда проксируются запросы `/api` | `http://127.0.0.1:8000` |
| `VITE_DEV_MAX_USER_ID` | `max_user_id` в браузере вне MAX | `1` |

Если `VITE_API_URL` пустой — frontend работает на мок-данных из `src/api/mock.js`, backend не нужен.

---

## Используемые порты

| Компонент | Порт |
|---|---|
| Backend (uvicorn) | `8000` |
| Frontend (Vite dev) | `5173` |
| Frontend (nginx в продакшне) | `80` / `443` |
| PostgreSQL | `5432` |

Продакшн: https://kvitdom-bot.ru (HTTPS, порт 443).

---

## Зависимости

**Backend:** FastAPI, SQLAlchemy 2 (async), asyncpg, psycopg2-binary, Alembic, pydantic-settings, pdfplumber, fpdf2, openai (для LLM), uvicorn. Полный список — `backend/requirements.txt`.

**Frontend:** React 19, React Router 7, Vite 8, MaxUI, qrcode.react. Полный список — `frontend/package.json` и `frontend/package-lock.json`.

---

## Внешние сервисы и интеграции

| Сервис | Назначение | Статус |
|---|---|---|
| MAX Bridge | Haptic, BackButton, DeviceStorage, share, download | реальная интеграция |
| MAX UI | React-компоненты в стиле MAX | реальная интеграция |
| LLM API (Pollinations/OpenAI-совместимый) | AI-помощник по квитанциям | опционально, `LLM_ENABLED=false` по умолчанию |
| PostgreSQL | Хранение пользователей, квитанций, ошибок | реальная интеграция |

LLM отключён по умолчанию. Если `LLM_ENABLED=False`, эндпоинт `/ai/chat` возвращает заглушку «AI-помощник временно отключён».

---

## Работа с данными

- Хранятся: `max_user_id`, распознанные квитанции и связанные таблицы (услуги, счётчики, коэффициенты, перерасчёты, результаты проверок).
- Персональные данные не хранятся. ФИО, адрес и лицевой счёт пользователь вписывает в PDF-претензию вручную после скачивания.
- Сырые PDF-файлы квитанций сохраняются в `backend/uploads/` для повторного парсинга.
- Все данные обезличены на уровне API: клиент передаёт только `max_user_id`.

---

## Порядок работы с тестовыми данными

В репозитории лежат готовые тестовые квитанции в папке `receipt_examples/`:

```
receipt_examples/
    ЕПД_июнь_2026.pdf            # корректная квитанция за июнь
    ЕПД_июль_2026.pdf            # корректная квитанция за июль
    ЕПД_июль_2026_с_ошибками.pdf # квитанция за июль со специально внесёнными ошибками
    ЕПД_август_2026.pdf          # корректная квитанция за август
```

Все файлы обезличены: ФИО, адрес и лицевой счёт заменены на тестовые, реальные персональные данные отсутствуют.

Квитанция `ЕПД_июль_2026_с_ошибками.pdf` содержит намеренно внесённые нарушения для проверки работы детектора:

- расхождение между `amount` и `volume × tariff`;
- повышающий коэффициент, не согласованный с суммой превышения;
- ошибка в сумме перерасчёта;
- несоответствие в итоговой сумме квитанции.

Загружайте эти файлы по очереди, чтобы проверить все сценарии: и корректные квитанции без ошибок, и квитанцию с разными типами нарушений.

---

## Пошаговый сценарий проверки

### Backend отдельно

```bash
# 1. Проверка живости
curl https://kvitdom-bot.ru/openapi.json

# 2. Загрузка квитанции
curl -X POST https://kvitdom-bot.ru/receipts/upload/1 \
  -F "file=@receipt_examples/ЕПД_июль_2026_с_ошибками.pdf"

# 3. Проверка на ошибки (используйте id из ответа выше)
curl -X POST https://kvitdom-bot.ru/receipts/check/1

# 4. Скачать жалобу (если есть ошибки)
curl -OJ https://kvitdom-bot.ru/receipts/1/complaint

# 5. Аналитика
curl "https://kvitdom-bot.ru/analytics?max_user_id=1&period=half_year"
curl "https://kvitdom-bot.ru/analytics/categories?max_user_id=1&year=2026&month=8"

# 6. AI-помощник
curl -X POST https://kvitdom-bot.ru/ai/chat \
  -H "Content-Type: application/json" \
  -d "{\"max_user_id\":1,\"message\":\"Какая итоговая сумма в последней квитанции?\"}"
```

### Frontend

1. Открыть https://kvitdom-bot.ru/#/home.
2. Пройти онбординг.
3. «Добавить квитанцию» → выбрать PDF из `receipt_examples/` → дождаться распознавания.
4. Проверить данные → «Проверить на ошибки».
5. На экране результата открыть список ошибок → «Подать жалобу» → скачать PDF.

### Основной сценарий в MAX

1. Открыть мини-приложение по ссылке чат-бота.
2. Повторить шаги 3–5 из frontend-сценария.

---

## Примеры ожидаемого поведения системы

| Действие | Ожидаемый результат |
|---|---|
| Загрузка корректного PDF | 201, JSON с `id`, `period_month`, `total_without_insurance` |
| Загрузка битого PDF | 400, `{"detail":"Не удалось распознать квитанцию"}` |
| Проверка корректной квитанции | `{"has_errors": false, "errors": []}` |
| Проверка квитанции с ошибками | `{"has_errors": true, "errors":[...]}` — 2–8 ошибок разных типов |
| Запрос жалобы без ошибок | 400, `{"detail":"No errors found"}` |
| Запрос жалобы с ошибками | 200, `application/pdf` с претензией |
| AI-чат при `LLM_ENABLED=false` | `{"answer":"AI-помощник временно отключён."}` |
| Список квитанций нового пользователя | 404 → frontend показывает пустое состояние |

---

## Известные ограничения

- Парсер PDF рассчитан на формат ЕПД Московской области. Квитанции других регионов и форматов могут распознаваться частично.
- Справочник тарифов не подключён. Сервис проверяет внутреннюю согласованность (`volume × tariff = amount`), но не сверяет тариф с утверждённым для конкретного дома.
- Показания счётчиков используются только если они есть в квитанции.
- AI-помощник отключён по умолчанию, включается переменной `LLM_ENABLED=True`.
- Жалоба формируется без персональных данных — пользователь вписывает их вручную.
- Повторная проверка квитанции возвращает сохранённый результат; принудительный пересчёт пока не предусмотрен.
- Мок-режим frontend (`VITE_API_URL=`) не полностью повторяет поведение backend — используется для демонстрации UI без запущенного API.

---

## Остановка и повторный запуск

### Docker Compose

```bash
docker compose down              # остановить
docker compose down -v           # остановить и удалить volume с БД
docker compose up --build        # пересобрать и запустить
```

### Локально

- Backend: `Ctrl+C` в терминале с uvicorn.
- Frontend: `Ctrl+C` в терминале с `npm run dev`.
- PostgreSQL: остановить сервис системы или `docker compose stop db`.

Повторный запуск — те же команды, что и при первом старте.

---

## Docker

- `backend/Dockerfile` — образ backend (Python 3.12, зависимости, uvicorn).
- `frontend/Dockerfile` — многоступенчатая сборка Vite + nginx для раздачи статики.
- `frontend/nginx.conf` — проксирование `/api/*` на backend и SPA-fallback на `index.html`.
- `docker-compose.yml` — PostgreSQL + backend + frontend одной командой.
- `.dockerignore` в `backend/` и `frontend/` — исключают `.venv`, `__pycache__`, `.env`, `uploads/`, `node_modules`.

---

## Техническая документация

- `DATA-API.yaml` — конфигурация обязательных HTTP-проверок (DATA-API 1.0), лежит в корне.
- `openapi.json` — OpenAPI 3.1 со всеми эндпоинтами, лежит в корне.

---

## Команда

- **Название команды:** Фуллстак
- **Название решения:** КвитДом
- **Трек:** Умный город
- **Платформа:** МАХ (мини-приложение + чат-бот)