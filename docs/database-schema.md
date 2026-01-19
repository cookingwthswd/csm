# CKMS Database Schema Documentation

> **Version:** 1.0 | **Last Updated:** 2026-01-19 | **Tables:** 15

## Overview

CKMS uses PostgreSQL via Supabase with Row Level Security (RLS). Schema supports central kitchen operations: ordering, inventory, production, and shipments.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CKMS Database                            │
├─────────────┬─────────────┬──────────────┬─────────────────────┤
│   Core      │  Inventory  │  Operations  │    Production       │
├─────────────┼─────────────┼──────────────┼─────────────────────┤
│ stores      │ batches     │ orders       │ production_plans    │
│ users       │ inventory   │ order_items  │ production_details  │
│ categories  │ inv_trans   │ shipments    │ recipe_details      │
│ items       │ alerts      │ ship_items   │                     │
└─────────────┴─────────────┴──────────────┴─────────────────────┘
```

---

## 1. Core Tables

### 1.1 `stores`
Locations (franchise stores + central kitchen).

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Store ID |
| name | VARCHAR(255) | Store name |
| address | TEXT | Physical address |
| type | VARCHAR(20) | `franchise` \| `central_kitchen` |
| phone | VARCHAR(20) | Contact number |
| is_active | BOOLEAN | Active status |
| settings | JSONB | Custom settings |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Last update |

**Usage:**
- Base entity for inventory, orders, alerts
- `type='central_kitchen'` = production facility
- `type='franchise'` = ordering store

---

### 1.2 `users`
System users linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Links to `auth.users` |
| email | VARCHAR(255) | User email |
| full_name | VARCHAR(255) | Display name |
| phone | VARCHAR(20) | Contact number |
| role | VARCHAR(20) | User role (see below) |
| store_id | INTEGER FK | Assigned store |
| is_active | BOOLEAN | Active status |

**Roles:**
| Role | Access Level |
|------|-------------|
| `admin` | Full system access |
| `manager` | Approve orders, view reports |
| `ck_staff` | Central kitchen operations |
| `store_staff` | Store-level operations |
| `coordinator` | Inventory & shipment coordination |

**Usage:**
- Auth: JWT claims include `role` from this table
- FK refs: `created_by`, `confirmed_by`, `resolved_by`

---

### 1.3 `categories`
Product categorization.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Category ID |
| name | VARCHAR(255) | Category name |
| description | TEXT | Optional description |

**Examples:** Raw Materials, Semi-Finished, Finished Products, Packaging

---

### 1.4 `items`
Products and materials tracked in system.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Item ID |
| name | VARCHAR(255) | Item name |
| sku | VARCHAR(100) | Unique SKU code |
| category_id | INTEGER FK | Category reference |
| unit | VARCHAR(20) | Measurement unit |
| type | VARCHAR(20) | Item type |
| description | TEXT | Item description |
| image_url | VARCHAR(500) | Product image |
| is_active | BOOLEAN | Active status |

**Units:** `kg`, `g`, `l`, `ml`, `pcs`, `box`, `can`, `pack`

**Types:**
| Type | Description | Example |
|------|-------------|---------|
| `material` | Raw ingredients | Flour, Sugar |
| `semi_finished` | Intermediate products | Dough, Sauce base |
| `finished_product` | Final products for stores | Bread, Cake |

---

## 2. Recipe/BOM

### 2.1 `recipe_details`
Bill of Materials - defines what materials make a product.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Recipe line ID |
| product_id | INTEGER FK | Finished/semi-finished item |
| material_id | INTEGER FK | Required material |
| quantity | DECIMAL(10,4) | Amount needed per unit |

**Constraint:** `UNIQUE(product_id, material_id)`

**Usage:**
```
Product: Bánh Mì (id=10)
├── Bột mì: 0.5 kg
├── Muối: 0.01 kg
└── Men nở: 0.02 kg
```

**Functional Mapping:**
- Calculate material requirements for production
- Check inventory sufficiency before production
- Cost calculation

---

## 3. Inventory Tables

### 3.1 `batches`
Batch tracking for traceability.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Batch ID |
| batch_code | VARCHAR(100) | Unique batch code |
| item_id | INTEGER FK | Item this batch belongs to |
| manufacture_date | DATE | Production date |
| expiry_date | DATE | Expiration date |
| initial_quantity | DECIMAL(10,2) | Original quantity |
| current_quantity | DECIMAL(10,2) | Remaining quantity |
| status | VARCHAR(20) | Batch status |

**Status:**
| Status | Meaning |
|--------|---------|
| `active` | Available for use |
| `expired` | Past expiry date |
| `depleted` | Fully consumed |

**Usage:**
- FIFO inventory management
- Expiry tracking & alerts
- Traceability (shipment → batch → production)

---

### 3.2 `inventory`
Current stock levels per store/item.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Inventory record ID |
| store_id | INTEGER FK | Store location |
| item_id | INTEGER FK | Item being tracked |
| quantity | DECIMAL(10,2) | Current stock level |
| min_stock_level | DECIMAL(10,2) | Alert threshold |
| max_stock_level | DECIMAL(10,2) | Maximum capacity |
| last_updated | TIMESTAMPTZ | Last change time |

**Constraint:** `UNIQUE(store_id, item_id)`

**Usage:**
- Real-time stock visibility
- Low stock alerts (when `quantity < min_stock_level`)
- Reorder point calculation

---

### 3.3 `inventory_transactions`
Audit log for all inventory movements.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Transaction ID |
| store_id | INTEGER FK | Store affected |
| item_id | INTEGER FK | Item affected |
| batch_id | INTEGER FK | Batch (optional) |
| quantity_change | DECIMAL(10,2) | +/- quantity |
| transaction_type | VARCHAR(20) | Type of movement |
| reference_type | VARCHAR(50) | Related entity type |
| reference_id | INTEGER | Related entity ID |
| note | TEXT | Optional notes |
| created_by | UUID FK | User who made change |

**Transaction Types:**
| Type | Description | quantity_change |
|------|-------------|-----------------|
| `import` | Receive stock | + |
| `export` | Send/use stock | - |
| `production` | Produce items | + (output), - (materials) |
| `waste` | Write-off | - |
| `return` | Return goods | + |
| `adjustment` | Manual correction | +/- |

**Reference Linking:**
```
reference_type = 'order', reference_id = 123
→ Links to orders.id = 123
```

---

### 3.4 `alerts`
System notifications for inventory issues.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Alert ID |
| store_id | INTEGER FK | Affected store |
| item_id | INTEGER FK | Affected item |
| batch_id | INTEGER FK | Affected batch (expiry alerts) |
| alert_type | VARCHAR(30) | Alert category |
| message | TEXT | Human-readable message |
| is_resolved | BOOLEAN | Resolved status |
| resolved_by | UUID FK | Who resolved |
| resolved_at | TIMESTAMPTZ | Resolution time |

**Alert Types:**
| Type | Trigger |
|------|---------|
| `low_stock` | `inventory.quantity < min_stock_level` |
| `out_of_stock` | `inventory.quantity = 0` |
| `expiring_soon` | `batch.expiry_date` within X days |
| `expired_found` | `batch.expiry_date < NOW()` |

---

## 4. Order & Fulfillment Tables

### 4.1 `orders`
Store orders to central kitchen.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Order ID |
| order_code | VARCHAR(50) | Unique order code |
| store_id | INTEGER FK | Ordering store |
| created_by | UUID FK | Order creator |
| confirmed_by | UUID FK | Order approver |
| status | VARCHAR(20) | Order status |
| total_amount | DECIMAL(15,2) | Order total |
| delivery_date | DATE | Requested delivery |
| notes | TEXT | Order notes |

**Status Flow:**
```
pending → approved → processing → shipping → delivered
                  ↘ cancelled
```

| Status | Meaning | Actions |
|--------|---------|---------|
| `pending` | Awaiting approval | Edit, Cancel |
| `approved` | Confirmed by manager | Start processing |
| `processing` | In production | Track progress |
| `shipping` | Out for delivery | Track shipment |
| `delivered` | Complete | Close |
| `cancelled` | Cancelled | N/A |

---

### 4.2 `order_items`
Line items within an order.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Line item ID |
| order_id | INTEGER FK | Parent order |
| item_id | INTEGER FK | Ordered item |
| quantity_ordered | DECIMAL(10,2) | Ordered quantity |
| unit_price | DECIMAL(10,2) | Price per unit |
| notes | TEXT | Item-specific notes |

**Cascade:** Deletes when parent order deleted.

---

### 4.3 `shipments`
Delivery tracking for orders.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Shipment ID |
| shipment_code | VARCHAR(50) | Unique shipment code |
| order_id | INTEGER FK | Parent order |
| status | VARCHAR(20) | Shipment status |
| driver_name | VARCHAR(255) | Driver info |
| driver_phone | VARCHAR(20) | Driver contact |
| shipped_date | TIMESTAMPTZ | Dispatch time |
| delivered_date | TIMESTAMPTZ | Arrival time |
| notes | TEXT | Delivery notes |

**Status:** `preparing` → `shipping` → `delivered` | `failed`

---

### 4.4 `shipment_items`
Items included in a shipment with batch traceability.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Line ID |
| shipment_id | INTEGER FK | Parent shipment |
| order_item_id | INTEGER FK | Linked order line |
| batch_id | INTEGER FK | Source batch |
| quantity_shipped | DECIMAL(10,2) | Actual shipped qty |
| note | TEXT | Item notes |

**Traceability:** `shipment_item → batch → item`

---

## 5. Production Tables

### 5.1 `production_plans`
Production scheduling.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Plan ID |
| plan_code | VARCHAR(50) | Unique plan code |
| start_date | DATE | Plan start |
| end_date | DATE | Plan end |
| status | VARCHAR(20) | Plan status |
| notes | TEXT | Plan notes |
| created_by | UUID FK | Creator |

**Status:** `planned` → `in_progress` → `completed` | `cancelled`

---

### 5.2 `production_details`
Individual production tasks within a plan.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Detail ID |
| plan_id | INTEGER FK | Parent plan |
| item_id | INTEGER FK | Item to produce |
| quantity_planned | DECIMAL(10,2) | Target quantity |
| quantity_produced | DECIMAL(10,2) | Actual produced |
| batch_id | INTEGER FK | Output batch |
| status | VARCHAR(20) | Task status |
| started_at | TIMESTAMPTZ | Start time |
| completed_at | TIMESTAMPTZ | End time |

**Status:** `pending` → `in_progress` → `completed` | `cancelled`

---

## 6. Relationships Diagram

```
                              ┌──────────────┐
                              │   stores     │
                              └──────┬───────┘
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              ┌──────────┐    ┌───────────┐    ┌──────────┐
              │  users   │    │ inventory │    │  orders  │
              └────┬─────┘    └─────┬─────┘    └────┬─────┘
                   │                │               │
                   │          ┌─────┴─────┐         │
                   │          ▼           ▼         ▼
                   │    ┌─────────┐ ┌─────────┐ ┌───────────┐
                   │    │ batches │ │  items  │ │order_items│
                   │    └────┬────┘ └────┬────┘ └─────┬─────┘
                   │         │           │           │
                   │         │     ┌─────┴─────┐     │
                   │         │     ▼           ▼     │
                   │         │ ┌──────────┐ ┌──────────────┐
                   │         │ │categories│ │recipe_details│
                   │         │ └──────────┘ └──────────────┘
                   │         │
                   │    ┌────┴────────┐
                   │    ▼             ▼
              ┌────┴────────┐  ┌─────────────┐
              │   alerts    │  │  shipments  │
              └─────────────┘  └──────┬──────┘
                                      │
                               ┌──────┴──────┐
                               ▼             ▼
                        ┌──────────────┐ ┌───────────────┐
                        │shipment_items│ │production_plan│
                        └──────────────┘ └───────┬───────┘
                                                 │
                                         ┌───────┴───────┐
                                         ▼
                                 ┌──────────────────┐
                                 │production_details│
                                 └──────────────────┘
```

---

## 7. Functional Requirement Mapping

### FR-1: Order Management

| Requirement | Tables Used |
|-------------|-------------|
| Create order from store | `orders`, `order_items`, `stores`, `users` |
| Order approval workflow | `orders.status`, `orders.confirmed_by` |
| Track order history | `orders.created_at`, `orders.updated_at` |

**Query Pattern:**
```sql
-- Store's pending orders
SELECT * FROM orders
WHERE store_id = ? AND status = 'pending'
ORDER BY created_at DESC;
```

---

### FR-2: Inventory Management

| Requirement | Tables Used |
|-------------|-------------|
| Track stock levels | `inventory` |
| Stock movement log | `inventory_transactions` |
| Batch tracking | `batches` |
| Low stock alerts | `alerts` + `inventory.min_stock_level` |

**Query Pattern:**
```sql
-- Check low stock items
SELECT i.*, inv.quantity, inv.min_stock_level
FROM items i
JOIN inventory inv ON i.id = inv.item_id
WHERE inv.quantity < inv.min_stock_level;
```

---

### FR-3: Production Planning

| Requirement | Tables Used |
|-------------|-------------|
| Create production plan | `production_plans` |
| Plan line items | `production_details` |
| Track production output | `production_details.quantity_produced` |
| Material requirements | `recipe_details` + `production_details` |

**Query Pattern:**
```sql
-- Calculate materials needed for production
SELECT rd.material_id, SUM(rd.quantity * pd.quantity_planned) as total_needed
FROM production_details pd
JOIN recipe_details rd ON pd.item_id = rd.product_id
WHERE pd.plan_id = ?
GROUP BY rd.material_id;
```

---

### FR-4: Shipment & Delivery

| Requirement | Tables Used |
|-------------|-------------|
| Create shipment | `shipments` |
| Shipment items with batch | `shipment_items`, `batches` |
| Delivery tracking | `shipments.status`, `shipped_date`, `delivered_date` |

**Query Pattern:**
```sql
-- Shipment traceability
SELECT si.*, b.batch_code, b.expiry_date
FROM shipment_items si
JOIN batches b ON si.batch_id = b.id
WHERE si.shipment_id = ?;
```

---

### FR-5: Recipe/BOM

| Requirement | Tables Used |
|-------------|-------------|
| Define product recipes | `recipe_details`, `items` |
| Calculate costs | `recipe_details.quantity` × material cost |

---

## 8. Business Problem Solutions

### Problem: Hết hàng không biết trước

**Solution:** Alert system với `min_stock_level`

```sql
-- Trigger alert creation (application logic)
IF inventory.quantity < inventory.min_stock_level THEN
  INSERT INTO alerts (store_id, item_id, alert_type, message)
  VALUES (?, ?, 'low_stock', 'Sắp hết hàng: ' || item.name);
END IF;
```

**Tables:** `inventory`, `alerts`, `items`

---

### Problem: Truy xuất nguồn gốc lô hàng

**Solution:** Batch tracking end-to-end

```
Order → shipment_items.batch_id → batches → production_details
```

**Tables:** `batches`, `shipment_items`, `production_details`

---

### Problem: Theo dõi hàng sắp hết hạn

**Solution:** Expiry alert + batch status

```sql
-- Find expiring batches
SELECT * FROM batches
WHERE status = 'active'
  AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '7 days';
```

**Tables:** `batches`, `alerts`

---

### Problem: Tính nguyên liệu cần cho sản xuất

**Solution:** Recipe × Production quantity

```sql
SELECT
  rd.material_id,
  i.name,
  SUM(rd.quantity * pd.quantity_planned) as total_required
FROM production_details pd
JOIN recipe_details rd ON pd.item_id = rd.product_id
JOIN items i ON rd.material_id = i.id
WHERE pd.plan_id = ?
GROUP BY rd.material_id, i.name;
```

**Tables:** `recipe_details`, `production_details`, `items`

---

### Problem: Audit trail cho inventory

**Solution:** Transaction logging

```sql
-- All movements for an item
SELECT * FROM inventory_transactions
WHERE item_id = ?
ORDER BY created_at DESC;
```

**Tables:** `inventory_transactions`

---

## 9. Indexes Summary

### Foreign Key Indexes
| Index | Table | Column(s) |
|-------|-------|-----------|
| idx_users_store | users | store_id |
| idx_items_category | items | category_id |
| idx_batches_item | batches | item_id |
| idx_orders_store | orders | store_id |
| idx_order_items_order | order_items | order_id |
| idx_shipments_order | shipments | order_id |

### Query Optimization Indexes
| Index | Purpose |
|-------|---------|
| idx_orders_status | Filter by status |
| idx_orders_created | Sort by date |
| idx_batches_expiry_active | Expiry checks |
| idx_alerts_unresolved | Pending alerts |
| idx_items_active | Active items only |

---

## 10. RLS Policies

All tables have RLS enabled. Base policies:

| Policy | Scope | Rule |
|--------|-------|------|
| auth_read | SELECT | Authenticated users can read |
| auth_insert | INSERT | Authenticated users can create |
| auth_update | UPDATE | Authenticated users can update |
| users_read_own | SELECT | Users read own profile |
| admin_read_users | SELECT | Admin reads all users |

**Note:** Service role bypasses RLS for backend operations.
