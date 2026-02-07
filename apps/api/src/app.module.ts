import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { DeliveriesModule } from './deliveries';

/**
 * AppModule - Root Module
 *
 * TẤT CẢ feature modules phải import vào đây để kích hoạt.
 *
 * CÁCH THÊM MODULE MỚI (cho FS team):
 * 1. Tạo module folder (ví dụ: production/)
 * 2. Import vào đây: import { ProductionModule } from './production/production.module';
 * 3. Thêm vào imports array bên dưới
 *
 * SHARED SERVICES:
 * CommonModule cung cấp SupabaseService, CodeGeneratorService (global)
 * Inject trực tiếp vào bất kỳ service nào mà không cần import lại
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Reads from apps/api/.env (relative to where nest runs)
      // Production: set env vars directly in hosting platform
    }),
    CommonModule, // Shared services (SupabaseService, CodeGeneratorService)
    AuthModule,
    UsersModule, // User management
    CategoriesModule, // Product categories
    StoresModule, // Franchise stores & central kitchen
    ProductsModule, // Products (items table)
    OrdersModule, // Template module cho FS team reference
    DeliveriesModule, // Deliveries module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
