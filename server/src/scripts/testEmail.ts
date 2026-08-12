import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('🔑 Using Resend API Key:', process.env.RESEND_API_KEY?.slice(0, 10) + '...');
  console.log('📤 Sending test email...\n');

  const { data, error } = await resend.emails.send({
    from: 'MedSummary AI <onboarding@resend.dev>',
    to: ['delivered@resend.dev'], // Resend's official test address
    subject: '✅ MedSummary AI – Email Test',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#0891b2;">🏥 MedSummary AI</h2>
        <p style="color:#334155;">Email integration is working correctly via <strong>Resend</strong>.</p>
        <p style="color:#64748b;font-size:13px;">API Key: ${process.env.RESEND_API_KEY?.slice(0, 10)}...</p>
      </div>
    `,
  });

  if (error) {
    console.error('❌ Email failed:', error);
    process.exit(1);
  }

  console.log('✅ Test email sent successfully!');
  console.log('   Email ID:', data?.id);
  console.log('\n🎉 Resend integration is working! Real emails will now be delivered.\n');
}

testEmail();
