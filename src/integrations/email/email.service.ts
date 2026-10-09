import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: any[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly defaultFrom: string;

  constructor(private readonly configService: ConfigService) {
    this.defaultFrom =
      this.configService.get<string>('MAIL_FROM') ||
      `"Rose Associates Southeast" <${this.configService.get<string>('SMTP_USER', 'info@roseassociates.com')}>`;

    this.initTransporter();
  }

  /**
   * Initializes the Nodemailer SMTP transporter.
   */
  private initTransporter(): void {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port: Number(port),
          secure,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.logger.log(`[MAIL][INITIALIZED] - Connected to ${host}:${port} (${user})`);
      } catch (err: any) {
        this.logger.error(`[MAIL][CONFIG_ERROR] - Failed to initialize SMTP: ${err.message}`);
        this.transporter = null;
      }
    } else {
      this.logger.warn(
        `[MAIL][DEV_MODE] - SMTP credentials not fully configured in .env. Emails will be logged to console.`,
      );
    }
  }

  /**
   * Sends an email via Nodemailer or logs it in local development mode.
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string }> {
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const from = options.from || this.defaultFrom;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          replyTo: options.replyTo,
          subject: options.subject,
          html: options.html,
          text: options.text,
          attachments: options.attachments,
        });

        this.logger.log(`[MAIL][SENT] - To: ${to} - Subject: "${options.subject}" - ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (error: any) {
        this.logger.error(`[MAIL][FAILED] - To: ${to} - Error: ${error.message}`, error.stack);
        throw error;
      }
    } else {
      // Dev mode fallback logging when SMTP is not configured
      this.logger.log(`[MAIL][DEV_MOCK] - To: ${to} | Subject: "${options.subject}" | From: ${from} | Reply-To: ${options.replyTo || 'N/A'}`);
      return { success: true, messageId: `mock-${Date.now()}` };
    }
  }
}
