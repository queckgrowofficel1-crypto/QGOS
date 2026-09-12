import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { requestContextMiddleware } from '../src/common/request-context';
import { requestLoggingMiddleware } from '../src/common/request-logging';

describe('QGOS API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    process.env.JWT_SECRET = 'ci-only-e2e-secret';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(requestContextMiddleware);
    app.use(requestLoggingMiddleware);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns health status and request correlation id', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('qgos-api');
    expect(response.body.requestId).toBeTruthy();
    expect(response.headers['x-request-id']).toBe(response.body.requestId);
  });
});
