// ============================================
// Email Configuration Test Script
// ============================================
// Run this to test your email setup before going live
// Usage: node test-email.js

const nodemailer = require('nodemailer');

// ============= CONFIGURE YOUR EMAIL HERE =============
const EMAIL_CONFIG = {
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',      // ← UPDATE THIS
    pass: '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'          // ← UPDATE THIS
  }
};

const TEST_RECIPIENT = 'roi@ai1team.com'; // ← UPDATE THIS

// ============================================

console.log('🔍 Testing Email Configuration...\n');

const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Test 1: Verify Connection
console.log('Test 1: Verifying SMTP connection...');
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Connection Failed!');
    console.log('Error:', error.message);
    console.log('\n📋 Troubleshooting:');
    console.log('1. Check your email and password are correct');
    console.log('2. If using Gmail, make sure you\'re using App Password (not regular password)');
    console.log('3. Enable "Less secure app access" or use App Passwords');
    console.log('4. Check your internet connection');
    process.exit(1);
  } else {
    console.log('✅ Connection Successful!\n');
    sendTestEmail();
  }
});

// Test 2: Send Test Email
function sendTestEmail() {
  console.log('Test 2: Sending test email...');
  
  const mailOptions = {
    from: `"AI1team Test" <${EMAIL_CONFIG.auth.user}>`,
    to: TEST_RECIPIENT,
    cc: 'roi@ai1team.com',
    subject: '✅ ROI+ Calculator - Email Test Successful',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0b3d91; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { background: #f9fafb; padding: 20px; margin-top: 20px; border-radius: 8px; }
          .success { color: #22c55e; font-size: 24px; font-weight: bold; }
          .info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #0b3d91; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Email Configuration Test</h1>
          </div>
          <div class="content">
            <p class="success">✅ SUCCESS!</p>
            <p>Your email configuration is working correctly.</p>
            
            <div class="info">
              <strong>Configuration Details:</strong><br>
              SMTP Host: ${EMAIL_CONFIG.host}<br>
              Port: ${EMAIL_CONFIG.port}<br>
              Sender: ${EMAIL_CONFIG.auth.user}<br>
              Timestamp: ${new Date().toISOString()}
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Deploy your backend server</li>
              <li>Update frontend with backend URL</li>
              <li>Test with a real ROI calculation</li>
            </ol>
            
            <p>Your ROI+ Calculator backend is ready to send professional reports! 🚀</p>
            
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              This is an automated test email from the AI1team ROI+ Calculator system.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('❌ Failed to send email!');
      console.log('Error:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', info.messageId);
      console.log('📬 Check your inbox at:', TEST_RECIPIENT);
      console.log('\n🎉 Email configuration is working perfectly!');
      console.log('\n📝 Next steps:');
      console.log('1. Update server.js with these email settings');
      console.log('2. Deploy your backend');
      console.log('3. Update frontend with backend URL');
      console.log('4. Test the full ROI calculation flow');
      process.exit(0);
    }
  });
}

// Test 3: Test with Sample Data (Optional)
function testFullFlow() {
  console.log('\nTest 3: Testing with sample ROI data...');
  
  const sampleData = {
    name: 'Test User',
    company: 'Test Company',
    email: TEST_RECIPIENT,
    rev: 1000000,
    inv: 200000,
    sku: 5000,
    oos: 5,
    over: 15,
    cogs: 50,
    mkt: 15,
    logi: 10,
    ops: 8
  };

  const healthScore = 75;
  const results = {
    aiSavings: 35000,
    roiEUR: 50000,
    roiPct: 5.0,
    monthlyFee: 4350,
    annualFee: 52200,
    inventoryToRevenue: 20.0
  };

  const mailOptions = {
    from: `"AI1team ROI+ Calculator" <${EMAIL_CONFIG.auth.user}>`,
    to: sampleData.email,
    cc: 'roi@ai1team.com',
    subject: 'Your ROI+™ Test Report - AI1team',
    html: `
      <h1>Test ROI+ Report</h1>
      <p>Dear ${sampleData.name},</p>
      <p>This is a test of the full ROI+ Calculator flow.</p>
      <h2>Results:</h2>
      <ul>
        <li>Health Score: ${healthScore}</li>
        <li>ROI: €${results.roiEUR.toLocaleString('de-DE')} (${results.roiPct}%)</li>
        <li>AI Savings: €${results.aiSavings.toLocaleString('de-DE')}</li>
      </ul>
      <p>In production, this would include a 5-page PDF report.</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('❌ Failed to send test report!');
      console.log('Error:', error.message);
    } else {
      console.log('✅ Test report sent successfully!');
      console.log('📧 Message ID:', info.messageId);
    }
  });
}

// Catch any unhandled errors
process.on('uncaughtException', (error) => {
  console.log('\n❌ Unexpected Error:');
  console.log(error.message);
  console.log('\nPlease check your configuration and try again.');
  process.exit(1);
});
