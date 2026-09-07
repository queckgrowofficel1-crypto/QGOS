import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('health')
export class HealthController {
  @Get()
  check(@Res({ passthrough: true }) response: Response) {
    const requestId = response.locals.requestId as string | undefined;
    return {
      status: 'ok',
      service: 'qgos-api',
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
    };
  }
}
