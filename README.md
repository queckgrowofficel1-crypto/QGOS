# QGOS — QueckGrow AI Operating System

Enterprise backend foundation for the QueckGrow platform.

## Current foundation

- NestJS application bootstrap
- Global configuration loading
- Security middleware (Helmet)
- Compression and CORS
- Global request validation
- Swagger/OpenAPI documentation at `/docs`
- Health endpoint at `/api/health`

## Run

```bash
npm install
npm run start:dev
```

Default port: `3000` (override with `PORT`).

## API

`GET /api/health` returns the service health and timestamp.

`/docs` exposes the generated Swagger UI.
