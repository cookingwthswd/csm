import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Transform Response Interceptor - Wrap tất cả response thành format chuẩn
 *
 * VẤN ĐỀ:
 * - Controller return data trực tiếp: return { id: 1, name: 'Order' }
 * - FE muốn format nhất quán: { success: true, data: {...} }
 *
 * GIẢI PHÁP:
 * - Interceptor chặn response trước khi gửi về client
 * - Wrap data trong format chuẩn
 *
 * FLOW:
 * Controller return { id: 1 }
 *        ↓
 * Interceptor transform
 *        ↓
 * Client nhận { success: true, data: { id: 1 } }
 *
 * VÍ DỤ:
 * - Input:  return { id: 1, name: 'Test Order' }
 * - Output: { success: true, data: { id: 1, name: 'Test Order' } }
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );
  }
}

/**
 * CÁCH ĐĂNG KÝ (trong main.ts):
 *
 * import { TransformInterceptor } from './common/interceptors/transform.interceptor';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   app.useGlobalInterceptors(new TransformInterceptor());  // <-- Thêm dòng này
 *   ...
 * }
 *
 * KẾT QUẢ:
 * - Success: { success: true, data: {...} }
 * - Error:   { success: false, statusCode: 404, message: '...' }  (từ HttpExceptionFilter)
 */
