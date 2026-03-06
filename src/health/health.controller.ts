import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

type HealthResponse = {
  status: 'ok';
  service: 'classivo-backend';
  timestamp: string;
  uptimeSeconds: number;
};

@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Public service health probe endpoint' })
  @ApiOkResponse({
    description: 'Service health status',
    schema: {
      example: {
        status: 'ok',
        service: 'classivo-backend',
        timestamp: '2026-03-06T10:00:00.000Z',
        uptimeSeconds: 123,
      },
    },
  })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'classivo-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
