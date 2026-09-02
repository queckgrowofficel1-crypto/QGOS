import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const configuredKey = this.config.get<string>('ADMIN_API_KEY');
    const suppliedKey = request.headers['x-admin-key'];
    const suppliedRole = request.headers['x-admin-role'];

    if (!configuredKey || typeof suppliedKey !== 'string' || suppliedRole !== 'ADMIN') {
      throw new UnauthorizedException('Admin credentials are required');
    }

    const expected = Buffer.from(configuredKey);
    const actual = Buffer.from(suppliedKey);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new UnauthorizedException('Invalid admin credentials');
    }
    return true;
  }
}
