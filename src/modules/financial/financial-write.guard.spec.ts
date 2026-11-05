import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from '../admin/admin.guard';
import { FinancialWriteGuard } from './financial-write.guard';

describe('FinancialWriteGuard', () => {
  const context = (headers: Record<string, string>): ExecutionContext => ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext);

  const makeGuard = (enabled: string | undefined) => {
    const config = {
      get: jest.fn((name: string) => name === 'FINANCIAL_WRITES_ENABLED' ? enabled : 'test-admin-secret'),
    } as unknown as ConfigService;
    return new FinancialWriteGuard(config, new AdminGuard(config));
  };

  it('rejects financial writes by default even with admin credentials', () => {
    const guard = makeGuard(undefined);
    expect(() => guard.canActivate(context({ 'x-admin-key': 'test-admin-secret', 'x-admin-role': 'ADMIN' }))).toThrow(ForbiddenException);
  });

  it('rejects non-admin requests even when explicitly enabled', () => {
    const guard = makeGuard('true');
    expect(() => guard.canActivate(context({ 'x-admin-key': 'wrong', 'x-admin-role': 'ADMIN' }))).toThrow(UnauthorizedException);
  });

  it('permits explicitly enabled requests with valid admin credentials', () => {
    const guard = makeGuard('true');
    expect(guard.canActivate(context({ 'x-admin-key': 'test-admin-secret', 'x-admin-role': 'ADMIN' }))).toBe(true);
  });

  it('does not accept other truthy-like flag values', () => {
    const guard = makeGuard('1');
    expect(() => guard.canActivate(context({ 'x-admin-key': 'test-admin-secret', 'x-admin-role': 'ADMIN' }))).toThrow(ForbiddenException);
  });
});
