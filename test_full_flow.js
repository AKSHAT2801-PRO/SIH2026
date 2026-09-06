const http = require('http');

// Test 1: Register a user first
const registerData = JSON.stringify({
  email: 'testuser@test.com',
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

console.log('=== Testing Register ===');
const registerReq = http.request(registerOptions, (res) => {
  console.log(`Register Status: ${res.statusCode}`);
  console.log(`Register Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Register Response:', data);
    
    // Test 2: Login with the same user
    testLogin();
  });
});

registerReq.on('error', (e) => { console.error(`Register error: ${e.message}`); });
registerReq.write(registerData);
registerReq.end();

function testLogin() {
  const loginData = JSON.stringify({
    email: 'testuser@test.com',
    password: 'testpass123',
    role: 'government'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 6005,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData),
      'Cookie': 'ticket=dummy' // Test with cookie
    }
  };

  console.log('\n=== Testing Login ===');
  const loginReq = http.request(loginOptions, (res) => {
    console.log(`Login Status: ${res.statusCode}`);
    console.log(`Login Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('Login Response:', data);
      
      // Test 3: Login with credentials (to test cookie handling)
      testLoginWithCredentials();
    });
  });

  loginReq.on('error', (e) => { console.error(`Login error: ${e.message}`); });
  loginReq.write(loginData);
  loginReq.end();
}

function testLoginWithCredentials() {
  const loginData = JSON.stringify({
    email: 'testuser@test.com',
    password: 'testpass123',
    role: 'government'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 6005,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  console.log('\n=== Testing Login (no cookie) ===');
  const loginReq = http.request(loginOptions, (res) => {
    console.log(`Login Status: ${res.statusCode}`);
    console.log(`Login Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('Login Response:', data);
      console.log('\n=== All tests completed ===');
    });
  });

  loginReq.on('error', (e) => { console.error(`Login error: ${e.message}`); });
  loginReq.write(loginData);
  loginReq.end();
}