import { ConfigService } from '@nestjs/config';

/**
 * Central mail address helpers — swap Rose SMTP later via env only:
 *
 *   SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS
 *   MAIL_FROM              → default From (customer + password-reset emails)
 *   MAIL_FROM_PORTAL       → From for admin/portal notifications (defaults to MAIL_FROM)
 *   ADMIN_INQUIRY_EMAIL    → To for Enterprise Contact alerts (Kathleen)
 *   PASSWORD_RESET_FROM    → optional override for reset mail From (defaults to MAIL_FROM)
 */
export function getMailFrom(config: ConfigService): string {
  const smtpUser = config.get<string>('SMTP_USER', 'info@roseassociates.com');
  return (
    config.get<string>('MAIL_FROM') ||
    `"Rose Associates Southeast" <${smtpUser}>`
  );
}

export function getPortalMailFrom(config: ConfigService): string {
  const smtpUser = config.get<string>('SMTP_USER', 'info@roseassociates.com');
  return (
    config.get<string>('MAIL_FROM_PORTAL') ||
    getMailFrom(config) ||
    `"Rose Associates Portal" <${smtpUser}>`
  );
}

/** Enterprise Contact notification recipient (Kathleen). */
export function getAdminInquiryEmail(config: ConfigService): string {
  return config.get<string>('ADMIN_INQUIRY_EMAIL', 'krose@roseassociates.com');
}

/** Password-reset From address (info@ by default). */
export function getPasswordResetFrom(config: ConfigService): string {
  return config.get<string>('PASSWORD_RESET_FROM') || getMailFrom(config);
}
