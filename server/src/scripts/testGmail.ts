import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

async function testGmail() {
  console.log('📧 Testing Gmail SMTP...');
  console.log('   User:', process.env.EMAIL_USER);
  console.log('   Pass length:', process.env.EMAIL_PASS?.length);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    const info = await transporter.sendMail({
      from: `"MedSummary AI" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // send to itself as a test
      subject: '✅ MedSummary AI – Email Test',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
          <h2 style="color:#0891b2;">🏥 MedSummary AI</h2>
          <p style="color:#334155;">Gmail SMTP is working correctly! Real emails will now be delivered to any recipient.</p>
          <p style="color:#64748b;font-size:13px;">Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('\n🎉 Gmail SMTP integration is working! Check medsummaryai@gmail.com inbox.\n');
  } catch (err: any) {
    console.error('❌ SMTP Error:', err.message);
    if (err.message?.includes('Invalid login') || err.message?.includes('Username and Password not accepted')) {
      console.error('\n⚠️  App Password might be incorrect. Please regenerate from:');
      console.error('   https://myaccount.google.com/apppasswords');
    }
    process.exit(1);
  }
}

testGmail();
