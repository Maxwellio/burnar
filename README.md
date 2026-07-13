# burnar

Каркас приложения: **Spring Boot** backend + **React / MUI / Vite** frontend.
Стек и версии совпадают с проектом Work_redone (Патрубки).

## Стек

| Слой | Технологии |
|------|------------|
| Backend | Java 17, Spring Boot **2.7.8**, Web, Data JPA, Security, PostgreSQL |
| Frontend | React **18**, MUI **5**, Emotion, react-router-dom **6**, Vite **5** (JSX, без TypeScript) |

## Структура

```
burnar/
├── backend/    # Maven, порт 8095
└── frontend/   # Vite, порт 5173, proxy /api → backend
```

## Backend

Нужен локальный PostgreSQL с параметрами из `backend/src/main/resources/application.yml`
(плейсхолдеры `your_db` / `your_username` / `your_password`, схема `burnar`).

```bash
cd backend
mvn spring-boot:run
```

Проверка: `GET http://localhost:8095/api/health`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Откроется `http://localhost:5173`. Запросы к `/api` проксируются на backend.
