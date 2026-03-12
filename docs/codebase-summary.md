# CKMS - Codebase Summary

Last refreshed: 2026-03-10

This document reflects the live repository state in `D:\Project\garankhi\csm`. It replaces earlier summaries that only covered the initial scaffold.

## Stack

| Layer | Current implementation |
|------|------|
| Monorepo | Turborepo + Bun workspaces |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind 4 |
| Client state | Zustand + React Query |
| Backend | NestJS 11, Swagger, Passport-style guards |
| Database | Supabase Postgres |
| Auth | Supabase Auth with custom JWT claims |
| Shared contracts | `packages/types` with Zod schemas + generated DB types |

## Monorepo Layout

```text
csm/
├── apps/
│   ├── api/                  # NestJS API
│   └── web/                  # Next.js dashboard app
├── packages/
│   ├── types/                # Shared domain types and DB types
│   └── typescript-config/    # Shared TS configs
├── supabase/
│   ├── migrations/           # Checked-in SQL migrations
│   ├── seed.sql              # Seed data
│   └── config.toml           # Local Supabase config
├── docs/                     # Architecture, schema, task docs
├── package.json              # Root scripts/workspaces
└── turbo.json                # Task pipeline
```

## Runtime Flow

```text
Next.js UI
  -> Supabase browser auth
  -> Zustand auth store
  -> React Query + fetch wrappers
  -> NestJS API (Bearer token)
  -> Supabase service-role client / admin client
  -> Postgres tables and Realtime
```

## Backend Index

### Bootstrap and cross-cutting

| Path | Purpose |
|------|------|
| `apps/api/src/main.ts` | App bootstrap, Swagger, CORS, global validation, filters, interceptors, guards |
| `apps/api/src/app.module.ts` | Root module wiring all feature modules |
| `apps/api/src/common/common.module.ts` | Global shared services |
| `apps/api/src/common/services/supabase.service.ts` | Shared Supabase client and admin client |
| `apps/api/src/common/services/code-generator.service.ts` | Reusable code generation helper |
| `apps/api/src/common/filters/http-exception.filter.ts` | Standardized error responses |
| `apps/api/src/common/interceptors/transform.interceptor.ts` | Wraps successful responses |

### Auth layer

| Area | Notes |
|------|------|
| `apps/api/src/auth/auth.module.ts` | Registers auth strategy and guards |
| `apps/api/src/auth/supabase.strategy.ts` | Reads JWT and extracts app metadata |
| `apps/api/src/auth/guards/*.ts` | JWT guard, roles guard, store access guard |
| `apps/api/src/auth/decorators/*.ts` | `@CurrentUser`, `@Roles`, `@Public` |

There is no dedicated auth controller in the API. Login and session management are handled directly by Supabase on the frontend.

### Feature modules

| Module | Main files | Responsibility |
|------|------|------|
| Users | `users.controller.ts`, `users.service.ts` | User profile CRUD, role changes, soft deactivation, `/users/me` |
| Categories | `categories.controller.ts`, `categories.service.ts` | Product category CRUD |
| Stores | `stores.controller.ts`, `stores.service.ts` | Franchise store and central kitchen CRUD |
| Products | `products.controller.ts`, `products.service.ts` | Item catalog CRUD with filters and pagination |
| Orders | `orders.controller.ts`, `orders.service.ts` | Order CRUD, status updates, order item expansion, remaining quantities |
| Shipments | `shipments.controller.ts`, `shipments.service.ts` | Shipment creation, shipment items, status transitions, traceability |
| Reports | `reports.controller.ts`, `reports.service.ts` | Dashboard overview, analytics reports, CSV export |
| Production | `production.controller.ts`, `production.service.ts` | Production plans, detail completion, batch creation, materials calculations |
| Recipes | `recipes.controller.ts`, `recipes.service.ts` | Recipe read/write for finished and semi-finished products |
| Notifications | `notifications.controller.ts`, `notifications.service.ts` | User notifications, unread counts, settings, provider dispatch |

### API surface by route group

| Route prefix | Purpose |
|------|------|
| `/users` | User admin and current profile |
| `/categories` | Category CRUD |
| `/stores` | Store CRUD |
| `/products` | Item catalog CRUD |
| `/orders` | Order listing, detail, creation, updates, status changes |
| `/shipments` | Shipment lifecycle and traceability |
| `/reports` | Overview, orders, production, inventory, delivery, export |
| `/production` | Plans, batches, detail completion |
| `/recipes` | Recipe list, detail, replace, delete detail line |
| `/notifications` | Notification inbox and settings |

## Frontend Index

### App shell

| Path | Purpose |
|------|------|
| `apps/web/src/app/layout.tsx` | Root layout, fonts, providers |
| `apps/web/src/providers/auth-provider.tsx` | Syncs Supabase session into Zustand and loads user profile from API |
| `apps/web/src/providers/query-provider.tsx` | React Query provider |
| `apps/web/src/lib/stores/auth.store.ts` | Persistent auth/session store |
| `apps/web/src/lib/api/client.ts` | Fetch wrapper that injects bearer token |
| `apps/web/src/lib/supabase/client.ts` | Browser Supabase singleton |
| `apps/web/src/lib/supabase/server.ts` | Server-side Supabase helper |

### Route map

#### Public/auth routes

| Route | Notes |
|------|------|
| `/` | Redirects to `/dashboard` |
| `/login` | Email/password sign-in |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset completion |
| `/auth-test` | Auth/debug page |

#### Dashboard routes

| Route | Notes |
|------|------|
| `/dashboard` | Basic landing dashboard |
| `/dashboard/profile` | Current user profile |
| `/dashboard/orders` | Orders UI |
| `/dashboard/products` | Product management |
| `/dashboard/categories` | Category management |
| `/dashboard/stores` | Store management |
| `/dashboard/users` | User management |
| `/dashboard/shipments` | Shipment list |
| `/dashboard/shipments/[id]` | Shipment detail |
| `/dashboard/production` | Production plan list |
| `/dashboard/production/new` | Create plan |
| `/dashboard/production/[id]` | Plan detail |
| `/dashboard/production/batches` | Batch list |
| `/dashboard/recipes` | Recipe list |
| `/dashboard/recipes/new` | New recipe flow |
| `/dashboard/recipes/[productId]` | Recipe editor/detail |
| `/dashboard/notifications` | Notifications center |
| `/dashboard/notifications/settings` | Notification settings |

#### Report routes

| Route | Backing feature page |
|------|------|
| `/dashboard/reports/dashboard` | `features/reports/pages/dashboard.tsx` |
| `/dashboard/reports/orders` | `features/reports/pages/orders-report.tsx` |
| `/dashboard/reports/production` | `features/reports/pages/production-report.tsx` |
| `/dashboard/reports/inventory` | `features/reports/pages/inventory-report.tsx` |
| `/dashboard/reports/delivery` | `features/reports/pages/delivery-report.tsx` |

### Frontend feature areas

| Area | Main paths | Notes |
|------|------|------|
| API clients | `apps/web/src/lib/api/*.ts` | Thin wrappers per backend domain |
| Reports | `apps/web/src/features/reports` | Dashboard cards, charts, filters, export |
| Notifications | `apps/web/src/features/notifications` | Bell, dropdown, center, settings, Realtime subscription |
| Hooks | `apps/web/src/hooks` | Domain-level React Query hooks |
| Guards | `apps/web/src/components/auth` | Role gating and auth gating helpers |

## Shared Types Index

`packages/types/src/index.ts` re-exports the core shared contracts:

| File | Domain |
|------|------|
| `auth.ts` | Auth roles and JWT-related types |
| `order.ts` | Order DTOs, status enums |
| `category.ts` | Category types |
| `store.ts` | Store types |
| `product.ts` | Product/item types |
| `shipment.ts` and `shipment-item.ts` | Shipment contracts |
| `production.ts` | Production plan and batch contracts |
| `recipe.ts` | Recipe contracts |
| `report.ts` | Report query/response types |
| `notification.ts` | Notification and settings types |
| `database.types.ts` | Generated Supabase schema types |

## Data Model Index

### Core checked-in tables from migrations

| Area | Tables |
|------|------|
| Org and users | `stores`, `users` |
| Catalog | `categories`, `items`, `recipe_details` |
| Inventory | `batches`, `inventory`, `inventory_transactions`, `alerts` |
| Fulfillment | `orders`, `order_items`, `shipments`, `shipment_items` |
| Production | `production_plans`, `production_details` |

### Auth customization

| File | Purpose |
|------|------|
| `supabase/migrations/20260117000002_custom_access_token_hook.sql` | Injects `role` and `store_id` into JWT app metadata |

### Important migration notes

| File | What changed |
|------|------|
| `20260117000001_initial_schema.sql` | Initial schema, RLS, indexes, triggers |
| `20260125000001_refactor_unit_price.sql` | Added `processed` order status and moved pricing logic temporarily |
| `20260126000001_refactor_order_items_and_items.sql` | Introduced `items.current_price`, restored `order_items.unit_price` |

## Source of Truth and Drift

This repo contains some documentation and schema drift. Use the following priorities when changing code:

1. Runtime code in `apps/api` and `apps/web`
2. Shared contracts in `packages/types`
3. Generated DB types in `packages/types/src/database.types.ts`
4. Checked-in migrations in `supabase/migrations`
5. Older docs and planning docs

### Verified mismatches

| Topic | Mismatch | Practical assumption |
|------|------|------|
| Framework versions | README still says Next 15 / NestJS 10; package files are Next 16.1.2 / NestJS 11 | Trust `package.json` files |
| Scope model | Some docs mention `chain_id`; live code uses `store_id` and single-chain assumptions | Trust live code and current schema |
| Roles | Docs mention `supply_coordinator` and `kitchen_staff`; most live code uses `coordinator` and `ck_staff` | Trust `users` DTOs and auth store first |
| Production roles | `production.controller.ts` still references `supply_coordinator` for batches | Treat this as drift to resolve before role cleanup work |
| Notifications schema | Notification tables exist in generated DB types and feature docs, but not in checked-in migrations | Check the live database before making notification schema changes |
| Order statuses | Shared types and DTOs include `processed`; parts of the schema and service logic still use the older set | Confirm the live DB constraint before changing order workflows |
| Docs coverage | Older codebase summary only covered auth + orders | Trust `app.module.ts`, controller list, and route tree |

## Read First

If you are onboarding or preparing a change, these are the best starting points:

1. `package.json`
2. `turbo.json`
3. `apps/api/src/main.ts`
4. `apps/api/src/app.module.ts`
5. `apps/web/src/app/layout.tsx`
6. `apps/web/src/app/dashboard/layout.tsx`
7. `apps/web/src/lib/api/client.ts`
8. `apps/web/src/providers/auth-provider.tsx`
9. `packages/types/src/index.ts`
10. `supabase/migrations/20260117000001_initial_schema.sql`
