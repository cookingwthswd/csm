# FS3: Inventory & Alerts

**Owner:** FS3 | **Priority:** P2 | **Status:** Completed
**Dependencies:** FS6 (Stores, Products)

## Scope

| Area     | Tasks                                                     |
| -------- | --------------------------------------------------------- |
| Backend  | Stock levels, transactions, alerts                        |
| Frontend | Stock dashboard, transaction history, alert notifications |

## Backend Tasks

_Implementation complete: controllers, services, DTOs and API paths created as described in the spec._

### Files to Create

```
apps/api/src/inventory/
├── inventory.module.ts
├── inventory.controller.ts
├── inventory.service.ts
├── alerts.controller.ts
├── alerts.service.ts
└── dto/inventory.dto.ts
```

### Inventory Endpoints

| Method | Endpoint                    | Description             | Roles                       |
| ------ | --------------------------- | ----------------------- | --------------------------- |
| GET    | /inventory                  | List stock levels       | all                         |
| GET    | /inventory/:storeId/:itemId | Get specific stock      | all                         |
| POST   | /inventory                  | Initialize stock record | coordinator, admin          |
| PUT    | /inventory/:id              | Update min/max levels   | coordinator, admin          |
| GET    | /inventory/low-stock        | Low stock items         | coordinator, manager, admin |

### Transaction Endpoints

| Method | Endpoint                    | Description        | Roles                        |
| ------ | --------------------------- | ------------------ | ---------------------------- |
| GET    | /inventory/transactions     | List transactions  | coordinator, admin           |
| POST   | /inventory/transactions     | Create movement    | coordinator, ck_staff, admin |
| GET    | /inventory/transactions/:id | Transaction detail | coordinator, admin           |

### Alert Endpoints

| Method | Endpoint                      | Description            | Roles              |
| ------ | ----------------------------- | ---------------------- | ------------------ |
| GET    | /inventory/alerts             | List unresolved alerts | all                |
| GET    | /inventory/alerts/count       | Count unresolved       | all                |
| PUT    | /inventory/alerts/:id/resolve | Resolve alert          | coordinator, admin |

### Service Logic

```typescript
@Injectable()
export class InventoryService {
  constructor(
    private supabase: SupabaseService, // Singleton
    private alertsService: AlertsService,
  ) {}

  // Create transaction + update stock + check alerts
  async createTransaction(dto: CreateTransactionDto, ctx: EntityContext) {
    // 1. Insert transaction record
    const { data: tx } = await this.supabase
      .getClient()
      .from("inventory_transactions")
      .insert({
        store_id: dto.storeId,
        item_id: dto.itemId,
        batch_id: dto.batchId,
        quantity_change: dto.quantityChange,
        transaction_type: dto.type,
        reference_type: dto.referenceType,
        reference_id: dto.referenceId,
        note: dto.note,
        created_by: ctx.userId,
      })
      .select()
      .single();

    // 2. Update inventory quantity
    await this.updateStock(dto.storeId, dto.itemId, dto.quantityChange);

    // 3. Check and create alerts if needed
    await this.alertsService.checkAndCreate(dto.storeId, dto.itemId);

    return tx;
  }

  private async updateStock(storeId: number, itemId: number, change: number) {
    // Upsert: insert if not exists, update if exists
    await this.supabase.getClient().rpc("update_inventory_stock", {
      p_store_id: storeId,
      p_item_id: itemId,
      p_quantity_change: change,
    });
  }
}

@Injectable()
export class AlertsService {
  async checkAndCreate(storeId: number, itemId: number) {
    const { data: inv } = await this.supabase
      .getClient()
      .from("inventory")
      .select("quantity, min_stock_level")
      .eq("store_id", storeId)
      .eq("item_id", itemId)
      .single();

    if (!inv) return;

    if (inv.quantity <= 0) {
      await this.createAlert(storeId, itemId, "out_of_stock");
    } else if (inv.quantity < inv.min_stock_level) {
      await this.createAlert(storeId, itemId, "low_stock");
    }
  }

  async checkExpiringBatches() {
    // Cron job: check batches expiring in 7 days
    const { data } = await this.supabase
      .getClient()
      .from("batches")
      .select("*")
      .eq("status", "active")
      .lte(
        "expiry_date",
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      );

    for (const batch of data || []) {
      await this.createAlert(null, batch.item_id, "expiring_soon", batch.id);
    }
  }
}
```

### DTOs (packages/types/src/inventory.ts)

```typescript
export const TransactionType = z.enum([
  "import",
  "export",
  "production",
  "waste",
  "return",
  "adjustment",
]);

export const AlertType = z.enum([
  "low_stock",
  "out_of_stock",
  "expiring_soon",
  "expired_found",
]);

export const CreateTransactionDto = z.object({
  storeId: z.number(),
  itemId: z.number(),
  batchId: z.number().optional(),
  quantityChange: z.number(), // + or -
  type: TransactionType,
  referenceType: z.string().optional(),
  referenceId: z.number().optional(),
  note: z.string().optional(),
});

export const InventoryResponse = z.object({
  id: z.number(),
  storeId: z.number(),
  storeName: z.string(),
  itemId: z.number(),
  itemName: z.string(),
  itemSku: z.string(),
  quantity: z.number(),
  unit: z.string(),
  minStockLevel: z.number(),
  maxStockLevel: z.number(),
  isLowStock: z.boolean(),
  lastUpdated: z.string(),
});
```

---

## Frontend Tasks

_Pages and components for dashboard, transactions, and alerts have been added. Inventory API client created and navigation updated._

### Pages to Create

```
apps/web/src/app/(dashboard)/inventory/
├── page.tsx                    # Stock dashboard
├── transactions/page.tsx       # Transaction history
├── alerts/page.tsx             # Alerts list
└── components/
    ├── stock-table.tsx
    ├── stock-card.tsx
    ├── transaction-table.tsx
    ├── transaction-form.tsx
    ├── alert-list.tsx
    └── low-stock-widget.tsx
```

### Key Features

| Feature             | Description                                       |
| ------------------- | ------------------------------------------------- |
| Stock Dashboard     | Cards/table showing stock levels với color coding |
| Low Stock Widget    | Badge count on navbar + widget on dashboard       |
| Transaction Form    | Form để import/export/adjust stock                |
| Alert Notifications | Toast notifications cho new alerts                |

### React Query + Realtime

```typescript
// Realtime subscription cho alerts
export function useAlertsRealtime() {
  const queryClient = useQueryClient();
  const supabase = getSupabase();

  useEffect(() => {
    const channel = supabase
      .channel("alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          toast.warning(`New alert: ${payload.new.message}`);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
```

---

## Integration Points

| With             | Trigger             | Action                            |
| ---------------- | ------------------- | --------------------------------- |
| FS2 (Production) | Production complete | Import transaction (add stock)    |
| FS4 (Delivery)   | Shipment created    | Export transaction (deduct stock) |
| FS4 (Delivery)   | Shipment delivered  | Import transaction at store       |

---

## Success Criteria

- [ ] Stock CRUD with min/max levels
- [ ] Transaction creates audit log
- [ ] Alerts auto-created on low stock
- [ ] Realtime alert notifications
- [ ] Stock dashboard with filtering by store
