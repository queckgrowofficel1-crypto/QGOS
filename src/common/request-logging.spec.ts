import { requestLoggingMiddleware } from './request-logging';

describe('requestLoggingMiddleware', () => {
  it('registers a finish handler and continues the request', () => {
    const req = { method: 'GET', path: '/health' } as any;
    const listeners: Record<string, () => void> = {};
    const res = {
      locals: { requestId: 'req-123' },
      statusCode: 200,
      on: jest.fn((event: string, callback: () => void) => {
        listeners[event] = callback;
        return res;
      }),
    } as any;
    const next = jest.fn();

    requestLoggingMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(typeof listeners.finish).toBe('function');

    expect(() => listeners.finish()).not.toThrow();
  });
});
