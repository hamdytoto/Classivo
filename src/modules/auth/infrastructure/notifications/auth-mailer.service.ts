import { Injectable } from '@nestjs/common';
import { MailService } from '../../../mail/mail.service';

@Injectable()
export class AuthMailerService {
  constructor(private readonly mailService: MailService) {}

  async sendPasswordResetMail(params: {
    to: string;
    name?: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    await this.mailService.sendMail({
      to: params.to,
      name: params.name,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  }
}
