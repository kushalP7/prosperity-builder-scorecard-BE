import { SCORECARD_CATEGORY_NAMES } from './pricing-brochure';

/** Shared payload for inquiry acknowledgement / admin notification emails. */
export interface InquiryEmailData {
  firstName: string;
  lastName: string;
  organizationName: string;
  jobTitle: string;
  businessEmail: string;
  phoneNumber: string;
  city: string;
  state: string;
  country: string;
  organizationType: string;
  /** county | city | partner_vendor */
  leadRole?: string;
  notes?: string;
}

export const LEAD_ROLE_LABELS: Record<string, string> = {
  county: 'Authorized County Representative',
  city: 'Authorized City/Town Representative',
  partner_vendor: 'Partners & Vendors',
};

export function formatLeadRoleLabel(leadRole?: string): string {
  if (!leadRole) return '—';
  return LEAD_ROLE_LABELS[leadRole] || leadRole;
}

export interface PaymentReceivedEmailData {
  customerName: string;
  orderNumber: string;
  packageName: string;
  amountFormatted: string;
  reference: string;
  paidAt?: string | null;
  loginUrl: string;
}

export interface PaymentReminderEmailData {
  customerName: string;
  orderNumber: string;
  packageName: string;
  amountDueFormatted: string;
  amountPaidFormatted: string;
  remainingDueFormatted: string;
  orderDate?: string | null;
  loginUrl: string;
}

export interface InvoiceEmailData {
  customerName: string;
  orderNumber: string;
  packageName: string;
  amountDueFormatted: string;
  invoiceDate: string;
  loginUrl: string;
}

/**
 * Builds the customer acknowledgement email template.
 * Designed to exactly match Rose Associates corporate template mockup:
 * - Left: Official Rose Associates Logo
 * - Right: PEOPLE | PLACES | PROGRESS
 * - Red accent dividing rule
 * - Clean personal greeting, body copy, and sign-off
 * - Branded footer with tagline and roseassociates.com link
 */
export function buildCustomerAcknowledgementTemplate(
  data: InquiryEmailData,
  logoUrl: string = 'cid:roselogo',
): string {
  const firstName = escapeHtml(data.firstName.trim());

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Your Inquiry - Rose Associates</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">

          <!-- Top Header -->
          <tr>
            <td style="padding: 22px 32px 18px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <img src="${logoUrl}" alt="ROSE ASSOCIATES" style="display: block; max-height: 40px; width: auto; border: 0;" />
                  </td>
                  <td valign="middle" align="right" style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #6b7280; text-transform: uppercase;">
                    PEOPLE &nbsp;|&nbsp; PLACES &nbsp;|&nbsp; PROGRESS
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Red Accent Line -->
          <tr>
            <td style="height: 2px; background-color: #D3131F; font-size: 2px; line-height: 2px;">&nbsp;</td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 34px 32px 28px 32px;">
              <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 20px 0; letter-spacing: -0.4px;">
                Thank you for your inquiry
              </h1>

              <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
                Dear ${firstName},
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                Thank you for your interest in <span style="color: #D3131F; font-weight: 700;">Rose Associates</span>. We have received your Partners &amp; Vendors inquiry and appreciate you reaching out.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                For partnership and vendor discussions, please contact us directly at
                <a href="mailto:info@roseassociates.com" style="color: #D3131F; font-weight: 700; text-decoration: none;">info@roseassociates.com</a>.
                A member of our team will follow up personally.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 28px 0;">
                Detailed category breakdowns and subscription pricing are shared only with authorized government representatives. If you have additional information to share, you may reply to this email or write to info@roseassociates.com.
              </p>

              <!-- Subtle Divider Line -->
              <div style="border-top: 1px solid #f1f5f9; margin: 28px 0 22px 0;"></div>

              <!-- Sign-off -->
              <p style="font-size: 14px; color: #4b5563; margin: 0 0 5px 0;">
                Best regards,
              </p>
              <p style="font-size: 14px; font-weight: 700; color: #111827; margin: 0;">
                Rose Associates Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px; background-color: #fbfcfd; border-top: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: #111827; text-transform: uppercase;">
                      ROSE ASSOCIATES
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                      Data. Insights. Infrastructure. Impact.
                    </div>
                  </td>
                  <td valign="middle" align="center" style="width: 28px;">
                    <div style="width: 1px; height: 26px; background-color: #D3131F; margin: 0 auto;"></div>
                  </td>
                  <td valign="middle" align="right">
                    <a href="https://roseassociates.com" style="color: #D3131F; font-size: 12.5px; font-weight: 700; text-decoration: none;">
                      roseassociates.com
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Option A — County / City authorized representatives.
 * Numbered 12-category list + private signed brochure PDF link (pricing only in PDF).
 */
export function buildCustomerCountyCityAcknowledgementTemplate(
  data: InquiryEmailData,
  logoUrl: string = 'cid:roselogo',
  brochureUrl?: string | null,
): string {
  const firstName = escapeHtml(data.firstName.trim());
  const roleLabel = escapeHtml(formatLeadRoleLabel(data.leadRole));

  const categoryListHtml = SCORECARD_CATEGORY_NAMES.map(
    (label, i) => `
                <tr>
                  <td style="padding: 5px 0; font-size: 13.5px; color: #4b5563; vertical-align: top; width: 28px;">
                    <span style="font-weight: 700; color: #B5111B;">${i + 1}.</span>
                  </td>
                  <td style="padding: 5px 0; font-size: 13.5px; color: #374151; font-weight: 600;">
                    ${escapeHtml(label)}
                  </td>
                </tr>`,
  ).join('');

  const brochureCta = brochureUrl
    ? `
              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 12px 0;">
                Subscription pricing is shared confidentially. Download the private brochure below (not published on the public website):
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 12px 0;">
                <tr>
                  <td align="left" style="border-radius: 8px; background-color: #B5111B;">
                    <a href="${escapeHtml(brochureUrl)}"
                       style="display: inline-block; padding: 12px 22px; font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none;">
                      Download confidential pricing brochure (PDF)
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 11px; line-height: 1.5; color: #94a3b8; margin: 0 0 18px 0;">
                This is a private, time-limited link (expires in 7 days). Please do not forward publicly.
              </p>`
    : `
              <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0 0 18px 0;">
                Our team will follow up with confidential subscription pricing details shortly.
              </p>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Your Inquiry - Rose Associates</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">

          <tr>
            <td style="padding: 22px 32px 18px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <img src="${logoUrl}" alt="ROSE ASSOCIATES" style="display: block; max-height: 40px; width: auto; border: 0;" />
                  </td>
                  <td valign="middle" align="right" style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #6b7280; text-transform: uppercase;">
                    PEOPLE &nbsp;|&nbsp; PLACES &nbsp;|&nbsp; PROGRESS
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="height: 2px; background-color: #D3131F; font-size: 2px; line-height: 2px;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding: 34px 32px 28px 32px;">
              <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 20px 0; letter-spacing: -0.4px;">
                Thank you for your inquiry
              </h1>

              <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
                Dear ${firstName},
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                Thank you for contacting <span style="color: #D3131F; font-weight: 700;">Rose Associates</span> as an
                <strong>${roleLabel}</strong>. We have received your Enterprise Contact / Certified Reports inquiry.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 10px 0;">
                The Prosperity Builder Scorecard® evaluates community performance across <strong>12 core categories</strong>:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 22px 0;">
                ${categoryListHtml}
              </table>

              ${brochureCta}

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 28px 0;">
                Our team will follow up shortly to discuss the best fit for your jurisdiction. If you have additional context, simply reply to this email.
              </p>

              <div style="border-top: 1px solid #f1f5f9; margin: 28px 0 22px 0;"></div>

              <p style="font-size: 14px; color: #4b5563; margin: 0 0 5px 0;">
                Best regards,
              </p>
              <p style="font-size: 14px; font-weight: 700; color: #111827; margin: 0;">
                Rose Associates Team
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 18px 32px; background-color: #fbfcfd; border-top: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: #111827; text-transform: uppercase;">
                      ROSE ASSOCIATES
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                      Data. Insights. Infrastructure. Impact.
                    </div>
                  </td>
                  <td valign="middle" align="center" style="width: 28px;">
                    <div style="width: 1px; height: 26px; background-color: #D3131F; margin: 0 auto;"></div>
                  </td>
                  <td valign="middle" align="right">
                    <a href="https://roseassociates.com" style="color: #D3131F; font-size: 12.5px; font-weight: 700; text-decoration: none;">
                      roseassociates.com
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Builds the internal sales team briefing email sent to Rose Associates.
 */
export function buildAdminInquiryNotificationTemplate(
  data: InquiryEmailData,
  logoUrl: string = 'cid:roselogo',
): string {
  const fullName = escapeHtml(`${data.firstName} ${data.lastName}`.trim());
  const locationParts = [data.city, data.state, data.country].filter(Boolean);
  const locationStr = escapeHtml(locationParts.join(', '));
  const businessEmail = escapeHtml(data.businessEmail);
  const phoneNumber = escapeHtml(data.phoneNumber);
  const jobTitle = escapeHtml(data.jobTitle);
  const organizationName = escapeHtml(data.organizationName);
  const organizationType = escapeHtml(data.organizationType);
  const leadRoleLabel = escapeHtml(formatLeadRoleLabel(data.leadRole));
  const notes = data.notes ? escapeHtml(data.notes) : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Enterprise Inquiry - Rose Associates</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">

          <!-- Top Header -->
          <tr>
            <td style="padding: 24px 36px 20px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <img src="${logoUrl}" alt="ROSE ASSOCIATES" style="display: block; max-height: 42px; width: auto; border: 0;" />
                  </td>
                  <td valign="middle" align="right" style="font-size: 11px; font-weight: 600; letter-spacing: 0.8px; color: #475569; text-transform: uppercase;">
                    ENTERPRISE CONTACT PORTAL
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Red Accent Full-Width Line -->
          <tr>
            <td style="height: 3px; background-color: #B5111B; font-size: 0px; line-height: 0px;">&nbsp;</td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 34px 36px 28px 36px;">

              <!-- Title -->
              <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 14px 0; letter-spacing: -0.5px; line-height: 1.2;">
                New Enterprise Inquiry
              </h1>

              <p style="font-size: 13.5px; line-height: 1.6; color: #475569; margin: 0 0 28px 0;">
                A new inquiry has been submitted through the Rose Associates Enterprise Contact Portal.<br />Please review the information below and respond directly to the prospect.
              </p>

              <!-- Section 1: Contact Person -->
              <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">
                Contact Person
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                <tr>
                  <td style="width: 44px; border-bottom: 2.5px solid #B5111B; font-size: 0px; line-height: 0px;">&nbsp;</td>
                  <td style="border-bottom: 1px solid #e2e8f0; font-size: 0px; line-height: 0px;">&nbsp;</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border-bottom: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 8px 0; font-size: 13.5px; color: #64748B; width: 38%;">Name</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0 16px 0; font-size: 13.5px; color: #64748B;">Title / Designation</td>
                  <td style="padding: 8px 0 16px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${jobTitle}</td>
                </tr>
              </table>

              <!-- Section 2: Organization -->
              <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">
                Organization
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                <tr>
                  <td style="width: 44px; border-bottom: 2.5px solid #B5111B; font-size: 0px; line-height: 0px;">&nbsp;</td>
                  <td style="border-bottom: 1px solid #e2e8f0; font-size: 0px; line-height: 0px;">&nbsp;</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border-bottom: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 8px 0; font-size: 13.5px; color: #64748B; width: 38%;">Organization Name</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${organizationName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13.5px; color: #64748B;">Organization Type</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${organizationType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0 16px 0; font-size: 13.5px; color: #64748B;">Lead Role</td>
                  <td style="padding: 8px 0 16px 0; font-size: 14px; font-weight: 700; color: #B5111B;">${leadRoleLabel}</td>
                </tr>
              </table>

              <!-- Section 3: Contact Information -->
              <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">
                Contact Information
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                <tr>
                  <td style="width: 44px; border-bottom: 2.5px solid #B5111B; font-size: 0px; line-height: 0px;">&nbsp;</td>
                  <td style="border-bottom: 1px solid #e2e8f0; font-size: 0px; line-height: 0px;">&nbsp;</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border-bottom: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 8px 0; font-size: 13.5px; color: #64748B; width: 38%;">Business Email</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: #B5111B;">
                    <a href="mailto:${businessEmail}" style="color: #B5111B; text-decoration: none; font-weight: 700;">${businessEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13.5px; color: #64748B;">Phone Number</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                    <a href="tel:${phoneNumber}" style="color: #0f172a; text-decoration: none;">${phoneNumber}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0 16px 0; font-size: 13.5px; color: #64748B;">Location</td>
                  <td style="padding: 8px 0 16px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${locationStr}</td>
                </tr>
                ${
                  notes
                    ? `
                <tr>
                  <td style="padding: 8px 0 16px 0; font-size: 13.5px; color: #64748B; vertical-align: top;">Project Notes</td>
                  <td style="padding: 8px 0 16px 0; font-size: 14px; color: #0f172a; line-height: 1.5;">${notes}</td>
                </tr>
                `
                    : ''
                }
              </table>

              <!-- Section 4: Next Steps -->
              <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">
                Next Steps
              </div>
              <p style="font-size: 13.5px; line-height: 1.5; color: #475569; margin: 0 0 18px 0;">
                Please review this inquiry and respond directly to the prospect based on their requirements.
              </p>

              <!-- Reply to Prospect Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                <tr>
                  <td align="left">
                    <a href="mailto:${businessEmail}?subject=Re: Enterprise Inquiry - Rose Associates"
                       style="display: inline-block; background-color: #B5111B; color: #ffffff; font-size: 13.5px; font-weight: 700; padding: 11px 24px; border-radius: 6px; text-decoration: none;">
                      Reply to Prospect
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px 36px; border-top: 1px solid #e2e8f0; background-color: #ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <div style="font-size: 11.5px; font-weight: 800; letter-spacing: 0.8px; color: #0f172a; text-transform: uppercase;">
                      ROSE ASSOCIATES
                    </div>
                    <div style="font-size: 11px; color: #64748B; margin-top: 3px;">
                      Data. Insights. Infrastructure. Impact.
                    </div>
                  </td>
                  <td valign="middle" align="center" style="width: 32px;">
                    <div style="width: 1px; height: 28px; background-color: #cbd5e1; margin: 0 auto;"></div>
                  </td>
                  <td valign="middle" align="right">
                    <a href="https://roseassociates.com" style="color: #B5111B; font-size: 13px; font-weight: 600; text-decoration: none;">
                      roseassociates.com
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Builds the customer payment-received confirmation email.
 */
export function buildPaymentReceivedTemplate(
  data: PaymentReceivedEmailData,
  logoUrl: string = 'cid:roselogo',
): string {
  const firstName = escapeHtml((data.customerName || 'Customer').trim().split(/\s+/)[0]);
  const paidAtRow = data.paidAt
    ? `
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; width: 40%; border-top: 1px solid #f1f5f9;">Paid on</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${escapeHtml(data.paidAt)}</td>
                </tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received - Rose Associates</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">

          <!-- Top Header -->
          <tr>
            <td style="padding: 22px 32px 18px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <img src="${logoUrl}" alt="ROSE ASSOCIATES" style="display: block; max-height: 40px; width: auto; border: 0;" />
                  </td>
                  <td valign="middle" align="right" style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #6b7280; text-transform: uppercase;">
                    PEOPLE &nbsp;|&nbsp; PLACES &nbsp;|&nbsp; PROGRESS
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Red Accent Line -->
          <tr>
            <td style="height: 2px; background-color: #D3131F; font-size: 2px; line-height: 2px;">&nbsp;</td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 34px 32px 28px 32px;">
              <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 20px 0; letter-spacing: -0.4px;">
                Payment received
              </h1>

              <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
                Dear ${firstName},
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                Thank you. We have received your full payment of
                <strong style="color: #111827;">${escapeHtml(data.amountFormatted)}</strong>
                for
                <strong style="color: #111827;">${escapeHtml(data.packageName)}</strong>.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 22px 0;">
                Your account is ready. Log in to access your scorecard project and continue with next steps.
              </p>

              <!-- Receipt card -->
              <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">
                Payment details
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                <tr>
                  <td style="width: 44px; border-bottom: 2.5px solid #B5111B; font-size: 0px; line-height: 0px;">&nbsp;</td>
                  <td style="border-bottom: 1px solid #e2e8f0; font-size: 0px; line-height: 0px;">&nbsp;</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; width: 40%;">Order</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${escapeHtml(data.orderNumber)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; border-top: 1px solid #f1f5f9;">Package</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${escapeHtml(data.packageName)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; border-top: 1px solid #f1f5f9;">Amount paid</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 700; color: #B5111B; border-top: 1px solid #f1f5f9;">${escapeHtml(data.amountFormatted)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; border-top: 1px solid #f1f5f9;">Reference</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${escapeHtml(data.reference)}</td>
                </tr>
                ${paidAtRow}
              </table>

              <!-- Log in CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #B5111B;">
                    <a href="${escapeHtml(data.loginUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Log in
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 1.5; color: #6b7280; margin: 0 0 28px 0;">
                If the button does not work, copy and paste this link into your browser:<br />
                <a href="${escapeHtml(data.loginUrl)}" style="color: #D3131F; word-break: break-all;">${escapeHtml(data.loginUrl)}</a>
              </p>

              <!-- Subtle Divider Line -->
              <div style="border-top: 1px solid #f1f5f9; margin: 8px 0 22px 0;"></div>

              <!-- Sign-off -->
              <p style="font-size: 14px; color: #4b5563; margin: 0 0 5px 0;">
                Best regards,
              </p>
              <p style="font-size: 14px; font-weight: 700; color: #111827; margin: 0;">
                Rose Associates Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px; background-color: #fbfcfd; border-top: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: #111827; text-transform: uppercase;">
                      ROSE ASSOCIATES
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                      Data. Insights. Infrastructure. Impact.
                    </div>
                  </td>
                  <td valign="middle" align="center" style="width: 28px;">
                    <div style="width: 1px; height: 26px; background-color: #D3131F; margin: 0 auto;"></div>
                  </td>
                  <td valign="middle" align="right">
                    <a href="https://roseassociates.com" style="color: #D3131F; font-size: 12.5px; font-weight: 700; text-decoration: none;">
                      roseassociates.com
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/** Invoice / mail-check checkout — PDF attached separately. */
export function buildInvoiceIssuedTemplate(
  data: InvoiceEmailData,
  logoUrl: string = 'cid:roselogo',
): string {
  const firstName = escapeHtml((data.customerName || 'Customer').trim().split(/\s+/)[0]);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - Rose Associates</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
          <tr>
            <td style="padding: 22px 32px 18px 32px;">
              <img src="${logoUrl}" alt="ROSE ASSOCIATES" style="display: block; max-height: 40px; width: auto; border: 0;" />
            </td>
          </tr>
          <tr>
            <td style="height: 2px; background-color: #D3131F; font-size: 2px; line-height: 2px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 34px 32px 28px 32px;">
              <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 20px 0;">Invoice enclosed</h1>
              <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">Dear ${firstName},</p>
              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                Thank you for choosing <strong>Invoice / mail check</strong> for
                <strong style="color: #111827;">${escapeHtml(data.packageName)}</strong>
                (${escapeHtml(data.orderNumber)}).
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                Amount due: <strong style="color: #B5111B;">${escapeHtml(data.amountDueFormatted)}</strong>
                &nbsp;·&nbsp; Invoice date: ${escapeHtml(data.invoiceDate)}
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                Please see the attached PDF. Make checks payable to <strong>Rose Associates</strong>
                and mail to Rose Associates — Attn: Accounts Receivable.
                Questions: <a href="mailto:info@roseassociates.com" style="color: #D3131F;">info@roseassociates.com</a>.
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 22px 0;">
                Your package unlocks after we record payment. You can sign in anytime to view this pending order:
              </p>
              <a href="${escapeHtml(data.loginUrl)}" style="display: inline-block; background-color: #B5111B; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 22px; border-radius: 8px;">Log in</a>
              <p style="font-size: 14px; color: #4b5563; margin: 28px 0 0 0;">Rose Associates Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function buildInvoiceIssuedText(data: InvoiceEmailData): string {
  const firstName = (data.customerName || 'Customer').trim().split(/\s+/)[0];
  return [
    `Dear ${firstName},`,
    '',
    `Invoice for ${data.packageName} (${data.orderNumber}) is attached.`,
    `Amount due: ${data.amountDueFormatted}`,
    `Invoice date: ${data.invoiceDate}`,
    '',
    'Make checks payable to Rose Associates.',
    'Mail to: Rose Associates — Attn: Accounts Receivable',
    'Questions: info@roseassociates.com',
    '',
    'Package access unlocks after payment is recorded.',
    `Log in: ${data.loginUrl}`,
    '',
    'Rose Associates Team',
  ].join('\n');
}

/**
 * Plain-text fallback for payment-received emails.
 */
export function buildPaymentReceivedText(data: PaymentReceivedEmailData): string {
  const firstName = (data.customerName || 'Customer').trim().split(/\s+/)[0];
  const lines = [
    `Dear ${firstName},`,
    '',
    `Thank you. We have received your full payment of ${data.amountFormatted} for ${data.packageName}.`,
    '',
    'Payment details:',
    `  Order: ${data.orderNumber}`,
    `  Package: ${data.packageName}`,
    `  Amount paid: ${data.amountFormatted}`,
    `  Reference: ${data.reference}`,
  ];
  if (data.paidAt) {
    lines.push(`  Paid on: ${data.paidAt}`);
  }
  lines.push(
    '',
    'Your account is ready. Log in to continue:',
    data.loginUrl,
    '',
    'Best regards,',
    'Rose Associates Team',
  );
  return lines.join('\n');
}

/**
 * Professional payment reminder for pending / unpaid orders.
 */
export function buildPaymentReminderTemplate(
  data: PaymentReminderEmailData,
  logoUrl: string = 'cid:roselogo',
): string {
  const firstName = escapeHtml((data.customerName || 'Customer').trim().split(/\s+/)[0]);
  const orderDateRow = data.orderDate
    ? `
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; border-top: 1px solid #f1f5f9;">Order date</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${escapeHtml(data.orderDate)}</td>
                </tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment reminder - Rose Associates</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">

          <tr>
            <td style="padding: 22px 32px 18px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <img src="${logoUrl}" alt="ROSE ASSOCIATES" style="display: block; max-height: 40px; width: auto; border: 0;" />
                  </td>
                  <td valign="middle" align="right" style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #6b7280; text-transform: uppercase;">
                    PEOPLE &nbsp;|&nbsp; PLACES &nbsp;|&nbsp; PROGRESS
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="height: 2px; background-color: #D3131F; font-size: 2px; line-height: 2px;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding: 34px 32px 28px 32px;">
              <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 20px 0; letter-spacing: -0.4px;">
                Payment reminder
              </h1>

              <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
                Dear ${firstName},
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                This notice confirms that your
                <strong style="color: #111827;">${escapeHtml(data.packageName)}</strong>
                order has an outstanding balance of
                <strong style="color: #111827;">${escapeHtml(data.remainingDueFormatted)}</strong>.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 22px 0;">
                Please log in to complete payment and continue with your Prosperity Builder Scorecard® engagement. If you need assistance, contact your Rose Associates representative.
              </p>

              <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">
                Order summary
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                <tr>
                  <td style="width: 44px; border-bottom: 2.5px solid #B5111B; font-size: 0px; line-height: 0px;">&nbsp;</td>
                  <td style="border-bottom: 1px solid #e2e8f0; font-size: 0px; line-height: 0px;">&nbsp;</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; width: 40%;">Order</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${escapeHtml(data.orderNumber)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; border-top: 1px solid #f1f5f9;">Package</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${escapeHtml(data.packageName)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; border-top: 1px solid #f1f5f9;">Contract total</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${escapeHtml(data.amountDueFormatted)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; border-top: 1px solid #f1f5f9;">Paid so far</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${escapeHtml(data.amountPaidFormatted)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; border-top: 1px solid #f1f5f9;">Remaining due</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 700; color: #B5111B; border-top: 1px solid #f1f5f9;">${escapeHtml(data.remainingDueFormatted)}</td>
                </tr>
                ${orderDateRow}
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #B5111B;">
                    <a href="${escapeHtml(data.loginUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Log in to complete payment
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 1.5; color: #6b7280; margin: 0 0 28px 0;">
                If the button does not work, copy and paste this link into your browser:<br />
                <a href="${escapeHtml(data.loginUrl)}" style="color: #D3131F; word-break: break-all;">${escapeHtml(data.loginUrl)}</a>
              </p>

              <div style="border-top: 1px solid #f1f5f9; margin: 8px 0 22px 0;"></div>

              <p style="font-size: 14px; color: #4b5563; margin: 0 0 5px 0;">
                Best regards,
              </p>
              <p style="font-size: 14px; font-weight: 700; color: #111827; margin: 0;">
                Rose Associates Team
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 18px 32px; background-color: #fbfcfd; border-top: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: #111827; text-transform: uppercase;">
                      ROSE ASSOCIATES
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                      Data. Insights. Infrastructure. Impact.
                    </div>
                  </td>
                  <td valign="middle" align="center" style="width: 28px;">
                    <div style="width: 1px; height: 26px; background-color: #D3131F; margin: 0 auto;"></div>
                  </td>
                  <td valign="middle" align="right">
                    <a href="https://roseassociates.com" style="color: #D3131F; font-size: 12.5px; font-weight: 700; text-decoration: none;">
                      roseassociates.com
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildPaymentReminderText(data: PaymentReminderEmailData): string {
  const firstName = (data.customerName || 'Customer').trim().split(/\s+/)[0];
  const lines = [
    `Dear ${firstName},`,
    '',
    `This notice confirms that your ${data.packageName} order has an outstanding balance of ${data.remainingDueFormatted}.`,
    '',
    'Order summary:',
    `  Order: ${data.orderNumber}`,
    `  Package: ${data.packageName}`,
    `  Contract total: ${data.amountDueFormatted}`,
    `  Paid so far: ${data.amountPaidFormatted}`,
    `  Remaining due: ${data.remainingDueFormatted}`,
  ];
  if (data.orderDate) {
    lines.push(`  Order date: ${data.orderDate}`);
  }
  lines.push(
    '',
    'Please log in to complete payment:',
    data.loginUrl,
    '',
    'Best regards,',
    'Rose Associates Team',
  );
  return lines.join('\n');
}

export interface ScorecardReportEmailData {
  customerName: string;
  orderNumber: string;
  projectName: string;
  reportFileName: string;
  downloadUrl: string;
  isResend?: boolean;
  /** initial = publish-time auto PDF; detailed = admin-uploaded certified report */
  reportKind?: 'initial' | 'detailed';
}

/**
 * Builds the scorecard report delivery email (download link only).
 */
export function buildScorecardReportDeliveredTemplate(
  data: ScorecardReportEmailData,
  logoUrl: string = 'cid:roselogo',
): string {
  const firstName = escapeHtml((data.customerName || 'Customer').trim().split(/\s+/)[0]);
  const isResend = Boolean(data.isResend);
  const kind = data.reportKind === 'initial' ? 'initial' : 'detailed';
  const kindLabel = kind === 'initial' ? 'Initial Scorecard Report' : 'Detailed Scorecard Report';
  const headline =
    kind === 'initial'
      ? isResend
        ? 'Your initial scorecard (updated)'
        : 'Your initial scorecard is ready'
      : isResend
        ? 'Your detailed scorecard report (updated)'
        : 'Your detailed scorecard report is ready';
  const intro =
    kind === 'initial'
      ? isResend
        ? `We are sending an updated copy of the <strong>initial</strong> scorecard report for <strong style="color: #111827;">${escapeHtml(data.projectName)}</strong>.`
        : `Your project has been published. We are pleased to deliver the <strong>initial</strong> scorecard report for <strong style="color: #111827;">${escapeHtml(data.projectName)}</strong>. A detailed certified report will follow in approximately 15–30 days.`
      : isResend
        ? `We are sending an updated copy of the <strong>detailed</strong> scorecard report for <strong style="color: #111827;">${escapeHtml(data.projectName)}</strong>.`
        : `We are pleased to deliver your <strong>detailed</strong> scorecard report for <strong style="color: #111827;">${escapeHtml(data.projectName)}</strong>. The full assessment is ready for download.`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline} - Rose Associates</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">

          <tr>
            <td style="padding: 22px 32px 18px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <img src="${logoUrl}" alt="ROSE ASSOCIATES" style="display: block; max-height: 40px; width: auto; border: 0;" />
                  </td>
                  <td valign="middle" align="right" style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #6b7280; text-transform: uppercase;">
                    PEOPLE &nbsp;|&nbsp; PLACES &nbsp;|&nbsp; PROGRESS
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="height: 2px; background-color: #D3131F; font-size: 2px; line-height: 2px;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding: 34px 32px 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 18px;">
                <tr>
                  <td>
                    <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.4px;">
                      ${headline}
                    </h1>
                  </td>
                  <td valign="middle" align="right">
                    <span style="display: inline-block; padding: 5px 10px; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">
                      ${isResend ? 'Report updated' : 'Report delivered'}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
                Dear ${firstName},
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 22px 0;">
                ${intro}
              </p>

              <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">
                Delivery details
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                <tr>
                  <td style="width: 44px; border-bottom: 2.5px solid #B5111B; font-size: 0px; line-height: 0px;">&nbsp;</td>
                  <td style="border-bottom: 1px solid #e2e8f0; font-size: 0px; line-height: 0px;">&nbsp;</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 22px;">
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; width: 40%;">Order</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${escapeHtml(data.orderNumber)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; border-top: 1px solid #f1f5f9;">Project</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${escapeHtml(data.projectName)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13.5px; color: #64748B; border-top: 1px solid #f1f5f9;">Report file</td>
                  <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${escapeHtml(data.reportFileName)}</td>
                </tr>
              </table>

              <!-- PDF preview card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle" style="width: 42px;">
                          <div style="width: 36px; height: 36px; border-radius: 8px; background-color: #fee2e2; color: #B5111B; font-size: 11px; font-weight: 800; text-align: center; line-height: 36px;">
                            PDF
                          </div>
                        </td>
                        <td valign="middle" style="padding-left: 10px;">
                          <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${escapeHtml(data.reportFileName)}</div>
                          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">${kindLabel}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #047857;">
                    <a href="${escapeHtml(data.downloadUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Download Scorecard PDF Report
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 1.5; color: #6b7280; margin: 0 0 28px 0;">
                If the button does not work, copy and paste this link into your browser:<br />
                <a href="${escapeHtml(data.downloadUrl)}" style="color: #D3131F; word-break: break-all;">${escapeHtml(data.downloadUrl)}</a>
              </p>

              <div style="border-top: 1px solid #f1f5f9; margin: 8px 0 22px 0;"></div>

              <p style="font-size: 14px; color: #4b5563; margin: 0 0 5px 0;">
                Best regards,
              </p>
              <p style="font-size: 14px; font-weight: 700; color: #111827; margin: 0;">
                Rose Associates Team
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 18px 32px; background-color: #fbfcfd; border-top: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" align="left">
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: #111827; text-transform: uppercase;">
                      ROSE ASSOCIATES
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                      Data. Insights. Infrastructure. Impact.
                    </div>
                  </td>
                  <td valign="middle" align="center" style="width: 28px;">
                    <div style="width: 1px; height: 26px; background-color: #D3131F; margin: 0 auto;"></div>
                  </td>
                  <td valign="middle" align="right">
                    <a href="https://roseassociates.com" style="color: #D3131F; font-size: 12.5px; font-weight: 700; text-decoration: none;">
                      roseassociates.com
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildScorecardReportDeliveredText(data: ScorecardReportEmailData): string {
  const firstName = (data.customerName || 'Customer').trim().split(/\s+/)[0];
  const isResend = Boolean(data.isResend);
  const kind = data.reportKind === 'initial' ? 'initial' : 'detailed';
  return [
    `Dear ${firstName},`,
    '',
    kind === 'initial'
      ? isResend
        ? `We are sending an updated copy of the initial scorecard report for ${data.projectName}.`
        : `Your project has been published. The initial scorecard report for ${data.projectName} is ready. A detailed certified report will follow in approximately 15–30 days.`
      : isResend
        ? `We are sending an updated copy of the detailed scorecard report for ${data.projectName}.`
        : `We are pleased to deliver your detailed scorecard report for ${data.projectName}. The assessment is complete and ready for download.`,
    '',
    'Delivery details:',
    `  Order: ${data.orderNumber}`,
    `  Project: ${data.projectName}`,
    `  Report file: ${data.reportFileName}`,
    '',
    'Download your report:',
    data.downloadUrl,
    '',
    'Best regards,',
    'Rose Associates Team',
  ].join('\n');
}

/**
 * Portal invite — County/City lead sets password via time-limited link.
 */
export function buildPortalInviteTemplate(
  data: { firstName: string; setPasswordUrl: string; organizationName?: string },
  logoUrl: string = 'cid:roselogo',
): string {
  const firstName = escapeHtml(data.firstName.trim());
  const url = escapeHtml(data.setPasswordUrl);
  const org = data.organizationName ? escapeHtml(data.organizationName.trim()) : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Portal Access - Rose Associates</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:36px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="padding:22px 32px 18px;">
          <table width="100%"><tr>
            <td><img src="${logoUrl}" alt="ROSE ASSOCIATES" style="display:block;max-height:40px;width:auto;border:0;" /></td>
            <td align="right" style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#6b7280;text-transform:uppercase;">PEOPLE | PLACES | PROGRESS</td>
          </tr></table>
        </td></tr>
        <tr><td style="height:2px;background:#D3131F;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:34px 32px 28px;">
          <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">Your portal access is ready</h1>
          <p style="font-size:15px;color:#374151;margin:0 0 14px;">Dear ${firstName},</p>
          <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 14px;">
            Rose Associates has granted you access to the Prosperity Builder Scorecard® portal${org ? ` for <strong>${org}</strong>` : ''}.
            Set your password using the secure link below to sign in.
          </p>
          <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 20px;">
            After signing in, complete package checkout to unlock projects (pay first).
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>
            <td style="border-radius:8px;background:#B5111B;">
              <a href="${url}" style="display:inline-block;padding:12px 22px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;">Set password &amp; open portal</a>
            </td>
          </tr></table>
          <p style="font-size:11px;line-height:1.5;color:#94a3b8;margin:0 0 18px;">This link expires in 7 days. If it expires, ask your Rose Associates contact to resend portal access.</p>
          <p style="font-size:14px;color:#4b5563;margin:0 0 4px;">Best regards,</p>
          <p style="font-size:14px;font-weight:700;color:#111827;margin:0;">Rose Associates Team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Existing account — remind them to log in (no new registration).
 */
export function buildAlreadyRegisteredLoginTemplate(
  data: { firstName: string; loginUrl: string },
  logoUrl: string = 'cid:roselogo',
): string {
  const firstName = escapeHtml(data.firstName.trim());
  const url = escapeHtml(data.loginUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Sign in - Rose Associates</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:36px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="padding:22px 32px 18px;">
          <img src="${logoUrl}" alt="ROSE ASSOCIATES" style="display:block;max-height:40px;width:auto;border:0;" />
        </td></tr>
        <tr><td style="height:2px;background:#D3131F;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:34px 32px 28px;">
          <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px;">You already have an account</h1>
          <p style="font-size:15px;color:#374151;margin:0 0 14px;">Dear ${firstName},</p>
          <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 20px;">
            An account with your email already exists on the Rose Associates portal. Sign in with your existing credentials to continue. After login, purchase a package if you have not already done so.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>
            <td style="border-radius:8px;background:#B5111B;">
              <a href="${url}" style="display:inline-block;padding:12px 22px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;">Sign in to portal</a>
            </td>
          </tr></table>
          <p style="font-size:14px;color:#4b5563;margin:0 0 4px;">Best regards,</p>
          <p style="font-size:14px;font-weight:700;color:#111827;margin:0;">Rose Associates Team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
