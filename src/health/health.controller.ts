import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API health' })
  @ApiResponse({ status: 200, description: 'QGOS API is healthy.' })
  check() {
    return {
      status: 'ok',
      service: 'qgos-api',
      timestamp: new Date().toISOString(),
    };
  }
}
