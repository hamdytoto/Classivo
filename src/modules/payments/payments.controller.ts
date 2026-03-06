import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Payments module status endpoint' })
  getStatus(): string {
    return this.paymentsService.getStatus();
  }
}
