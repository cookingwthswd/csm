# CKMS Class Diagram và Use Case Diagram

Tài liệu này tổng hợp sơ đồ lớp và sơ đồ use case của hệ thống CKMS dựa trên schema Supabase, shared types và các API controller hiện có trong repo.

## 1. Class Diagram

```mermaid
classDiagram
direction TB

class Store {
  +int id
  +string name
  +string type
  +string address
  +string phone
  +bool isActive
}

class User {
  +uuid id
  +string email
  +string fullName
  +string phone
  +string role
  +bool isActive
}

class Category {
  +int id
  +string name
  +string description
}

class Item {
  +int id
  +string name
  +string sku
  +string unit
  +string type
  +bool isActive
}

class RecipeDetail {
  +int id
  +decimal quantity
}

class Inventory {
  +int id
  +decimal quantity
  +decimal minStockLevel
  +decimal maxStockLevel
}

class Batch {
  +int id
  +string batchCode
  +date manufactureDate
  +date expiryDate
  +decimal currentQuantity
  +string status
}

class Order {
  +int id
  +string orderCode
  +string status
  +decimal totalAmount
  +date deliveryDate
}

class OrderItem {
  +int id
  +decimal quantityOrdered
  +decimal unitPrice
  +string notes
}

class Shipment {
  +int id
  +string shipmentCode
  +string status
  +string driverName
  +string driverPhone
}

class ShipmentItem {
  +int id
  +decimal quantityShipped
  +string note
}

class ProductionPlan {
  +int id
  +string planCode
  +string status
  +date startDate
  +date endDate
}

class ProductionDetail {
  +int id
  +decimal quantityPlanned
  +decimal quantityProduced
  +string status
}

class Notification {
  +int id
  +string type
  +string title
  +string message
  +bool isRead
}

Store "1" o-- "0..*" User : employs
Category "1" o-- "0..*" Item : classifies

Item "1" --> "0..*" RecipeDetail : product
Item "1" --> "0..*" RecipeDetail : material

Store "1" o-- "0..*" Inventory : keeps
Item "1" o-- "0..*" Inventory : stocked_as
Item "1" o-- "0..*" Batch : tracked_by

Store "1" o-- "0..*" Order : places
User "1" --> "0..*" Order : created_by
User "0..1" --> "0..*" Order : confirmed_by
Order "1" *-- "1..*" OrderItem : contains
Item "1" --> "0..*" OrderItem : ordered_item

Order "1" o-- "0..*" Shipment : fulfilled_by
Shipment "1" *-- "1..*" ShipmentItem : contains
OrderItem "1" --> "0..*" ShipmentItem : fulfills
Batch "0..1" --> "0..*" ShipmentItem : sourced_from

User "1" --> "0..*" ProductionPlan : creates
ProductionPlan "1" *-- "1..*" ProductionDetail : contains
Item "1" --> "0..*" ProductionDetail : target_item
Batch "0..1" --> "0..*" ProductionDetail : output_batch

User "1" o-- "0..*" Notification : receives
```

## 2. Use Case Diagram

```mermaid
flowchart LR
  Guest[Khach chua dang nhap]
  AuthUser[Nguoi dung da xac thuc]
  Admin[Admin]
  Manager[Manager]
  CKStaff[CK Staff]
  StoreStaff[Store Staff]
  Coordinator[Coordinator]

  Admin -.-> AuthUser
  Manager -.-> AuthUser
  CKStaff -.-> AuthUser
  StoreStaff -.-> AuthUser
  Coordinator -.-> AuthUser

  subgraph CKMS["CKMS"]
    UCLogin(("Dang nhap"))
    UCProfile(("Xem / cap nhat ho so"))
    UCNotify(("Xem thong bao<br/>danh dau da doc<br/>cap nhat cai dat"))
    UCMasterData(("Tra cuu cua hang<br/>danh muc<br/>san pham"))

    UCUserLookup(("Tra cuu nguoi dung"))
    UCUserAdmin(("Quan tri nguoi dung"))

    UCStoreAdmin(("Quan ly cua hang"))
    UCCatalogAdmin(("Quan ly danh muc<br/>va san pham"))
    UCRecipe(("Quan ly cong thuc"))

    UCOrder(("Tao / xem / cap nhat don hang"))
    UCOrderStatus(("Duyet / cap nhat trang thai don"))

    UCShipmentLookup(("Tra cuu shipment"))
    UCShipmentManage(("Tao / cap nhat shipment"))
    UCShipmentItem(("Gan batch vao shipment item"))
    UCTrace(("Truy vet batch - shipment"))

    UCProductionPlan(("Lap / cap nhat ke hoach san xuat"))
    UCProductionExec(("Cap nhat san luong<br/>hoan tat chi tiet san xuat"))
    UCCreateBatch(("Tao batch thanh pham"))
    UCBatchView(("Xem batch"))

    UCReports(("Xem dashboard / bao cao"))
    UCExport(("Xuat bao cao CSV"))
  end

  Guest --> UCLogin

  AuthUser --> UCProfile
  AuthUser --> UCNotify
  AuthUser --> UCMasterData
  AuthUser --> UCShipmentLookup

  Admin --> UCUserLookup
  Manager --> UCUserLookup
  Admin --> UCUserAdmin

  Admin --> UCStoreAdmin
  Manager --> UCStoreAdmin

  Admin --> UCCatalogAdmin
  Manager --> UCCatalogAdmin

  Admin --> UCRecipe
  Manager --> UCRecipe
  CKStaff --> UCRecipe

  Admin --> UCOrder
  Manager --> UCOrder
  CKStaff --> UCOrder
  StoreStaff --> UCOrder
  Coordinator --> UCOrder

  Admin --> UCOrderStatus
  Manager --> UCOrderStatus
  Coordinator --> UCOrderStatus

  Admin --> UCShipmentManage
  Manager --> UCShipmentManage
  Coordinator --> UCShipmentManage

  Admin --> UCBatchView
  Manager --> UCBatchView
  CKStaff --> UCBatchView
  Coordinator --> UCBatchView

  Admin --> UCProductionPlan
  Manager --> UCProductionPlan
  CKStaff --> UCProductionPlan

  Admin --> UCProductionExec
  CKStaff --> UCProductionExec

  Admin --> UCReports
  Manager --> UCReports

  UCShipmentManage -. include .-> UCShipmentItem
  UCShipmentManage -. include .-> UCTrace
  UCProductionExec -. include .-> UCCreateBatch
  UCReports -. include .-> UCExport
```

## 3. Nguon doi chieu

- Database schema: `supabase/migrations/20260117000001_initial_schema.sql`
- Shared types: `packages/types/src/*.ts`
- API controllers: `apps/api/src/*/*.controller.ts`
- Frontend routes: `apps/web/src/app/dashboard/layout.tsx`, `apps/web/src/app/login/page.tsx`

## 4. Ghi chu

- Diagram duoc ve o muc nghiep vu he thong, khong di sau vao cac class framework nhu controller, service, guard.
- Trong code hien tai co mot cho dung ten role cu `supply_coordinator` trong module production, trong khi schema va enum dang dung `coordinator`.
- Mermaid "use case" duoc bieu dien bang `flowchart` de de render tren GitHub va cac markdown viewer pho bien.
