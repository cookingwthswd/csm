import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

/**
 * NestJS Application Bootstrap
 *
 * FLOW PIPELINE (theo thứ tự xử lý request):
 *
 * 1. Request → CORS check
 * 2. → ValidationPipe (validate DTOs)
 * 3. → Guards (JwtAuthGuard → RolesGuard)
 * 4. → Interceptor IN (TransformInterceptor - before)
 * 5. → Controller + Service
 * 6. → Interceptor OUT (TransformInterceptor - after, wrap response)
 * 7. → Exception Filter (nếu có lỗi)
 * 8. → Response
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger - API documentation (accessible at /api/docs)
  const config = new DocumentBuilder()
    .setTitle('CKMS API')
    .setDescription('Central Kitchen Management System API')
    .setVersion('1.0')
    .addBearerAuth() // Thêm nút "Authorize" trong Swagger UI
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Global Validation Pipe - tự động validate tất cả DTOs
  // whitelist: bỏ qua fields không có trong DTO
  // transform: auto-convert types (string → number, etc.)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global Exception Filter - format lỗi thống nhất
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptor - wrap response format { success: true, data: ... }
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global Guards - Auth + RBAC
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  // CORS - cho phép frontend gọi API
  // Production: set FRONTEND_URL hoặc CORS_ORIGINS (comma-separated)
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [process.env.FRONTEND_URL || 'http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Cho phép gửi cookies/auth headers
  });

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
