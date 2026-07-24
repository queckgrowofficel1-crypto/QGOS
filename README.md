# QGOS - QueckGrow AI Operating System

Enterprise-grade AI Operating System built with NestJS, TypeORM, and Prisma.

## Overview

QGOS is a comprehensive AI Operating System designed for enterprise environments, providing a scalable, modular architecture for AI services, data management, and business logic orchestration.

## Tech Stack

- **Framework:** NestJS 10.x
- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL
- **ORM:** TypeORM, Prisma
- **Authentication:** JWT with Passport
- **API Documentation:** Swagger/OpenAPI
- **Container:** Docker & Docker Compose
- **Testing:** Jest

## Prerequisites

- Node.js 20+ and npm/yarn
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
# Edit .env with your database credentials
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev
```

### 5. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`  
Swagger Documentation: `http://localhost:3000/api`

## Available Scripts

### Development

```bash
npm run start          # Start production server
npm run start:dev      # Start with hot-reload
npm run start:debug    # Start with debugger
```

### Database

```bash
npm run prisma:generate      # Generate Prisma client
npm run prisma:migrate:dev   # Create and run migrations
npm run prisma:migrate:deploy # Deploy migrations to production
npm run prisma:studio        # Open Prisma Studio
```

### Build & Testing

```bash
npm run build              # Build for production
npm run lint               # Run ESLint with fixes
npm run format             # Format code with Prettier
npm run test               # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Generate coverage report
npm run test:e2e          # Run end-to-end tests
```

### Docker

```bash
npm run docker:up        # Start Docker containers
npm run docker:down      # Stop Docker containers
npm run docker:build     # Build Docker image
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

## Database Schema

See `prisma/schema.prisma` for the complete database schema. Prisma Studio can be used to visualize and manage the database:

```bash
npm run prisma:studio
```

## API Documentation

Once the server is running, access Swagger UI at:

```
http://localhost:3000/api
```

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

## License

MIT - See LICENSE file for details

## Support

For issues and feature requests, please use the GitHub Issues page.