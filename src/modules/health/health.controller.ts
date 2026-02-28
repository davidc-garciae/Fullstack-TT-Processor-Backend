import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiOkResponse({
    description: 'Service health status',
    example: { ok: true, service: 'backend', timestamp: '2026-02-27T01:00:00.000Z' },
  })
  check() {
    return {
      ok: true,
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }
}
