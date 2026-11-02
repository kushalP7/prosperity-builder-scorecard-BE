import { Injectable, NestInterceptor, ExecutionContext, CallHandler, StreamableFile } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

function isBinaryPayload(data: unknown): boolean {
  if (data == null) return false;
  if (Buffer.isBuffer(data)) return true;
  if (data instanceof StreamableFile) return true;
  if (data instanceof Uint8Array) return true;
  return false;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T> | T> {
    return next.handle().pipe(
      map((data) => {
        // PDF / file downloads must not be JSON-wrapped
        if (isBinaryPayload(data)) {
          return data;
        }

        // If data is already wrapped with success key, return directly
        if (data && typeof data === 'object' && 'success' in data) {
          return {
            timestamp: new Date().toISOString(),
            ...data,
          };
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
