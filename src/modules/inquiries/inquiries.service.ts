import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { Inquiry } from './entities/inquiry.entity';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { EmailService } from '../../integrations/email/email.service';
import {
  buildAdminInquiryNotificationTemplate,
  buildCustomerAcknowledgementTemplate,
} from './templates/email-templates';

@Injectable()
export class InquiriesService {
  private readonly logger = new Logger(InquiriesService.name);

  constructor(
    @InjectModel(Inquiry)
    private readonly inquiryModel: typeof Inquiry,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) { }

  /**
   * Creates a new customer inquiry, persists to database, and triggers emails.
   */
  async createInquiry(dto: CreateInquiryDto): Promise<{ success: boolean; message: string; id: string }> {
    // 1. Persist lead in PostgreSQL database
    const inquiry = await this.inquiryModel.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      organizationName: dto.organizationName.trim(),
      jobTitle: dto.jobTitle.trim(),
      businessEmail: dto.businessEmail.trim().toLowerCase(),
      phoneNumber: dto.phoneNumber.trim(),
      city: dto.city.trim(),
      state: dto.state.trim(),
      country: dto.country?.trim() || 'United States',
      organizationType: dto.organizationType.trim(),
      notes: dto.notes?.trim() || null,
      status: 'pending',
    });

    this.logger.log(`New inquiry saved to database with ID: ${inquiry.id} (${dto.organizationName})`);

    // 2. Dispatch emails asynchronously (so user does not wait unnecessarily)
    this.dispatchEmails(dto, inquiry.id).catch((err) => {
      this.logger.error(`Error in dispatchEmails for inquiry ${inquiry.id}: ${err.message}`, err.stack);
    });

    return {
      success: true,
      message: 'Inquiry submitted successfully. We have received your request and will contact you shortly.',
      id: inquiry.id,
    };
  }

  /**
   * Dispatches both the internal lead alert and the customer acknowledgement.
   */
  private async dispatchEmails(dto: CreateInquiryDto, inquiryId: string): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_INQUIRY_EMAIL', 'info@roseassociates.com');

    // Logo embedding configuration
    const configuredLogoUrl = this.configService.get<string>('APP_LOGO_URL');
    const localLogoPath = path.resolve(process.cwd(), 'assets', 'logo.png');
    const hasLocalLogo = fs.existsSync(localLogoPath);

    // If APP_LOGO_URL is explicitly set, use it. Otherwise, embed locally via CID attachment.
    const logoUrl = configuredLogoUrl || (hasLocalLogo ? 'cid:roselogo' : '/logo.png');
    const attachments = (!configuredLogoUrl && hasLocalLogo)
      ? [
        {
          filename: 'logo.png',
          path: localLogoPath,
          cid: 'roselogo',
        },
      ]
      : [];

    // Sender display configurations
    const smtpUser = this.configService.get<string>('SMTP_USER', 'info@roseassociates.com');
    const adminFrom = this.configService.get<string>('MAIL_FROM_PORTAL') || `"Rose Associates Portal" <${smtpUser}>`;
    const customerFrom = this.configService.get<string>('MAIL_FROM') || `"Rose Associates Southeast" <${smtpUser}>`;

    // 1. Internal Alert to Rose Associates Sales Team
    const adminHtml = buildAdminInquiryNotificationTemplate(dto, logoUrl);
    const adminSubject = `New Enterprise Inquiry: ${dto.organizationName} - ${dto.firstName} ${dto.lastName}`;

    // 2. Customer Acknowledgement to Prospect
    const customerHtml = buildCustomerAcknowledgementTemplate(dto, logoUrl);
    const customerSubject = 'Thank you for your inquiry – Rose Associates Southeast';

    try {
      // Send alert to Admin (replyTo points to the customer for 1-click reply)
      await this.emailService.sendEmail({
        from: adminFrom,
        to: adminEmail,
        replyTo: dto.businessEmail,
        subject: adminSubject,
        html: adminHtml,
        attachments,
      });

      // Send acknowledgement to prospective customer (replyTo points to sales admin)
      await this.emailService.sendEmail({
        from: customerFrom,
        to: dto.businessEmail,
        replyTo: adminEmail,
        subject: customerSubject,
        html: customerHtml,
        attachments,
      });
    } catch (err: any) {
      this.logger.error(`Failed to send emails for inquiry ${inquiryId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Retrieves all inquiries (for future admin/CMS view).
   */
  async findAll(): Promise<Inquiry[]> {
    return this.inquiryModel.findAll({
      order: [['createdAt', 'DESC']],
    });
  }
}
