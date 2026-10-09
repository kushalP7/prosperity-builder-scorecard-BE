import { CreateInquiryDto } from '../dto/create-inquiry.dto';

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
  data: CreateInquiryDto,
  logoUrl: string = 'cid:roselogo',
): string {
  const firstName = data.firstName.trim();

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
                Thank you for contacting <span style="color: #D3131F; font-weight: 700;">Rose Associates</span> regarding our enterprise solutions. We have received your inquiry and our team will review your requirements.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                A member of our team will contact you directly to discuss your needs and provide the appropriate information.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 28px 0;">
                If you have any additional information to share, you can simply reply to this email.
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
 * Builds the internal sales team briefing email sent to Rose Associates.
 * Matches the exact card layout from the design mockup:
 * - Left: Official Rose Associates Logo
 * - Right: ENTERPRISE CONTACT PORTAL
 * - Red accent dividing rule
 * - Structured Prospect Details Card with highlighted red email link
 * - Next Steps section
 * - Red "Reply to Prospect" action button
 * - Branded footer with tagline and roseassociates.com link
 */
export function buildAdminInquiryNotificationTemplate(
  data: CreateInquiryDto,
  logoUrl: string = 'cid:roselogo',
): string {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const locationParts = [data.city, data.state, data.country].filter(Boolean);
  const locationStr = locationParts.join(', ');

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

              <!-- Lead Description: exactly 2 balanced lines without awkward wrapping -->
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
                  <td style="padding: 8px 0 16px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${data.jobTitle}</td>
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
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${data.organizationName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0 16px 0; font-size: 13.5px; color: #64748B;">Organization Type</td>
                  <td style="padding: 8px 0 16px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${data.organizationType}</td>
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
                    <a href="mailto:${data.businessEmail}" style="color: #B5111B; text-decoration: none; font-weight: 700;">${data.businessEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13.5px; color: #64748B;">Phone Number</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                    <a href="tel:${data.phoneNumber}" style="color: #0f172a; text-decoration: none;">${data.phoneNumber}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0 16px 0; font-size: 13.5px; color: #64748B;">Location</td>
                  <td style="padding: 8px 0 16px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${locationStr}</td>
                </tr>
                ${
                  data.notes
                    ? `
                <tr>
                  <td style="padding: 8px 0 16px 0; font-size: 13.5px; color: #64748B; vertical-align: top;">Project Notes</td>
                  <td style="padding: 8px 0 16px 0; font-size: 14px; color: #0f172a; line-height: 1.5;">${data.notes}</td>
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
                    <a href="mailto:${data.businessEmail}?subject=Re: Enterprise Inquiry - Rose Associates" 
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
