import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, ip, headers } = request;

    return next.handle().pipe(
      tap(async (data) => {
        if (method !== 'GET' && user) {
          await this.prisma.auditLog.create({
            data: {
              userId: user.id,
              action: `${method} ${url}`,
              entity: this.extractEntity(url),
              entityId: data?.id || 'N/A',
              ipAddress: ip,
              userAgent: headers['user-agent'],
            },
          });
        }
      }),
    );
  }

  private extractEntity(url: string): string {
    const parts = url.split('/');
    return parts[1] || 'unknown';
  }
}
