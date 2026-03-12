// mail.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import { SendTestEmailDto } from './dto/send-test-email.dto';

@Injectable()
export class MailService {
    private brevoClient: BrevoClient;

    constructor() {
        if (!process.env.BREVO_API_KEY) {
            throw new Error('BREVO_API_KEY environment variable is missing');
        }

        if (!process.env.MAIL_FROM) {
            throw new Error('MAIL_FROM environment variable is missing');
        }

        this.brevoClient = new BrevoClient({
            apiKey: process.env.BREVO_API_KEY,
        });
    }

    async sendMail(mail: SendTestEmailDto) {
        if (!mail.to) {
            throw new Error('Recipient email is required');
        }

        const message = {
            sender: { name: 'Classivo', email: process.env.MAIL_FROM },
            to: [{ email: mail.to, name: mail.name }],
            subject: mail.subject,
            htmlContent: mail.html,
            textContent: mail.text,
        };

        try {
            const result =
                await this.brevoClient.transactionalEmails.sendTransacEmail(
                    message,
                );

            console.log('Email sent successfully:', result);

            return {
                success: true,
                message: 'Email sent successfully',
                data: result,
            };
        } catch (error: any) {
            console.error('Email sending failed:', error.response?.body || error);

            throw new InternalServerErrorException({
                success: false,
                message: 'Failed to send email',
                details: error.response?.body || error,
            });
        }
    }
}
