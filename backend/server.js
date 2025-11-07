// ============================================
// ROI+ Calculator Backend - Enhanced Version
// ============================================
// Install: npm install express cors nodemailer pdfkit dotenv

/* require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; */

// ============= MIDDLEWARE =============
/* app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json()); */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* // ============= MIDDLEWARE =============
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));

app.use(express.json()); */

// ============= MIDDLEWARE =============
// Use environment variable for allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://127.0.0.1:5500', 'http://localhost:5500'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());



// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============= EMAIL CONFIGURATION =============
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify email configuration on startup
emailTransporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error.message);
    console.error('Please check your EMAIL_USER and EMAIL_PASS in .env file');
  } else {
    console.log('✅ Email transporter ready');
  }
});

// ============= CONFIGURATION =============
const CONFIG = {
  companyName: process.env.COMPANY_NAME || 'AI1team',
  companyEmail: process.env.COMPANY_EMAIL || 'roi@ai1team.com',
  companyWebsite: process.env.COMPANY_WEBSITE || 'https://ai1team.com',
  thankYouUrl: process.env.THANK_YOU_URL || 'https://ai1team.com/thankyou.html',
  pdfStoragePath: process.env.PDF_STORAGE_PATH || path.join(__dirname, 'pdfs'),
  pdfCleanupDelay: parseInt(process.env.PDF_CLEANUP_DELAY) || 60000
};

// Create PDF directory if it doesn't exist
if (!fs.existsSync(CONFIG.pdfStoragePath)) {
  fs.mkdirSync(CONFIG.pdfStoragePath, { recursive: true });
}

// ============= HEALTH SCORE CALCULATION =============
function calculateHealthScore(data) {
  const { rev, inv, over, oos, cogs, mkt, logi, ops } = data;
  
  if (rev === 0) return 0;

  let score = 100;
  
  // Inventory-to-Revenue penalty (max 40 points)
  score -= Math.min(40, (inv / rev) * 140);
  
  // Overstock penalty (max 20 points)
  score -= Math.min(20, over * 0.9);
  
  // Out-of-stock penalty (max 15 points)
  score -= Math.min(15, oos * 1.0);
  
  // High cost structure penalties
  const totalCosts = cogs + mkt + logi + ops;
  if (totalCosts > 85) score -= 10;
  if (totalCosts > 95) score -= 8;

  // Clamp between 1 and 99
  return Math.max(1, Math.min(99, Math.round(score)));
}

// ============= ROI CALCULATION =============
function calculateROI(data) {
  const { rev, inv, over, oos, sku, warehouses, channels } = data;

  // Original AI savings
  const overstockLoss = inv * (over / 100);
  const oosLoss = rev * (oos / 100);
  const aiSavings = (overstockLoss * 0.30) + (oosLoss * 0.40);

  // New ROI+ calculation (as per client requirements)
  const base = rev * 0.02;
  const inventoryGain = inv * 0.10;
  const costGain = rev * 0.01;
  const roiEUR = base + inventoryGain + costGain;
  const roiPct = (roiEUR / rev) * 100;

  // Fee calculation
  let fee = 1000 + (300 * warehouses) + (200 * channels) + (150 * (sku / 1000));
  if (fee < 3000) fee = 3000;

  const monthlyFee = Math.round(fee);
  const annualFee = Math.round(fee * 12);

  // Calculate dead stock
  const deadStock = Math.round(inv * (over / 100));

  return {
    aiSavings: Math.round(aiSavings),
    roiEUR: Math.round(roiEUR),
    roiPct: Math.round(roiPct * 100) / 100,
    monthlyFee,
    annualFee,
    inventoryToRevenue: Math.round((inv / rev) * 100 * 100) / 100,
    deadStock
  };
}

// ============= HEALTH SCORE BAND =============
function getHealthBand(score) {
  if (score >= 80) return { band: 'Excellent', color: '#22c55e', description: 'Your inventory health is exceptional' };
  if (score >= 60) return { band: 'Good', color: '#3b82f6', description: 'Solid performance with room for optimization' };
  if (score >= 40) return { band: 'Fair', color: '#f59e0b', description: 'Significant improvement opportunities exist' };
  return { band: 'Needs Improvement', color: '#ef4444', description: 'Critical optimization required' };
}

// ============= PDF GENERATION =============
function generatePDF(data, results, healthScore, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    
    doc.pipe(stream);

    const healthBand = getHealthBand(healthScore);
    const formatCurrency = (num) => num.toLocaleString('de-DE');
    const formatPercent = (num) => `${num.toFixed(2)}%`;

    // ======== PAGE 1: SUMMARY ========
    doc.fontSize(28).fillColor('#0b3d91').text('ROI+ Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#666').text(CONFIG.companyName, { align: 'center' });
    doc.fontSize(10).fillColor('#999').text('AI rešenja za pametniji e-commerce', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(13).fillColor('#000').text(`${data.name}`, 70);
    doc.fontSize(20).fillColor('#0b3d91').text(`${data.company}`, 70);
    doc.fontSize(11).fillColor('#666').text(`${data.email}`, 70);
    doc.moveDown(2);

    doc.fontSize(18).fillColor('#0b3d91').text('Health Score Analysis', 50);
    doc.fontSize(52).fillColor(healthBand.color).text(`${healthScore}`, 70);
    doc.fontSize(18).fillColor('#666').text(healthBand.band, 200, doc.y - 40);
    doc.moveDown(2);

    doc.fontSize(16).fillColor('#0b3d91').text('Key Input Values', 50);
    doc.fontSize(10).fillColor('#333');
    doc.text(`Annual Revenue: €${formatCurrency(data.rev)}`);
    doc.text(`Inventory Value: €${formatCurrency(data.inv)}`);
    doc.text(`SKU Count: ${formatCurrency(data.sku)}`);
    doc.text(`Overstock: ${data.over}% | Out-of-Stock: ${data.oos}%`);

    // ======== PAGE 2: FINANCIAL ========
    doc.addPage();
    doc.fontSize(26).fillColor('#0b3d91').text('Financial Impact Analysis', 50);
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#666').text('Estimated Annual ROI+ Effect');
    doc.fontSize(36).fillColor('#0b3d91').text(`€${formatCurrency(results.roiEUR)}`);
    doc.fontSize(18).fillColor('#22c55e').text(`${formatPercent(results.roiPct)} of Revenue`);
    doc.moveDown(2);

    doc.fontSize(16).fillColor('#0b3d91').text('Key Metrics', 50);
    doc.fontSize(11).fillColor('#333');
    doc.text(`Inventory-to-Revenue Ratio: ${formatPercent(results.inventoryToRevenue)}`);
    doc.text(`AI Savings Potential: €${formatCurrency(results.aiSavings)}/year`);
    doc.text(`Dead Stock: €${formatCurrency(results.deadStock)}`);
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#0b3d91').text('Investment', 50);
    doc.fontSize(11).fillColor('#333');
    doc.text(`Monthly: €${formatCurrency(results.monthlyFee)}`);
    doc.text(`Annual: €${formatCurrency(results.annualFee)}`);

    // ======== PAGE 3: DIAGNOSTICS ========
    doc.addPage();
    doc.fontSize(26).fillColor('#0b3d91').text('Diagnostic Analysis', 50);
    doc.moveDown(1);

    doc.fontSize(16).fillColor('#0b3d91').text('Overstock Signal', 50);
    doc.fontSize(11).fillColor('#333');
    doc.text(`Current: ${data.over}%`);
    doc.text(`Impact: €${formatCurrency(results.deadStock)} tied up`);
    doc.moveDown(1);

    doc.fontSize(16).fillColor('#0b3d91').text('Out-of-Stock Signal', 50);
    doc.fontSize(11).fillColor('#333');
    doc.text(`Current: ${data.oos}%`);
    doc.text(`Lost Revenue: €${formatCurrency(Math.round(data.rev * (data.oos / 100)))}/year`);
    doc.moveDown(1);

    doc.fontSize(16).fillColor('#0b3d91').text('Cost Structure', 50);
    doc.fontSize(11).fillColor('#333');
    doc.text(`COGS: ${data.cogs}% | Marketing: ${data.mkt}%`);
    doc.text(`Logistics: ${data.logi}% | Operations: ${data.ops}%`);

    // ======== PAGE 4: ACTION PLAN ========
    doc.addPage();
    doc.fontSize(26).fillColor('#0b3d91').text('90-Day Action Plan', 50);
    doc.moveDown(1);

    doc.fontSize(15).fillColor('#0b3d91').text('Days 1-30: Foundation', 50);
    doc.fontSize(10).fillColor('#333');
    doc.text('• Data integration and analysis');
    doc.text('• AI model training');
    doc.text('• Baseline metrics setup');
    doc.moveDown(1);

    doc.fontSize(15).fillColor('#0b3d91').text('Days 31-60: Optimization', 50);
    doc.fontSize(10).fillColor('#333');
    doc.text('• Deploy predictive recommendations');
    doc.text('• Automated reorder points');
    doc.text('• Multi-channel balancing');
    doc.moveDown(1);

    doc.fontSize(15).fillColor('#0b3d91').text('Days 61-90: Scale', 50);
    doc.fontSize(10).fillColor('#333');
    doc.text('• Full AI autopilot');
    doc.text('• Performance review');
    doc.text('• ROI measurement');

    // ======== PAGE 5: NEXT STEPS ========
    doc.addPage();
    doc.fontSize(26).fillColor('#0b3d91').text('Next Steps', 50);
    doc.moveDown(1);

    doc.fontSize(17).fillColor('#0b3d91').text('1. Strategy Call', 50);
    doc.fontSize(11).fillColor('#333');
    doc.text('Schedule a 30-minute session with our AI experts');
    doc.text('📧 Contact: roi@ai1team.com');
    doc.moveDown(2);

    doc.fontSize(17).fillColor('#0b3d91').text('2. Proof of Concept', 50);
    doc.fontSize(11).fillColor('#333');
    doc.text('Begin with a 30-day pilot program');
    doc.text('• Limited scope implementation');
    doc.text('• Real-time tracking');
    doc.text('• No long-term commitment');
    doc.moveDown(2);

    doc.fontSize(20).fillColor('#0b3d91').text('Ready to Get Started?', 70);
    doc.fontSize(12).fillColor('#333');
    doc.text('📧 Email: roi@ai1team.com');
    doc.text('🌐 Visit: www.ai1team.com');

    doc.fontSize(9).fillColor('#999').text(`${CONFIG.companyName} © 2025 — Beograd`, 50, 750, { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

// ============= SEND EMAIL WITH PDF =============
async function sendEmailWithPDF(customerEmail, pdfPath, data, results, healthScore) {
  const healthBand = getHealthBand(healthScore);
  
  const mailOptions = {
    from: `"${CONFIG.companyName} ROI+ Calculator" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    cc: CONFIG.companyEmail,
    subject: `Your ROI+™ Report is Ready — ${CONFIG.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0b3d91; color: white; padding: 30px; text-align: center; border-radius: 8px; }
          .content { background: #f9fafb; padding: 30px; margin-top: 20px; border-radius: 8px; }
          .score { font-size: 48px; font-weight: bold; color: ${healthBand.color}; }
          .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
          .button { background: #d4af37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your ROI+ Report is Ready!</h1>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.name}</strong>,</p>
            
            <p>Thank you for using the ${CONFIG.companyName} ROI+ Calculator. Your comprehensive 5-page report is attached.</p>
            
            <div style="text-align: center; background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="color: #666; font-size: 14px;">YOUR HEALTH SCORE</div>
              <div class="score">${healthScore}</div>
              <div style="color: #666; font-size: 16px;">${healthBand.band}</div>
            </div>
            
            <div class="metric">
              <strong>Estimated Annual ROI+:</strong> €${results.roiEUR.toLocaleString('de-DE')} (${results.roiPct.toFixed(2)}%)
            </div>
            
            <div class="metric">
              <strong>AI Savings Potential:</strong> €${results.aiSavings.toLocaleString('de-DE')}
            </div>
            
            <div class="metric">
              <strong>Dead Stock Identified:</strong> €${results.deadStock.toLocaleString('de-DE')}
            </div>
            
            <p><strong>What's in your report:</strong></p>
            <ul>
              <li>Health Score analysis</li>
              <li>Financial impact projections</li>
              <li>Diagnostic insights</li>
              <li>90-day action plan</li>
              <li>Next steps</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="mailto:${CONFIG.companyEmail}" class="button">📅 Schedule Strategy Call</a>
            </div>
            
            <p>Questions? Reply to this email or contact us at <a href="mailto:${CONFIG.companyEmail}">${CONFIG.companyEmail}</a></p>
            
            <p>Best regards,<br><strong>${CONFIG.companyName} Team</strong></p>
          </div>
          
          <div class="footer">
            <p>${CONFIG.companyName} © 2025 — Beograd<br>
            <a href="${CONFIG.companyWebsite}">${CONFIG.companyWebsite}</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `ROIplus_Report_${data.company.replace(/\s+/g, '_')}.pdf`,
        path: pdfPath
      }
    ]
  };

  await emailTransporter.sendMail(mailOptions);
  console.log(`✅ Email sent to ${customerEmail} with PDF report`);
}

// ============= MAIN API ENDPOINT =============
app.post('/api/roi/submit', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const data = req.body;

    // Validate required fields
    const requiredFields = ['name', 'company', 'email', 'rev', 'inv', 'sku', 'oos', 'over', 'cogs', 'mkt', 'logi', 'ops'];
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: true, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return res.status(400).json({ 
        error: true, 
        message: 'Invalid email format' 
      });
    }

    console.log(`\n📊 Processing ROI submission for ${data.company}...`);

    // Calculate Health Score
    const healthScore = calculateHealthScore(data);
    console.log(`✓ Health Score calculated: ${healthScore}`);

    // Calculate ROI
    const results = calculateROI(data);
    console.log(`✓ ROI calculated: €${results.roiEUR.toLocaleString('de-DE')}`);

    // Generate PDF
    const pdfFilename = `ROIplus_Report_${data.company.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const pdfPath = path.join(CONFIG.pdfStoragePath, pdfFilename);
    
    console.log('✓ Generating PDF report...');
    await generatePDF(data, results, healthScore, pdfPath);
    console.log(`✓ PDF generated`);

    // Send Email
    console.log('✓ Sending email...');
    await sendEmailWithPDF(data.email, pdfPath, data, results, healthScore);
    console.log('✓ Email sent successfully');

    // Clean up PDF
    setTimeout(() => {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        console.log(`✓ Cleaned up PDF`);
      }
    }, CONFIG.pdfCleanupDelay);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Request completed in ${processingTime}ms\n`);

    res.json({
      success: true,
      message: 'ROI+ report generated and sent successfully',
      data: {
        healthScore,
        healthBand: getHealthBand(healthScore).band,
        results
      },
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============= HEALTH CHECK =============
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// ============= START SERVER =============
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 ${CONFIG.companyName} ROI+ Calculator Backend`);
  console.log('='.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER || 'NOT CONFIGURED'}`);
  console.log('='.repeat(60) + '\n');
});

module.exports = app;