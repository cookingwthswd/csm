# CKMS - Central Kitchen Management System

A comprehensive supply chain management solution for F&B chains with central kitchen operations.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Backend** | NestJS 10, Swagger, Passport |
| **Database** | Supabase (PostgreSQL), RLS |
| **Auth** | Supabase Auth (JWT) |
| **Monorepo** | Turborepo, Bun |
| **Types** | Zod 4.x |

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) 1.3+
- [Docker](https://docker.com/) (for Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd ckms
bun install

# Start Supabase (Docker required)
supabase start

# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Get Supabase credentials and update .env files
supabase status

# Start development
bun run dev
```

### Access Points
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **Swagger:** http://localhost:3001/api/docs
- **Supabase Studio:** http://localhost:54323

## Project Structure

```
ckms/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   └── types/        # Shared TypeScript types
├── supabase/
│   ├── migrations/   # Database schema
│   └── seed.sql      # Sample data
└── docs/             # Documentation
```

## Scripts

```bash
bun run dev       # Start all apps in dev mode
bun run build     # Build all apps
bun run lint      # Lint all apps

# Database
bun run db:start  # Start Supabase
bun run db:stop   # Stop Supabase
bun run db:reset  # Reset database with migrations + seed
```

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌───────────┐
│   Next.js   │─────►│   NestJS    │─────►│ Supabase  │
│   :3000     │ HTTP │   :3001     │ SQL  │ PostgreSQL│
└─────────────┘      └─────────────┘      └───────────┘
       │                    │
       └────────────────────┴─── Supabase Auth (JWT)
```

## Features

- **Order Management** - Store ordering workflow with status tracking
- **Inventory** - Stock levels, batch tracking, alerts
- **Production Planning** - Schedule and track production
- **Shipments** - Delivery tracking with batch traceability
- **RBAC** - 5 roles: admin, manager, supply_coordinator, kitchen_staff, store_staff

## Documentation

- [Project Overview & PDR](docs/project-overview-pdr.md)
- [Codebase Summary](docs/codebase-summary.md)
- [Code Standards](docs/code-standards.md)
- [System Architecture](docs/system-architecture.md)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /orders | List orders (paginated) |
| GET | /orders/:id | Get order details |
| POST | /orders | Create order |
| PUT | /orders/:id/status | Update order status |

Full API documentation at `/api/docs` (Swagger).

## Environment Variables

See `.env.example` files in each app:
- `apps/api/.env.example` - Backend secrets
- `apps/web/.env.example` - Frontend public vars

Key variables:
```
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
SUPABASE_JWT_SECRET=<from supabase status>
```

## License

See [LICENSE](LICENSE) file.
