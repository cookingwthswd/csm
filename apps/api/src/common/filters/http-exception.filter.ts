import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * HTTP Exception Filter - Xử lý tất cả HTTP errors thống nhất
 *
 * VẤN ĐỀ:
 * - NestJS trả lỗi format khác nhau tùy loại exception
 * - FE cần format nhất quán để xử lý
 *
 * GIẢI PHÁP:
 * - Catch tất cả HttpException
 * - Return format chuẩn: { success, statusCode, message, timestamp }
 *
 * VÍ DỤ:
 * - Input:  throw new NotFoundException('Order not found')
 * - Output: { success: false, statusCode: 404, message: 'Order not found', timestamp: '...' }
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract message từ exception (có thể là string hoặc object)
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] }).message ||
          'An error occurred';

    // Nếu message là array (validation errors), join lại
    const formattedMessage = Array.isArray(message)
      ? message.join(', ')
      : message;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: formattedMessage,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * CÁCH ĐĂNG KÝ (trong main.ts):
 *
 * import { HttpExceptionFilter } from './common/filters/http-exception.filter';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   app.useGlobalFilters(new HttpExceptionFilter());  // <-- Thêm dòng này
 *   ...
 * }
 */
