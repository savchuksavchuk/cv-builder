# cv-builder

## Запуск

```sh
ANTHROPIC_API_KEY=sk-ant-... docker compose up --build
```

- UI: http://localhost:3000
- API: http://localhost:3777 (Swagger: `/docs`)

Єдиний секрет — `ANTHROPIC_API_KEY`, його передають у команді запуску. Решта налаштувань (порти, Postgres, URL) прописана в `docker-compose.yml`.
