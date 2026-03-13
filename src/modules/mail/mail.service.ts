import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import { SendTestEmailDto } from './dto/send-test-email.dto';

type MailProviderErrorDetails = {
  provider: 'brevo';
  message: string;
  statusCode?: number;
  responseBody?: unknown;
  cause?: string;
};

@Injectable()
export class MailService {
  private readonly brevoClient: BrevoClient;
  private readonly mailFrom: string;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    const mailFrom = process.env.MAIL_FROM?.trim();

    if (!apiKey) {
      throw new Error('BREVO_API_KEY environment variable is missing');
    }

    if (!mailFrom) {
      throw new Error('MAIL_FROM environment variable is missing');
    }

    this.mailFrom = mailFrom;
    this.brevoClient = new BrevoClient({ apiKey });
  }

  async sendMail(mail: SendTestEmailDto) {
    if (!mail.to) {
      throw new Error('Recipient email is required');
    }

    const message = {
      sender: { name: 'Classivo', email: this.mailFrom },
      to: [{ email: mail.to, name: mail.name }],
      subject: mail.subject,
      htmlContent: mail.html,
      textContent: mail.text,
    };

    try {
      const result =
        await this.brevoClient.transactionalEmails.sendTransacEmail(message);

      return {
        success: true,
        message: 'Email sent successfully',
        data: result,
      };
    } catch (error: unknown) {
      const details = this.buildMailProviderErrorDetails(error);

      console.error('Email sending failed:', details);

      throw new InternalServerErrorException({
        success: false,
        message: details.message,
        details,
      });
    }
  }

  private buildMailProviderErrorDetails(
    error: unknown,
  ): MailProviderErrorDetails {
    const candidate = error as {
      message?: string;
      statusCode?: number;
      body?: unknown;
      response?: { body?: unknown };
      rawResponse?: { status?: number; statusText?: string };
      cause?: { message?: string } | string;
    };

    const statusCode =
      candidate?.statusCode ?? candidate?.rawResponse?.status ?? undefined;
    const responseBody = candidate?.response?.body ?? candidate?.body;
    const cause =
      typeof candidate?.cause === 'string'
        ? candidate.cause
        : candidate?.cause?.message;

    if (!statusCode && candidate?.message?.includes('fetch failed')) {
      return {
        provider: 'brevo',
        message:
          'Failed to reach Brevo API. Check internet access, DNS/firewall rules, and whether outbound HTTPS requests are allowed.',
        statusCode,
        responseBody,
        cause,
      };
    }

    return {
      provider: 'brevo',
      message: candidate?.message || 'Failed to send email through Brevo',
      statusCode,
      responseBody,
      cause,
    };
  }
}
