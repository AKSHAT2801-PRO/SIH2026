const http = require('http');

// Test preflight for wrong path
const options = {
  hostname: 'localhost',
  port: 6005,
  path: '/api/auth/login',  // Wrong path - has /api prefix
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:5173',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
  }
};

console.log('=== Testing Preflight for WRONG path /api/auth/login ===');
const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response body:', data);
  });
});

req.on('error', (e) => { console.error(`Error: ${e.message}`); });
req.end();