# CKMS - Project Overview & PDR

## Product Vision

CKMS (Central Kitchen Management System) is a comprehensive supply chain management solution for F&B chains with central kitchen operations. It streamlines ordering, inventory, production planning, and delivery between franchise stores and central kitchens.

## Target Users

| Role | Responsibilities |
|------|------------------|
| **Admin** | System configuration, user management, full access |
| **Manager** | Oversee operations, approve orders, view reports |
| **Supply Coordinator** | Manage inventory, coordinate shipments |
| **Kitchen Staff** | Execute production plans, manage batches |
| **Store Staff** | Create orders, receive shipments, manage store inventory |

## Core Features

### 1. Order Management
- Stores create orders for products from central kitchen
- Order workflow: draft → submitted → confirmed → in_production → ready → in_delivery → delivered
- Role-based permissions for order operations

### 2. Inventory Management
- Track stock levels per store/kitchen
- Batch tracking with expiry dates
- Automatic alerts for low stock and expiring items
- Transaction logging for all stock movements

### 3. Production Planning
- Schedule production based on orders
- Track production progress
- Link produced items to batches for traceability

### 4. Shipment & Delivery
- Create shipments from confirmed orders
- Track delivery status
- Link shipped items to specific batches

### 5. Recipe/BOM Management
- Define product recipes (bill of materials)
- Track material requirements for production

## Technical Requirements

### Authentication & Authorization
- Supabase Auth with JWT tokens
- Role-based access control (RBAC) with 5 roles
- Chain-level data isolation (multi-tenancy ready)

### Performance
- Paginated API responses
- Database indexes on common query patterns
- Row Level Security for data protection

### API
- RESTful endpoints with Swagger documentation
- Consistent response format via interceptors
- Global exception handling

## Constraints

- Single-chain deployment (multi-chain architecture prepared but not active)
- Local Supabase for development, cloud Supabase for production
- Bun as package manager (not npm/yarn)

## Success Metrics

- Order processing time reduction
- Inventory accuracy improvement
- Production waste reduction
- Delivery on-time rate

## Current Status

**Phase:** Initial Development
- Auth system: Implemented
- Orders module: Template implemented
- Database schema: Complete (15 tables)
- Frontend: Basic auth integration

## Next Milestones

1. Complete inventory management module
2. Implement production planning
3. Add shipment tracking
4. Build dashboard with analytics
