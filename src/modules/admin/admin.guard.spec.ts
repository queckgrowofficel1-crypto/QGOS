import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const context = (headers: Record<string, string>): ExecutionContext => ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext);

  it('allows a valid admin key and ADMIN role', () => {
    const config = { get: jest.fn().mockReturnValue('secret-key') } as unknown as ConfigService;
    const guard = new AdminGuard(config);
    expect(guard.canActivate(context({ 'x-admin-key': 'secret-key', 'x-admin-role': 'ADMIN' }))).toBe(true);
  });

  it('rejects invalid admin credentials', () => {
    const config = { get: jest.fn().mockReturnValue('secret-key') } as unknown as ConfigService;
    const guard = new AdminGuard(config);
    expect(() => guard.canActivate(context({ 'x-admin-key': 'wrong', 'x-admin-role': 'ADMIN' }))).toThrow(UnauthorizedException);
  });

  it('rejects non-admin roles', () => {
    const config = { get: jest.fn().mockReturnValue('secret-key') } as unknown as ConfigService;
    const guard = new AdminGuard(config);
    expect(() => guard.canActivate(context({ 'x-admin-key': 'secret-key', 'x-admin-role': 'MODERATOR' }))).toThrow(UnauthorizedException);
  });
});
