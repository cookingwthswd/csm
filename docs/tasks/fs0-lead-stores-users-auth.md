# FS0: Lead - Stores, Products, Users & Auth

**Owner:** Lead (Minh) | **Priority:** P1 | **Status:** In Progress
**Dependencies:** None (Base layer)

## Scope

| Area | Tasks |
|------|-------|
| Backend | Stores, Products, Categories, Users, Auth guards, Shared services |
| Frontend | Store settings, Product catalog, Login, User management |
| Infrastructure | Shared code, patterns, code review |

## Completed ✅

### Backend - Stores & Products
- `apps/api/src/stores/` - Stores module
- `apps/api/src/products/` - Products module
- `apps/api/src/categories/` - Categories module

### Backend - Auth
- JWT verification with Supabase JWKS
- Auth guard implementation
- Role-based access control

### Backend - Users Module ✅ NEW
- `apps/api/src/users/` - Full CRUD with role-based access
- Endpoints: GET /users, GET /users/me, GET /users/:id, POST /users, PUT /users/:id, PUT /users/:id/role, DELETE /users/:id
- Create user via Supabase Admin API + public.users sync

### Shared Services
- `SupabaseService` - Singleton DB client (with adminClient for user creation)
- `CodeGeneratorService` - Generate unique codes
- `EntityFactory`, `StatusFactory` - Abstract factories
- Pagination DTO, HTTP exception filter, Transform interceptor

### Frontend - Shared ✅ NEW
- `apps/web/src/lib/stores/auth.store.ts` - Zustand auth state singleton
- `apps/web/src/lib/query-client.ts` - React Query singleton

### Frontend - Auth & User Management ✅ (2026-02-02)
- `apps/web/src/components/auth/auth-guard.tsx` - Auth guard component
- `apps/web/src/components/auth/role-guard.tsx` - Role-based access guard
- `apps/web/src/app/(auth)/forgot-password/page.tsx` - Forgot password page
- `apps/web/src/app/(auth)/reset-password/page.tsx` - Reset password with strength indicator
- `apps/web/src/app/(dashboard)/dashboard/profile/page.tsx` - User profile page
- Dashboard layout updates: Users nav link, profile link, sidebar positioning fix, active nav states
- Fixed pre-existing TypeScript errors in orders/products modules

## In Progress 🔄

### Frontend - Store & Product Management

```
apps/web/src/features/stores/
├── pages/
│   ├── store-settings.tsx
│   └── store-list.tsx
└── components/
    └── store-form.tsx

apps/web/src/features/products/
├── pages/
│   ├── product-list.tsx
│   ├── product-detail.tsx
│   └── product-create.tsx
├── components/
│   ├── product-table.tsx
│   ├── product-form.tsx
│   └── category-select.tsx
└── hooks/
    └── use-products.ts
```

## Pending 📋

### Code Review & Support

- Review PRs from FS1-FS6
- Help with integration issues
- Ensure consistent patterns

## Database Tables (Owned)

```sql
-- stores (done)
-- products (done)
-- categories (done)
-- users (Supabase auth.users + profiles)

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  chain_id INTEGER REFERENCES chains(id),
  store_id INTEGER REFERENCES stores(id),
  role VARCHAR(50) NOT NULL DEFAULT 'store_staff',
  full_name VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles: admin, manager, store_staff, production_staff, delivery_staff
```

## Timeline

| Week | Backend | Frontend |
|------|---------|----------|
| 1 ✅ | Stores, Products, Categories, Auth | - |
| 2 ✅ | Users CRUD | Login, Profile, Auth Guards |
| 3 🔄 | - | User management, Store settings |
| 4 | Review, Support | Product catalog, Polish |

## Integration Points

| Module | Depends On | Provides To |
|--------|------------|-------------|
| Orders (FS1) | Products, Users | - |
| Production (FS2) | Products | - |
| Inventory (FS3) | Products, Stores | - |
| Delivery (FS4) | Users, Stores | - |
| Reports (FS5) | All data | - |
| Notifications (FS6) | Users | - |

## Notes

- All team members can reference this module's code as examples
- Auth guard pattern should be reused across all protected endpoints
- Zustand auth store is the single source of truth for user state
