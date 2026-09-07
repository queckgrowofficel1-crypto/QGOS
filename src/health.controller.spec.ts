import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a healthy service response', () => {
    const controller = new HealthController();
    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('qgos-api');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });
});
