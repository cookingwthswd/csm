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

### Shared Services
- `SupabaseService` - Singleton DB client
- `CodeGeneratorService` - Generate unique codes
- Pagination DTO, HTTP exception filter, Transform interceptor

## In Progress 🔄

### Backend - Users Module

```
apps/api/src/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
└── dto/
    ├── create-user.dto.ts
    ├── update-user.dto.ts
    └── user-response.dto.ts
```

#### Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /users | List users (paginated) | admin, manager |
| GET | /users/me | Current user profile | all |
| GET | /users/:id | User detail | admin, manager |
| POST | /users | Create user | admin |
| PUT | /users/:id | Update user | admin, self |
| DELETE | /users/:id | Deactivate user | admin |
| PUT | /users/:id/role | Change user role | admin |

### Frontend - Auth & User Management

```
apps/web/src/features/auth/
├── pages/
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
├── components/
│   ├── login-form.tsx
│   ├── auth-guard.tsx
│   └── role-guard.tsx
└── hooks/
    └── use-auth.ts

apps/web/src/features/users/
├── pages/
│   ├── user-list.tsx
│   ├── user-detail.tsx
│   └── profile.tsx
├── components/
│   ├── user-table.tsx
│   ├── user-form.tsx
│   └── role-badge.tsx
└── hooks/
    └── use-users.ts
```

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

### Shared Code for Team

| Item | Description | For |
|------|-------------|-----|
| `EntityFactory` | Abstract factory for entity creation | FS1, FS2, FS4 |
| `StatusFactory` | Abstract factory for status transitions | FS1, FS2, FS4 |
| `auth.store.ts` | Zustand auth state | All FE |
| `query-client.ts` | React Query singleton | All FE |

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
| 2 🔄 | Users CRUD | Login, Profile |
| 3 | - | User management, Store settings |
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
