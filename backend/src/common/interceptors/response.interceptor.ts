import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface WrappedResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: any;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, WrappedResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<WrappedResponse<T>> {
    return next.handle().pipe(
      map((data: any) => {
        // If controller already returned wrapped shape, pass through
        if (data && typeof data === 'object' && 'success' in data) return data;
        // If paginated { data, meta }
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return { success: true, data: data.data, meta: data.meta, message: data.message } as any;
        }
        return { success: true, data, message: undefined };
      }),
    );
  }
}
