import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

/**
 * Orders Module - Encapsulation Unit
 *
 * NestJS Module Pattern:
 * - Mỗi feature là 1 module độc lập
 * - Module đăng ký controllers và providers
 * - Import vào AppModule để kích hoạt
 *
 * STRUCTURE CHO TEAM FOLLOW:
 *
 * orders/
 * ├── orders.module.ts      ← Đăng ký module
 * ├── orders.controller.ts  ← HTTP endpoints
 * ├── orders.service.ts     ← Business logic
 * └── dto/
 *     └── order.dto.ts      ← Request/Response DTOs
 *
 * CÁCH TẠO MODULE MỚI (cho BE team):
 *
 * 1. Copy folder orders/ → production/
 * 2. Rename files: orders.* → production.*
 * 3. Update class names
 * 4. Update DTOs cho domain mới
 * 5. Import vào AppModule
 */
@Module({
  controllers: [OrdersController], // Đăng ký controller
  providers: [OrdersService], // Đăng ký service
  exports: [OrdersService], // Export nếu module khác cần dùng
})
export class OrdersModule {}
