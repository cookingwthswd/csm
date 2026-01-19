# CKMS - Codebase Summary

## Project Structure

```
ckms/
├── apps/
│   ├── api/                    # NestJS backend
│   │   └── src/
│   │       ├── main.ts         # App bootstrap, Swagger, guards
│   │       ├── app.module.ts   # Root module
│   │       ├── app.controller.ts
│   │       ├── app.service.ts
│   │       ├── auth/           # Authentication module
│   │       ├── orders/         # Orders module (template)
│   │       └── common/         # Shared utilities
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/            # App router pages
│           ├── lib/            # Utilities (Supabase, API)
│           └── providers/      # React contexts
├── packages/
│   └── types/                  # Shared TypeScript types
│       └── src/
│           ├── index.ts        # Re-exports
│           ├── auth.ts         # Auth types
│           ├── order.ts        # Order types
│           ├── common.ts       # Common types
│           └── database.types.ts  # Supabase generated
├── supabase/
│   ├── migrations/             # SQL migrations
│   └── seed.sql                # Sample data
├── package.json                # Workspaces config
└── turbo.json                  # Turborepo config
```

## Statistics

| Directory | Files | LOC | Description |
|-----------|-------|-----|-------------|
| apps/api/src | 23 | 993 | NestJS backend |
| apps/web/src | 10 | 305 | Next.js frontend |
| packages/types/src | 5 | 1088 | Shared types |
| supabase | 3 | 605 | Database |
| **Total** | **41** | **~3000** | |

## Key Files

### Backend (apps/api/src)

| File | Purpose |
|------|---------|
| `main.ts` | Bootstrap app, configure Swagger, guards, CORS, pipes |
| `app.module.ts` | Root module, imports AuthModule + OrdersModule |
| `auth/auth.module.ts` | Passport + Supabase strategy registration |
| `auth/supabase.strategy.ts` | JWT validation, extract user from token |
| `auth/guards/jwt-auth.guard.ts` | Protect routes, check @Public decorator |
| `auth/guards/roles.guard.ts` | Check @Roles decorator |
| `auth/decorators/*.ts` | @CurrentUser, @Public, @Roles decorators |
| `orders/orders.controller.ts` | HTTP layer, Swagger docs |
| `orders/orders.service.ts` | Business logic, Supabase queries |
| `orders/dto/order.dto.ts` | Request/response DTOs |
| `common/dto/pagination.dto.ts` | Pagination query params |
| `common/filters/http-exception.filter.ts` | Format error responses |
| `common/interceptors/transform.interceptor.ts` | Wrap responses |

### Frontend (apps/web/src)

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with fonts |
| `app/page.tsx` | Home page |
| `app/auth-test/page.tsx` | Auth testing page |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server-side Supabase client |
| `lib/api/client.ts` | API client for backend calls |
| `providers/auth-provider.tsx` | AuthContext with signIn/signOut |

### Shared Types (packages/types/src)

| File | Purpose |
|------|---------|
| `auth.ts` | UserRole, AuthUser, JwtPayload (Zod schemas) |
| `order.ts` | OrderStatus, CreateOrderDto, OrderResponse |
| `common.ts` | Pagination, ApiResponse types |
| `database.types.ts` | Auto-generated Supabase types |

### Database (supabase)

| File | Purpose |
|------|---------|
| `migrations/20260117000001_initial_schema.sql` | 15 tables, indexes, RLS |
| `migrations/20260117000002_custom_access_token_hook.sql` | JWT customization |
| `seed.sql` | Sample stores, users, products, orders |

## Module Dependencies

```
AppModule
├── ConfigModule (global)
├── AuthModule
│   └── PassportModule (supabase strategy)
└── OrdersModule
    └── (uses Supabase client directly)
```

## Request Pipeline

```
Request → CORS → ValidationPipe → Guards (JWT → Roles)
       → Interceptor (before) → Controller → Service
       → Interceptor (after) → ExceptionFilter → Response
```
