# ARKEEP

ARKEEP은 링크를 저장하고 읽기 상태를 관리하는 아티클 아카이브 서비스입니다.
Next.js 프론트엔드, Spring Boot 백엔드, PostgreSQL로 구성된 풀스택 프로젝트입니다.

## 개발 실행

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- DB: localhost:5432

## 운영 실행 (Nginx)

```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up --build -d
```

- Entry point (Nginx): http://localhost:8080
- `/` -> frontend
- `/backend/*` -> backend
