import { Request, Response } from 'express';
import { requestContextMiddleware } from './request-context';

describe('requestContextMiddleware', () => {
  it('preserves a valid incoming request id', () => {
    const req = { header: jest.fn().mockReturnValue('client-request-123') } as unknown as Request;
    const res = {
      setHeader: jest.fn(),
      locals: {},
    } as unknown as Response;
    const next = jest.fn();

    requestContextMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'client-request-123');
    expect(res.locals.requestId).toBe('client-request-123');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a request id when none is supplied', () => {
    const req = { header: jest.fn().mockReturnValue(undefined) } as unknown as Request;
    const res = {
      setHeader: jest.fn(),
      locals: {},
    } as unknown as Response;
    const next = jest.fn();

    requestContextMiddleware(req, res, next);

    const requestId = res.locals.requestId as string;
    expect(requestId).toEqual(expect.any(String));
    expect(requestId).toHaveLength(36);
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', requestId);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
