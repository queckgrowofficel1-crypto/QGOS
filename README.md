# QGOS - QueckGrow AI Operating System

Enterprise-grade AI Operating System built with NestJS and Prisma.

## Overview

QGOS is a comprehensive AI Operating System designed for enterprise environments, providing a scalable, modular architecture for AI services, data management, and business logic orchestration.

The existing QuickGrow website remains the execution platform; QGOS extends the existing system rather than replacing it.

## Tech Stack

- **Framework:** NestJS 10.x
- **Runtime:** Node.js 24
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 14+
- **ORM:** Prisma 5.x
- **Authentication:** JWT with Passport
- **API Documentation:** Swagger/OpenAPI (development by default)
- **Container:** Docker & Docker Compose
- **Testing:** Jest

## Prerequisites

- Node.js 24 and npm
- PostgreSQL 14+
- Docker & Docker Compose (for containerized setup)
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/queckgrowofficel1-crypto/QGOS.git
cd QGOS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database, JWT, admin and CORS settings
```

For production, `NODE_ENV=production` requires an explicit `CORS_ORIGIN`. Swagger is disabled unless `ENABLE_SWAGGER=true` is explicitly set.

### 4. Database Setup

```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

For production deployments, use `npm run prisma:migrate:deploy` against the production database.

### 5. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.

## Production Verification

```bash
npm run build
npm run prisma:generate
npm run lint:check
npm test -- --runInBand --passWithNoTests
npm run test:e2e
docker build -t qgos:production .
```

The API exposes `GET /health` for runtime health checks. The production Docker image also includes a container healthcheck for this endpoint.

## Release & Go-Live

The roadmap currently includes Phases 1–13. Phases 8–12 harden, release-engineer, hand over, secure, and operationalize the system. Phase 13 is the final Go-Live / Production Launch gate.

See:

- `docs/PHASE_8_PRODUCTION_HARDENING.md`
- `docs/PHASE_9_RELEASE_ENGINEERING.md`
- `docs/PHASE_10_FINAL_RELEASE.md`
- `docs/PHASE_11_PRODUCTION_HANDOVER.md`
- `docs/PHASE_12_SECURITY_OBSERVABILITY.md`
- `docs/PHASE_13_FINAL_GO_LIVE.md`
- `docs/OPERATIONS_RUNBOOK.md`

Phase 13 separates repository/CI completion from external deployment-owner prerequisites such as production credentials, database provisioning, backups, domain/TLS, monitoring, and business/compliance sign-off.

## Available Scripts

### Development

```bash
npm run start
npm run start:dev
npm run start:debug
```

### Database

```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:migrate:deploy
npm run prisma:studio
```

### Build & Testing

```bash
npm run build
npm run lint
npm run lint:check
npm run format
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

### Docker

```bash
npm run docker:up
npm run docker:down
npm run docker:build
```

## Project Structure

```
src/
├── main.ts
├── app.module.ts
├── modules/
├── common/
├── config/
└── database/

prisma/
├── schema.prisma
└── migrations/

docs/
└── [documentation files]

test/
└── [e2e tests]
```

## API Documentation

Swagger is available at `http://localhost:3000/api` in development. In production it remains disabled unless `ENABLE_SWAGGER=true` is explicitly configured.

## Contributing

See `docs/CONTRIBUTING.md` for guidelines.

## License

MIT - See LICENSE file for details

## Support

For issues and feature requests, please use the GitHub Issues page.
