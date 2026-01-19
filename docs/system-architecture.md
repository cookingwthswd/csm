# CKMS - System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CKMS System                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐         ┌─────────────┐         ┌───────────┐  │
│  │   Next.js   │  HTTP   │   NestJS    │  SQL    │ Supabase  │  │
│  │   Frontend  │◄───────►│   Backend   │◄───────►│ PostgreSQL│  │
│  │  (port 3000)│         │  (port 3001)│         │           │  │
│  └─────────────┘         └─────────────┘         └───────────┘  │
│        │                       │                       │        │
│        │                       │                       │        │
│        ▼                       ▼                       ▼        │
│  ┌─────────────┐         ┌─────────────┐         ┌───────────┐  │
│  │  Supabase   │         │   Swagger   │         │    RLS    │  │
│  │    Auth     │         │    Docs     │         │  Policies │  │
│  │   (JWT)     │         │ (/api/docs) │         │           │  │
│  └─────────────┘         └─────────────┘         └───────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```mermaid
graph TB
    subgraph Frontend["apps/web (Next.js)"]
        Pages[Pages/Routes]
        Providers[Auth Provider]
        Lib[Lib/Utils]
    end

    subgraph Backend["apps/api (NestJS)"]
        Controllers[Controllers]
        Services[Services]
        Guards[Auth Guards]
        Interceptors[Interceptors]
    end

    subgraph Database["Supabase"]
        PostgreSQL[(PostgreSQL)]
        Auth[Supabase Auth]
        RLS[Row Level Security]
    end

    subgraph Shared["packages/types"]
        Types[TypeScript Types]
        Schemas[Zod Schemas]
    end

    Pages --> Providers
    Providers --> Lib
    Lib --> Auth
    Lib --> Controllers

    Controllers --> Guards
    Guards --> Services
    Services --> PostgreSQL
    Services --> Interceptors

    Types --> Frontend
    Types --> Backend
    Schemas --> Types
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web (Next.js)
    participant S as Supabase Auth
    participant A as API (NestJS)
    participant DB as PostgreSQL

    U->>W: Login (email/password)
    W->>S: signInWithPassword()
    S->>S: Validate credentials
    S->>S: Generate JWT with app_metadata
    S-->>W: JWT Token + User
    W->>W: Store session

    U->>W: Request data
    W->>A: GET /orders (Bearer token)
    A->>A: JwtAuthGuard validates token
    A->>A: RolesGuard checks permissions
    A->>DB: Query with chain_id filter
    DB-->>A: Filtered data
    A-->>W: JSON response
    W-->>U: Display data
```

## Data Flow

### Order Creation Flow

```mermaid
sequenceDiagram
    participant Store as Store Staff
    participant API as NestJS API
    participant DB as PostgreSQL

    Store->>API: POST /orders
    Note over API: ValidationPipe validates DTO
    Note over API: JwtAuthGuard extracts user
    Note over API: RolesGuard checks 'store_staff'

    API->>DB: INSERT order
    DB-->>API: order record
    API->>DB: INSERT order_items
    DB-->>API: items records

    Note over API: TransformInterceptor wraps response
    API-->>Store: { success: true, data: order }
```

## Database Schema

```mermaid
erDiagram
    stores ||--o{ users : employs
    stores ||--o{ inventory : has
    stores ||--o{ orders : places
    stores ||--o{ alerts : receives

    categories ||--o{ items : contains
    items ||--o{ recipe_details : "is product"
    items ||--o{ recipe_details : "is material"
    items ||--o{ batches : "has"
    items ||--o{ inventory : tracked_in
    items ||--o{ order_items : ordered

    orders ||--o{ order_items : contains
    orders ||--o{ shipments : fulfilled_by

    shipments ||--o{ shipment_items : contains
    batches ||--o{ shipment_items : sourced_from
    batches ||--o{ inventory_transactions : affects

    production_plans ||--o{ production_details : contains
    items ||--o{ production_details : produced
```

## Security Architecture

### Authentication Layers

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| 1 | Supabase Auth | User authentication, JWT generation |
| 2 | JwtAuthGuard | Token validation, user extraction |
| 3 | RolesGuard | Role-based access control |
| 4 | RLS Policies | Database-level row security |

### JWT Payload Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "app_metadata": {
    "chain_id": 1,
    "role": "store_staff",
    "store_id": 5
  },
  "aud": "authenticated",
  "exp": 1234567890
}
```

### Data Isolation

- All queries filter by `chain_id` from JWT
- Backend uses service role key (bypasses RLS)
- Frontend uses anon key (RLS enforced)
- Never trust client-provided identifiers

## Deployment Architecture

### Development
```
Local Machine
├── Supabase (Docker via supabase start)
│   ├── PostgreSQL :54322
│   ├── Auth :54321
│   └── Studio :54323
├── API (bun run dev) :3001
└── Web (bun run dev) :3000
```

### Production (Planned)
```
Cloud Provider
├── Supabase Cloud
│   ├── PostgreSQL (managed)
│   └── Auth (managed)
├── API (container/serverless)
└── Web (Vercel/static)
```

## Monorepo Structure

```
Turborepo Pipeline
├── build: apps/api, apps/web, packages/types
├── dev: parallel development servers
├── lint: ESLint across all packages
└── clean: remove build artifacts
```

### Package Dependencies
```
apps/api
└── @ckms/types (workspace:*)

apps/web
└── @ckms/types (workspace:*)

packages/types
└── zod (external)
```
