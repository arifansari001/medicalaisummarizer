import nodemailer from 'nodemailer';

function createTransporter() {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  if (host.includes('gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendShareEmail({
  toEmail,
  patientName,
  shareLink,
  expiresAt,
}: {
  toEmail: string;
  patientName: string;
  shareLink: string;
  expiresAt: Date;
}) {
  const expiryFormatted = new Date(expiresAt).toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Medical Report Shared</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0891b2,#6366f1);padding:32px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">🏥</div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">MedSummary AI</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Secure Medical Report Sharing</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px;">You have received a medical report</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                <strong>${patientName}</strong> has securely shared their medical records with you via <strong>MedSummary AI</strong>. Click the button below to review the report.
              </p>
              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${shareLink}" target="_blank"
                  style="background:linear-gradient(135deg,#0891b2,#6366f1);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">
                  View Shared Report &rarr;
                </a>
              </div>
              <!-- Info Box -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;color:#64748b;font-size:13px;"><strong>🔗 Access Link:</strong></p>
                <p style="margin:0;word-break:break-all;color:#0891b2;font-size:13px;">${shareLink}</p>
                <p style="margin:12px 0 0;color:#64748b;font-size:13px;">
                  <strong>⏰ Link expires:</strong> ${expiryFormatted} (IST)
                </p>
              </div>
              <!-- Warning -->
              <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;padding:12px 16px;">
                <p style="margin:0;color:#92400e;font-size:13px;">
                  ⚠️ This link is private and should only be accessed by the intended recipient.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                This email was sent by MedSummary AI &lt;${process.env.EMAIL_USER}&gt;. If you believe this was a mistake, please ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"MedSummary AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `📋 ${patientName} has shared a medical report with you`,
    html: htmlBody,
    priority: 'high',
    headers: {
      'X-Priority': '1',
      'Importance': 'high',
    }
  });

  console.log(`✅ Share email sent via Gmail SMTP to ${toEmail} | Message ID: ${info.messageId}`);
  return info;
}

export async function sendAppointmentEmail({
  toEmail,
  doctorName,
  patientName,
  appointmentDate,
  specialty,
}: {
  toEmail: string;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  specialty: string;
}) {
  const transporter = createTransporter();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0891b2,#6366f1);padding:32px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">📅</div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Appointment Confirmed</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">MedSummary AI</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px;">Hello, ${patientName}!</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Your appointment with <strong>Dr. ${doctorName}</strong> (${specialty}) has been booked successfully.
              </p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;color:#64748b;font-size:13px;"><strong>📅 Appointment Details:</strong></p>
                <p style="margin:4px 0;font-size:14px;color:#0f172a;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
                <p style="margin:4px 0;font-size:14px;color:#0f172a;"><strong>Specialty:</strong> ${specialty}</p>
                <p style="margin:4px 0;font-size:14px;color:#0f172a;"><strong>Date & Time:</strong> ${appointmentDate}</p>
              </div>
              <div style="background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;padding:12px 16px;">
                <p style="margin:0;color:#065f46;font-size:13px;">
                  ✅ Please arrive 10 minutes early and carry your ID and previous medical records.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Sent by MedSummary AI. For any changes, please contact your clinic directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"MedSummary AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `📅 Appointment confirmed with Dr. ${doctorName}`,
    html: htmlBody,
    priority: 'high',
    headers: {
      'X-Priority': '1',
      'Importance': 'high',
    }
  });

  console.log(`✅ Appointment email sent via Gmail SMTP to ${toEmail} | Message ID: ${info.messageId}`);
  return info;
}
