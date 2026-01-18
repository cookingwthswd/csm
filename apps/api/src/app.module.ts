import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';

/**
 * AppModule - Root Module
 *
 * TẤT CẢ feature modules phải import vào đây để kích hoạt.
 *
 * CÁCH THÊM MODULE MỚI (cho BE team):
 * 1. Tạo module folder (ví dụ: production/)
 * 2. Import vào đây: import { ProductionModule } from './production/production.module';
 * 3. Thêm vào imports array bên dưới
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Reads from apps/api/.env (relative to where nest runs)
      // Production: set env vars directly in hosting platform
    }),
    AuthModule,
    OrdersModule, // Template module cho BE team reference
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
