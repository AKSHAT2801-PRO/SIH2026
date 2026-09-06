const http = require('http');

// Test register with a unique email
const registerData = JSON.stringify({
  email: 'newuser' + Date.now() + '@test.com',
  password: 'testpass123',
  role: 'government'
});

const registerOptions = {
  hostname: 'localhost',
  port: 6005,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(registerData)
  }
};

console.log('=== Testing Register with unique email ===');
const registerReq = http.request(registerOptions, (res) => {
  console.log(`Register Status: ${res.statusCode}`);
  console.log(`Register Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Register Response:', data);
  });
});

registerReq.on('error', (e) => { console.error(`Register error: ${e.message}`); });
registerReq.write(registerData);
registerReq.end();