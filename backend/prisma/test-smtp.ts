import * as nodemailer from 'nodemailer';

async function testSMTP() {
  console.log('🔍 Testing SMTP connection...\n');
  
  const transporter = nodemailer.createTransport({
    host: '197.14.56.80',
    port: 587,
    secure: false,
    auth: {
      user: 'ARSMAIL.arstunisie.com',
      pass: 'Ars*2025*++',
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
    
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: 'ARS Tunisia <donotreply@arstunisie.com>',
      to: 'khiarim725@gmail.com',
      subject: 'Test SMTP - ARS',
      text: 'This is a test email from ARS backend.',
      html: '<p>This is a test email from ARS backend.</p>',
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    console.error('Full error:', error);
  }
}

testSMTP();
