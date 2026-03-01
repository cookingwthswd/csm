/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../auth';
import { UserRoleEnum } from '../users/dto/user.dto';
import { ReportsService } from './reports.service';
import {
  DashboardOverviewDto,
  DeliveryReportDto,
  InventoryReportDto,
  OrdersReportDto,
  ProductionReportDto,
} from './dto/report-response.dto';
import {
  ReportGroupBy,
  ReportQueryDto,
  ReportType,
} from './dto/report-query.dto';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Dashboard overview ------------------------------------------------------

  @Get('overview')
  @ApiOperation({ summary: 'Dashboard overview statistics' })
  @ApiResponse({ status: 200, type: DashboardOverviewDto })
  @Roles(UserRoleEnum.MANAGER, UserRoleEnum.ADMIN)
  async getOverview(
    @Query('storeId') storeId?: string,
  ): Promise<DashboardOverviewDto> {
    const parsedStoreId = storeId ? Number(storeId) : undefined;
    return this.reportsService.getOverview(
      Number.isNaN(parsedStoreId) ? undefined : parsedStoreId,
    );
  }

  // Orders report -----------------------------------------------------------

  @Get('orders')
  @ApiOperation({ summary: 'Orders analytics report' })
  @ApiResponse({ status: 200, type: OrdersReportDto })
  @Roles(UserRoleEnum.MANAGER, UserRoleEnum.ADMIN)
  async getOrdersReport(
    @Query() query: ReportQueryDto,
  ): Promise<OrdersReportDto> {
    return this.reportsService.getOrdersReport({
      ...query,
      type: ReportType.ORDERS,
    });
  }

  // Production report -------------------------------------------------------

  @Get('production')
  @ApiOperation({ summary: 'Production analytics report' })
  @ApiResponse({ status: 200, type: ProductionReportDto })
  @Roles(UserRoleEnum.MANAGER, UserRoleEnum.ADMIN)
  async getProductionReport(
    @Query() query: ReportQueryDto,
  ): Promise<ProductionReportDto> {
    return this.reportsService.getProductionReport({
      ...query,
      type: ReportType.PRODUCTION,
    });
  }

  // Inventory report --------------------------------------------------------

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory analytics report' })
  @ApiResponse({ status: 200, type: InventoryReportDto })
  @Roles(UserRoleEnum.MANAGER, UserRoleEnum.ADMIN)
  async getInventoryReport(
    @Query() query: ReportQueryDto,
  ): Promise<InventoryReportDto> {
    return this.reportsService.getInventoryReport({
      ...query,
      type: ReportType.INVENTORY,
    });
  }

  // Delivery report ---------------------------------------------------------

  @Get('delivery')
  @ApiOperation({ summary: 'Delivery analytics report' })
  @ApiResponse({ status: 200, type: DeliveryReportDto })
  @Roles(UserRoleEnum.MANAGER, UserRoleEnum.ADMIN)
  async getDeliveryReport(
    @Query() query: ReportQueryDto,
  ): Promise<DeliveryReportDto> {
    return this.reportsService.getDeliveryReport({
      ...query,
      type: ReportType.DELIVERY,
    });
  }

  // Export ------------------------------------------------------------------

  @Get('export')
  @ApiOperation({ summary: 'Export report as CSV' })
  @ApiQuery({ name: 'format', enum: ['csv', 'pdf'], required: false })
  @Roles(UserRoleEnum.MANAGER, UserRoleEnum.ADMIN)
  async exportReport(
    @Query() query: ReportQueryDto,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.reportsService.exportReport(
      {
        ...query,
        type: query.type ?? ReportType.ORDERS,
        groupBy: query.groupBy ?? ReportGroupBy.DAY,
      },
      format,
    );

    const filename = `report-${query.type ?? 'orders'}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(buffer);
  }
}

