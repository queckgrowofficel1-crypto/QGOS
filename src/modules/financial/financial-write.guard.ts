import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from '../admin/admin.guard';

/**
 * Temporary fail-closed boundary until the existing Job System supplies
 * a verified identity/authorization contract. Do not enable in production
 * without operator and legal/compliance sign-off.
 */
@Injectable()
export class FinancialWriteGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly adminGuard: AdminGuard,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.get<string>('FINANCIAL_WRITES_ENABLED') !== 'true') {
      throw new ForbiddenException('Financial writes are disabled pending integration and compliance approval');
    }
    return this.adminGuard.canActivate(context);
  }
}
