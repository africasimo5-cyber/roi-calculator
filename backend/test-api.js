// ============================================
// API Testing Script for ROI+ Calculator
// ============================================
// Tests the /api/roi/submit endpoint
// Usage: node test-api.js

const https = require('https');
const http = require('http');

// ============= CONFIGURATION =============
const CONFIG = {
  // Update this with your backend URL
  // backendUrl: 'http://127.0.0.1:5500/api/roi/submit',  // For local testing
  backendUrl: 'https://roi-calculator-p5la.onrender.com/api/roi/submit',  // For production
  
  // Update with your test email
  testEmail: 'roi@ai1team.com'
};

// ============= TEST DATA =============
const testData = {
  name: 'Test User',
  company: 'Test Company Ltd',
  email: CONFIG.testEmail,
  rev: 1000000,
  inv: 200000,
  sku: 5000,
  oos: 5,
  over: 15,
  cogs: 50,
  mkt: 15,
  logi: 10,
  ops: 8,
  warehouses: 2,
  channels: 3,
  accuracy: 85
};

// ============= HELPER FUNCTIONS =============
function parseUrl(urlString) {
  const url = new URL(urlString);
  return {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname
  };
}

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = parseUrl(url);
    const httpModule = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(data))
      }
    };

    const req = httpModule.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(body);
          resolve({ statusCode: res.statusCode, body: jsonResponse });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

// ============= TEST SUITE =============
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 ROI+ Calculator API Test Suite');
  console.log('='.repeat(60));
  console.log(`\n📡 Testing endpoint: ${CONFIG.backendUrl}`);
  console.log(`📧 Test email: ${CONFIG.testEmail}\n`);

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Valid submission
  console.log('Test 1: Valid ROI calculation submission');
  console.log('-'.repeat(60));
  totalTests++;
  try {
    const response = await makeRequest(CONFIG.backendUrl, testData);
    
    if (response.statusCode === 200 && response.body.success) {
      console.log('✅ PASS - Valid submission accepted');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Health Score: ${response.body.data.healthScore}`);
      console.log(`   ROI: €${response.body.data.results.roiEUR.toLocaleString('de-DE')}`);
      console.log(`   ROI %: ${response.body.data.results.roiPct}%`);
      console.log(`   Processing Time: ${response.body.processingTime}`);
      console.log(`\n   📧 Check ${CONFIG.testEmail} for the PDF report!\n`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Unexpected response');
      console.log('   Response:', JSON.stringify(response.body, null, 2));
    }
  } catch (error) {
    console.log('❌ FAIL - Request error');
    console.log('   Error:', error.message);
  }

  // Test 2: Missing required field
  console.log('\nTest 2: Missing required field (should fail)');
  console.log('-'.repeat(60));
  totalTests++;
  try {
    const invalidData = { ...testData };
    delete invalidData.email;
    
    const response = await makeRequest(CONFIG.backendUrl, invalidData);
    
    if (response.statusCode === 400) {
      console.log('✅ PASS - Correctly rejected missing field');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Message: ${response.body.message}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Should have rejected missing field');
      console.log('   Response:', JSON.stringify(response.body, null, 2));
    }
  } catch (error) {
    console.log('❌ FAIL - Request error');
    console.log('   Error:', error.message);
  }

  // Test 3: Invalid email format
  console.log('\nTest 3: Invalid email format (should fail)');
  console.log('-'.repeat(60));
  totalTests++;
  try {
    const invalidData = { ...testData, email: 'not-an-email' };
    
    const response = await makeRequest(CONFIG.backendUrl, invalidData);
    
    if (response.statusCode === 400) {
      console.log('✅ PASS - Correctly rejected invalid email');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Message: ${response.body.message}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Should have rejected invalid email');
      console.log('   Response:', JSON.stringify(response.body, null, 2));
    }
  } catch (error) {
    console.log('❌ FAIL - Request error');
    console.log('   Error:', error.message);
  }

  // Test 4: Invalid numeric value
  console.log('\nTest 4: Invalid numeric value (should fail)');
  console.log('-'.repeat(60));
  totalTests++;
  try {
    const invalidData = { ...testData, rev: -1000 };
    
    const response = await makeRequest(CONFIG.backendUrl, invalidData);
    
    if (response.statusCode === 400) {
      console.log('✅ PASS - Correctly rejected negative value');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Message: ${response.body.message}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Should have rejected negative value');
      console.log('   Response:', JSON.stringify(response.body, null, 2));
    }
  } catch (error) {
    console.log('❌ FAIL - Request error');
    console.log('   Error:', error.message);
  }

  // Test 5: Edge case - Zero values
  console.log('\nTest 5: Edge case with minimal values');
  console.log('-'.repeat(60));
  totalTests++;
  try {
    const edgeData = {
      ...testData,
      rev: 100000,
      inv: 10000,
      sku: 100,
      warehouses: 1,
      channels: 1
    };
    
    const response = await makeRequest(CONFIG.backendUrl, edgeData);
    
    if (response.statusCode === 200 && response.body.success) {
      console.log('✅ PASS - Edge case handled correctly');
      console.log(`   Health Score: ${response.body.data.healthScore}`);
      console.log(`   Monthly Fee: €${response.body.data.results.monthlyFee.toLocaleString('de-DE')}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Edge case not handled');
      console.log('   Response:', JSON.stringify(response.body, null, 2));
    }
  } catch (error) {
    console.log('❌ FAIL - Request error');
    console.log('   Error:', error.message);
  }

  // Test Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${totalTests - passedTests} ❌`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log('='.repeat(60));

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Your API is working correctly.');
    console.log('\n📧 Check your email for the test PDF report.');
    console.log('\n✅ Ready to go live!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    console.log('\n🔍 Troubleshooting tips:');
    console.log('   1. Make sure your backend server is running');
    console.log('   2. Check the backend URL is correct');
    console.log('   3. Verify email configuration in .env');
    console.log('   4. Check server logs for errors\n');
  }
}

// ============= HEALTH CHECK =============
async function checkHealth() {
  console.log('🏥 Checking backend health...');
  try {
    const healthUrl = CONFIG.backendUrl.replace('/api/roi/submit', '/health');
    const response = await makeRequest(healthUrl, {});
    
    if (response.statusCode === 200) {
      console.log('✅ Backend is healthy');
      console.log('   Response:', JSON.stringify(response.body, null, 2));
      return true;
    } else {
      console.log('⚠️  Backend health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend');
    console.log('   Error:', error.message);
    console.log('\n💡 Make sure your backend server is running:');
    console.log('   npm start\n');
    return false;
  }
}

// ============= MAIN EXECUTION =============
async function main() {
  console.log('\n🚀 Starting API tests...\n');
  
  // Check health first
  const healthy = await checkHealth();
  
  if (!healthy) {
    console.log('\n❌ Backend is not accessible. Please start the server first.\n');
    process.exit(1);
  }
  
  console.log('');
  
  // Run all tests
  await runTests();
}

// Run the tests
main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});