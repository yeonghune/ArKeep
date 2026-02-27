# Read-Later WebApp

## Start

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- DB: localhost:5432

## MVP API

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh` (MVP placeholder)
- `POST /auth/logout`
- `POST /articles`
- `GET /articles?status=UNREAD|READ|ALL&sort=createdAt,desc`
- `PATCH /articles/{id}`
- `DELETE /articles/{id}`
