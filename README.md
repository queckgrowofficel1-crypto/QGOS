# QGOS - QueckGrow AI Operating System

Enterprise-grade AI Operating System built with NestJS and Prisma.

## Overview

QGOS is a comprehensive AI Operating System designed for enterprise environments, providing a scalable, modular architecture for AI services, data management, and business logic orchestration.

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
# Generate Prisma client
npm run prisma:generate

# Run migrations for development
npm run prisma:migrate:dev
```

For production deployments, use `npm run prisma:migrate:deploy` against the production database.

### 5. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`  
Swagger Documentation: `http://localhost:3000/api`

## Production Verification

```bash
npm run build
npm run prisma:generate
npm run lint:check
npm test -- --runInBand --passWithNoTests
docker build -t qgos:production .
```

The API exposes `GET /health` for runtime health checks. The production Docker image also includes a container healthcheck for this endpoint.

## Available Scripts

### Development

```bash
npm run start          # Start production server
npm run start:dev      # Start with hot-reload
npm run start:debug    # Start with debugger
```

### Database

```bash
npm run prisma:generate       # Generate Prisma client
npm run prisma:migrate:dev    # Create and run migrations
npm run prisma:migrate:deploy # Deploy migrations to production
npm run prisma:studio         # Open Prisma Studio
```

### Build & Testing

```bash
npm run build        # Build for production
npm run lint         # Run ESLint with fixes
npm run lint:check   # Run ESLint without changes
npm run format       # Format code with Prettier
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Generate coverage report
npm run test:e2e     # Run end-to-end tests
```

### Docker

```bash
npm run docker:up      # Start Docker containers
npm run docker:down    # Stop Docker containers
npm run docker:build   # Build Docker image
```

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── modules/                # Feature modules
├── common/                 # Shared utilities, decorators, filters
├── config/                 # Configuration
└── database/               # Database setup

prisma/
├── schema.prisma           # Database schema
└── migrations/             # Database migrations

docs/
└── [documentation files]

test/
└── [test files]
```

## API Documentation

Swagger is available at `http://localhost:3000/api` in development. In production it remains disabled unless `ENABLE_SWAGGER=true` is explicitly configured.

## Release & Handover

See:

- `docs/PHASE_8_PRODUCTION_HARDENING.md`
- `docs/PHASE_9_RELEASE_ENGINEERING.md`
- `docs/PHASE_10_FINAL_RELEASE.md`
- `docs/PHASE_11_PRODUCTION_HANDOVER.md`

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

## License

MIT - See LICENSE file for details

## Support

For issues and feature requests, please use the GitHub Issues page.
