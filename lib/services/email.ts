import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface DailyReportData {
  userEmail: string;
  reportDate: string;
  sitesCount: number;
  urlsSubmitted: number;
  urlsIndexed: number;
  new404s: number;
  quotaUsed: { google: number; bing: number };
}

function buildReportHtml(data: DailyReportData): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #0f172a; margin-bottom: 24px;">Index111 Daily Report</h1>

      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0; color: #64748b; font-size: 14px;">Report Date</p>
        <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #0f172a;">${data.reportDate}</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
        <div style="background: white; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">Sites</p>
          <p style="margin: 8px 0 0; font-size: 24px; font-weight: 700; color: #0f172a;">${data.sitesCount}</p>
        </div>
        <div style="background: white; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">URLs Submitted</p>
          <p style="margin: 8px 0 0; font-size: 24px; font-weight: 700; color: #0f172a;">${data.urlsSubmitted}</p>
        </div>
      </div>

      <div style="background: white; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #0f172a;">Quota Usage</h3>
        <div style="display: flex; gap: 24px;">
          <div>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Google</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600;">${data.quotaUsed.google}/200</p>
          </div>
          <div>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Bing</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600;">${data.quotaUsed.bing}/10000</p>
          </div>
        </div>
      </div>

      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <a href="${process.env.NEXTAUTH_URL}/reports" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          View Full Report
        </a>
      </div>
    </div>
  `;
}

export async function sendDailyReport(data: DailyReportData) {
  if (!process.env.RESEND_API_KEY) {
    console.log("Resend API key not configured, skipping email");
    return { success: true, skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: "Index111 <noreply@index111.app>",
      to: data.userEmail,
      subject: `Index111 Daily Report - ${data.reportDate}`,
      html: buildReportHtml(data),
    });

    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    console.error("Failed to send email:", error);
    return { success: false, error: message };
  }
}
