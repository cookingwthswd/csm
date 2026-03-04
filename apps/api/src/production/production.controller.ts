import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { CreatePlanDto, UpdatePlanDto, UpdatePlanStatusDto, UpdateProductionDetailDto } from './dto/production.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth';
import type { AuthUser } from '../auth';

@ApiTags('production')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production')
export class ProductionController {
  constructor(private service: ProductionService) {}

  @Get('plans')
  @Roles('admin', 'manager', 'ck_staff')
  @ApiOperation({ summary: 'List production plans' })
  async getPlans(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.service.findAllPlans(page, limit);
  }

  @Get('plans/:id')
  @Roles('admin', 'manager', 'ck_staff')
  @ApiOperation({ summary: 'Get plan details API' })
  async getPlan(@Param('id', ParseIntPipe) id: number) {
    return this.service.findPlanById(id);
  }

  @Post('plans')
  @Roles('admin', 'manager', 'ck_staff')
  @ApiOperation({ summary: 'Create new production plan' })
  async createPlan(@Body() dto: CreatePlanDto, @CurrentUser() user: AuthUser) {
    return this.service.createPlan(dto, user);
  }

  @Put('plans/:id')
  @Roles('admin', 'manager', 'ck_staff')
  @ApiOperation({ summary: 'Update plan basic info' })
  async updatePlan(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePlanDto, @CurrentUser() user: AuthUser) {
    return this.service.updatePlan(id, dto, user);
  }

  @Put('plans/:id/status')
  @Roles('admin', 'manager', 'ck_staff')
  @ApiOperation({ summary: 'Update plan status' })
  async updatePlanStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePlanStatusDto, @CurrentUser() user: AuthUser) {
    return this.service.updatePlanStatus(id, dto, user);
  }

  @Get('plans/:id/materials')
  @Roles('admin', 'manager', 'ck_staff')
  @ApiOperation({ summary: 'Calculate required materials vs inventory' })
  async getMaterialsRequired(@Param('id', ParseIntPipe) id: number) {
    return this.service.calculateMaterialsRequired(id);
  }

  @Put('plans/:planId/details/:detailId')
  @Roles('ck_staff', 'admin')
  @ApiOperation({ summary: 'Update produced quantity for detail item' })
  async updateDetailQuantity(
    @Param('planId', ParseIntPipe) planId: number,
    @Param('detailId', ParseIntPipe) detailId: number,
    @Body() dto: UpdateProductionDetailDto,
  ) {
    return this.service.updateDetailQuantity(planId, detailId, dto);
  }

  @Post('plans/:planId/details/:detailId/complete')
  @Roles('ck_staff', 'admin')
  @ApiOperation({ summary: 'Mark detail as completed and create connected batch' })
  async completeDetail(
    @Param('planId', ParseIntPipe) planId: number,
    @Param('detailId', ParseIntPipe) detailId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.finishDetailAndCreateBatch(planId, detailId, user);
  }

  // Batches
  @Get('batches')
  @Roles('admin', 'manager', 'ck_staff', 'supply_coordinator')
  @ApiOperation({ summary: 'List batches' })
  async getBatches(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.service.findAllBatches(page, limit);
  }
}
