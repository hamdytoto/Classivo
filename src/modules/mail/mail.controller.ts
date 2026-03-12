// src/mail/mail.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { Public } from '../../common/decorators';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Public()
  @Post('test')
  @ApiOperation({ summary: 'Send a test email from Swagger UI' })
  @ApiBody({ type: SendTestEmailDto })
  @ApiOkResponse({
    description: 'Email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Email sent successfully',
        data: {
          messageId: '<202603130001.1234567890@smtp-relay.mailin.fr>',
        },
      },
    },
  })
  async sendTestEmail(@Body() body: SendTestEmailDto) {
    return this.mailService.sendMail(body);
  }
}
