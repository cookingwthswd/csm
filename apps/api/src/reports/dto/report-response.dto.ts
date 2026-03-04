import { ApiProperty } from '@nestjs/swagger';

// Shared interfaces ---------------------------------------------------------

export class TimeSeriesPointDto {
  @ApiProperty()
  date!: string; // ISO date string (grouped by day/week/month)

  @ApiProperty()
  value!: number;
}

export class StatusBreakdownDto {
  @ApiProperty()
  status!: string;

  @ApiProperty()
  count!: number;
}

// Dashboard overview --------------------------------------------------------

export class DashboardOverviewDto {
  @ApiProperty()
  totalOrders!: number;

  @ApiProperty()
  pendingOrders!: number;

  @ApiProperty()
  completedOrders!: number;

  @ApiProperty()
  totalRevenue!: number;

  @ApiProperty()
  lowStockItems!: number;

  @ApiProperty()
  pendingDeliveries!: number;
}

// Orders report -------------------------------------------------------------

export class OrdersReportPointDto {
  @ApiProperty()
  date!: string;

  @ApiProperty()
  totalOrders!: number;

  @ApiProperty()
  completedOrders!: number;

  @ApiProperty()
  pendingOrders!: number;

  @ApiProperty()
  revenue!: number;
}

export class OrdersReportDto {
  @ApiProperty({ type: [OrdersReportPointDto] })
  points!: OrdersReportPointDto[];
}

// Production report ---------------------------------------------------------

export class ProductionReportPointDto {
  @ApiProperty()
  date!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  quantityPlanned!: number;

  @ApiProperty()
  quantityProduced!: number;
}

export class ProductionReportDto {
  @ApiProperty({ type: [ProductionReportPointDto] })
  points!: ProductionReportPointDto[];
}

// Inventory report ----------------------------------------------------------

export class InventoryReportRowDto {
  @ApiProperty()
  itemId!: number;

  @ApiProperty()
  itemName!: string;

  @ApiProperty()
  storeId!: number;

  @ApiProperty()
  storeName!: string | null;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  minStockLevel!: number | null;

  @ApiProperty()
  isLowStock!: boolean;
}

export class InventoryReportDto {
  @ApiProperty({ type: [InventoryReportRowDto] })
  rows!: InventoryReportRowDto[];
}

// Delivery report -----------------------------------------------------------

export class DeliveryReportPointDto {
  @ApiProperty()
  date!: string;

  @ApiProperty()
  totalShipments!: number;

  @ApiProperty()
  deliveredShipments!: number;

  @ApiProperty()
  failedShipments!: number;

  @ApiProperty()
  averageDeliveryTimeMinutes!: number | null;
}

export class DeliveryReportDto {
  @ApiProperty({ type: [DeliveryReportPointDto] })
  points!: DeliveryReportPointDto[];
}
