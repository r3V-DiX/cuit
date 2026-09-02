// libs/mail/src/templates/subscription-invoice.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export interface SubscriptionInvoiceTemplateData {
  firstName: string;
  invoiceNumber: string;
  packageName: string;
  billingCycle: string;
  totalPaid: string;
  subscriptionUrl: string;
}

export const subscriptionInvoiceTemplate = (data: SubscriptionInvoiceTemplateData): string =>
  baseTemplate(
    `
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.SUCCESS};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          PAYMENT SUCCESSFUL
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
          Thanks for your <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">purchase</span>
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
          Hi ${data.firstName}, your payment for the ${data.packageName} plan (${data.billingCycle.toLowerCase()}) was received. Your invoice is attached to this email as a PDF.
        </td>
      </tr>

      <tr>
        <td align="center" style="padding-bottom:28px;">
          <table
            role="presentation"
            border="0"
            cellspacing="0"
            cellpadding="0"
            width="100%"
            style="width:100%; max-width:480px; background-color:#ffffff; border:1px solid ${COLORS.PAPER_BORDER}; border-radius:10px;"
          >
            <tr>
              <td style="padding:22px; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:26px; color:${COLORS.BODY};">
                <strong>Invoice #</strong> ${data.invoiceNumber}<br/>
                <strong>Plan</strong> ${data.packageName} (${data.billingCycle})<br/>
                <strong>Amount paid</strong> ${data.totalPaid}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td align="center">
          ${cyberButton("VIEW SUBSCRIPTION", data.subscriptionUrl)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:32px;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:24px;">
          Questions about this charge? Contact support@cykruit.com.
        </td>
      </tr>
    </table>
    `,
    `Invoice ${data.invoiceNumber} — ${data.totalPaid} paid`
  );
