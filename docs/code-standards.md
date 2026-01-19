# CKMS - Code Standards

## Naming Conventions

### Files & Directories
- **kebab-case** for all files: `order.dto.ts`, `jwt-auth.guard.ts`
- **Feature folders** group related files: `orders/`, `auth/`
- **Barrel exports** via `index.ts` in each module

### TypeScript
- **PascalCase** for types, interfaces, classes: `AuthUser`, `OrdersService`
- **camelCase** for variables, functions: `chainId`, `findAll()`
- **UPPER_SNAKE_CASE** for constants: `USER_ROLES`
- **Prefix interfaces** with purpose: `CreateOrderDto`, `OrderResponse`

### Database
- **snake_case** for tables and columns: `order_items`, `chain_id`
- **Singular table names**: `order` not `orders` (exception: current schema uses plural)
- **Foreign keys**: `{table}_id` pattern: `store_id`, `order_id`

## File Organization

### NestJS Module Pattern
```
module-name/
├── module-name.module.ts      # Module definition
├── module-name.controller.ts  # HTTP layer
├── module-name.service.ts     # Business logic
├── dto/
│   └── module-name.dto.ts     # Request/Response DTOs
└── index.ts                   # Barrel export
```

### Decorator Pattern
```
decorators/
├── current-user.decorator.ts  # One decorator per file
├── public.decorator.ts
├── roles.decorator.ts
└── index.ts                   # Re-export all
```

## TypeScript Patterns

### Zod Schema + Type Inference
```typescript
// Define schema
export const UserRole = z.enum(['admin', 'manager', 'store_staff']);

// Infer type from schema
export type UserRole = z.infer<typeof UserRole>;
```

### DTO Validation (NestJS)
```typescript
export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  storeId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
```

### Supabase Client Usage
```typescript
// Service role key bypasses RLS
this.supabase = createClient(
  config.get('SUPABASE_URL'),
  config.get('SUPABASE_SERVICE_ROLE_KEY'),
);

// Always filter by chainId for data isolation
const { data } = await this.supabase
  .from('orders')
  .select('*')
  .eq('chain_id', chainId);
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "data": [...],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": [...]
  }
}
```

## Authentication Pattern

### Protecting Routes
```typescript
// All routes protected by default (global guard)
// Use @Public() to make route public
@Public()
@Get('health')
health() { return 'OK'; }

// Use @Roles() for specific role requirements
@Roles('admin', 'manager')
@Get('reports')
getReports() { ... }
```

### Accessing Current User
```typescript
@Get('profile')
getProfile(@CurrentUser() user: AuthUser) {
  return this.service.getProfile(user.id, user.chainId);
}
```

## Database Patterns

### Row Level Security
- All tables have RLS enabled
- Service role key bypasses RLS (backend use)
- Anon key respects RLS (frontend use)

### Data Isolation
- Filter by `chain_id` in all queries
- Extract `chainId` from JWT payload
- Never trust client-provided chainId

## Error Handling

### Service Layer
```typescript
private handleError(error: PostgrestError, context: string): never {
  console.error(`[Service] ${context}:`, error);
  throw new InternalServerErrorException(`Database error: ${context}`);
}
```

### Controller Layer
- Let NestJS global filters handle errors
- Use specific exceptions: `NotFoundException`, `BadRequestException`

## Comments

- **Vietnamese OK** for internal team documentation
- **English** for public-facing code/API docs
- **JSDoc** for complex functions
- Avoid obvious comments
