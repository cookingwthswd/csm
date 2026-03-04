import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { ProductionPlanFactory } from './production-plan.factory';
import { BatchFactory } from './batch.factory';
import { ProductionStatusFactory } from './production-status.factory';

@Module({
  controllers: [ProductionController],
  providers: [
    ProductionService,
    ProductionPlanFactory,
    BatchFactory,
    ProductionStatusFactory,
  ],
  exports: [ProductionPlanFactory, BatchFactory, ProductionService], // export so orders module can access if needed
})
export class ProductionModule {}
