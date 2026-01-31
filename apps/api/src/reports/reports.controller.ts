import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportQueryDto, REPORT_TYPES } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Dashboard overview stats' })
  @ApiResponse({ status: 200, description: 'Overview stats' })
  @Roles('admin', 'manager')
  getOverview() {
    return this.reportsService.getOverview();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Orders analytics' })
  @ApiResponse({ status: 200, description: 'Orders report' })
  @Roles('admin', 'manager')
  getOrdersReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getOrdersReport(query);
  }

  @Get('production')
  @ApiOperation({ summary: 'Production analytics' })
  @ApiResponse({ status: 200, description: 'Production report' })
  @Roles('admin', 'manager')
  getProductionReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getProductionReport(query);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory analytics' })
  @ApiResponse({ status: 200, description: 'Inventory report' })
  @Roles('admin', 'manager')
  getInventoryReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getInventoryReport(query);
  }

  @Get('delivery')
  @ApiOperation({ summary: 'Delivery analytics' })
  @ApiResponse({ status: 200, description: 'Delivery report' })
  @Roles('admin', 'manager')
  getDeliveryReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getDeliveryReport(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export report (CSV/PDF)' })
  @ApiQuery({ name: 'type', enum: REPORT_TYPES })
  @ApiQuery({ name: 'format', enum: ['csv', 'pdf'] })
  @ApiResponse({ status: 200, description: 'File download' })
  @Roles('admin', 'manager')
  async exportReport(
    @Query() query: ReportQueryDto & { type?: string; format?: 'csv' | 'pdf' },
    @Res({ passthrough: false }) res: express.Response,
  ) {
    const format = (query.format ?? 'csv') as 'csv' | 'pdf';
    const buffer = await this.reportsService.exportReport(query, format);
    const type = query.type ?? 'orders';
    const ext = format === 'pdf' ? 'pdf' : 'csv';
    const filename = `report-${type}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    res.set({
      'Content-Type': format === 'pdf' ? 'application/pdf' : 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
