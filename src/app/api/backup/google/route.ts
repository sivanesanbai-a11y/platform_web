import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_APP_PASSWORD = "tpqb fhyx dgfx wcpx".replace(/\s+/g, "");

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const {
      type = "form_save",
      id = `REC-${Date.now()}`,
      customer = "Customer",
      email,
      app_password,
      data = {},
      title,
      sheet_csv,
    } = payload;

    const targetEmail = (
      email ||
      process.env.GOOGLE_BACKUP_EMAIL ||
      process.env.GMAIL_USER ||
      ""
    ).trim();

    const pass = (
      app_password ||
      process.env.GOOGLE_APP_PASSWORD ||
      DEFAULT_APP_PASSWORD
    ).replace(/\s+/g, "");

    // If no email address is specified yet, we can return a clear instruction
    if (!targetEmail) {
      return NextResponse.json({
        success: false,
        requires_email: true,
        message: "Please specify your Google / Gmail address in Settings to receive automatic backups.",
        app_password_ready: Boolean(pass),
      });
    }

    // Configure Nodemailer with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: targetEmail,
        pass: pass,
      },
    });

    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const subject = title || `[NUNES CLOUD BACKUP] ${type.toUpperCase()}: ${id} - ${customer} (${timestamp})`;

    const jsonString = JSON.stringify(
      {
        backup_type: type,
        record_id: id,
        customer,
        timestamp: new Date().toISOString(),
        data,
      },
      null,
      2
    );

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px;">
          <h2 style="margin: 0; color: #1e293b; font-size: 20px;">NUNES Operations — Cloud Backup</h2>
          <span style="font-size: 12px; color: #64748b;">Automated Cloud Archival Engine</span>
        </div>

        <p style="font-size: 14px; color: #334155; line-height: 1.5;">
          A record has been safely backed up to your Google account. Even if your local workstation or browser cache is cleared, this data remains preserved forever.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Record Type:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-transform: uppercase;">${type}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Reference / ID:</td>
            <td style="padding: 8px 0; color: #2563eb; font-weight: 700;">${id}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Customer:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${customer}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Timestamp:</td>
            <td style="padding: 8px 0; color: #64748b;">${timestamp} (IST)</td>
          </tr>
        </table>

        <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; color: #475569;">
          <strong>Attached Files:</strong>
          <ul style="margin: 6px 0 0; padding-left: 18px;">
            <li><code>nunes-backup-${id}.json</code> - Complete structured backup payload</li>
            ${sheet_csv ? `<li><code>nunes-sheet-${id}.csv</code> - Ready to open in Microsoft Excel or Google Sheets</li>` : ""}
          </ul>
        </div>

        <div style="margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center;">
          NUNES Instrumentation · Coimbatore Facility · Secure Cloud &amp; Drive Backup
        </div>
      </div>
    `;

    const mailAttachments: any[] = [
      {
        filename: `nunes-backup-${id}.json`,
        content: jsonString,
        contentType: "application/json",
      },
    ];

    if (sheet_csv) {
      mailAttachments.push({
        filename: `nunes-sheet-${id}.csv`,
        content: sheet_csv,
        contentType: "text/csv; charset=utf-8",
      });
    }

    const info = await transporter.sendMail({
      from: `"NUNES Operations Platform" <${targetEmail}>`,
      to: targetEmail,
      subject,
      html: htmlBody,
      attachments: mailAttachments,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully backed up to Google Account (${targetEmail})`,
      message_id: info.messageId,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Google Backup error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to dispatch Google backup email",
        fallback: "Record preserved safely in local persistent browser storage",
      },
      { status: 500 }
    );
  }
}
