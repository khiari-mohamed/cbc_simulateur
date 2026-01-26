const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gnet.tn',
  port: 25,
  secure: false,
  auth: {
    user: 'donotreply@arstunisie.tn',
    pass: 'NR*ars2025**##',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function testEmail() {
  try {
    console.log('🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    const testOTP = '123456';
    const testEmail = process.argv[2] || 'test@gmail.com';
    
    console.log(`📧 Sending test OTP to ${testEmail}...`);
    
    const mailOptions = {
      from: 'ARS Tunisia <donotreply@arstunisie.tn>',
      to: testEmail,
      subject: 'Code OTP - ARS Tunisia',
      text: `Votre code de verification OTP est: ${testOTP}\n\nCe code expire dans 10 minutes.\n\nARS Tunisia`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #003366; color: white; padding: 20px; text-align: center;">
            <h1>ARS Tunisia</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Code de vérification</h2>
            <div style="background: white; border: 2px solid #003366; padding: 20px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #003366; letter-spacing: 8px;">
                ${testOTP}
              </div>
            </div>
            <p>Ce code expire dans 10 minutes.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('✅ Accepted:', info.accepted);
    console.log('❌ Rejected:', info.rejected);
    console.log('\n⚠️ Check your Gmail inbox (and spam folder)');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
