const http = require('http');

// Test with credentials (like the frontend does)
const loginData = JSON.stringify({
  email: 'testuser@test.com',
  password: 'testpass123',
  role: 'government'
});

const options = {
  hostname: 'localhost',
  port: 6005,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData),
    'Origin': 'http://localhost:5173',
    'Cookie': 'ticket=somecookie'
  }
};

console.log('=== Testing Login with Origin header and Cookie ===');
const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => { console.error(`Error: ${e.message}`); });
req.write(loginData);
req.end();