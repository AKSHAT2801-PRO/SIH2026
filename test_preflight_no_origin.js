const http = require('http');

// Test preflight WITHOUT Origin header
const options = {
  hostname: 'localhost',
  port: 6005,
  path: '/auth/login',
  method: 'OPTIONS',
  headers: {
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
    // No Origin header
  }
};

console.log('=== Testing Preflight WITHOUT Origin header ===');
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