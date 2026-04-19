import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const { method } = req;
    const path = req.originalUrl ?? req.url;
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = http.getResponse<Response>();
          const ms = Date.now() - started;
          this.logger.log(`${method} ${path} ${res.statusCode} ${ms}ms`);
        },
        error: (err: unknown) => {
          const ms = Date.now() - started;
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`${method} ${path} failed ${ms}ms: ${msg}`);
        },
      }),
    );
  }
}
