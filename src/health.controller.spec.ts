import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a healthy service response with a request id', () => {
    const controller = new HealthController();
    const result = controller.check({ locals: { requestId: 'req-123' } } as any);

    expect(result.status).toBe('ok');
    expect(result.service).toBe('qgos-api');
    expect(result.requestId).toBe('req-123');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });
});
