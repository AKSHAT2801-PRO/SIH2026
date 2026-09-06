const http = require('http');
const http2 = require('http2');

// Simulate the exact frontend flow:
// 1. Preflight OPTIONS
// 2. Actual POST with credentials: include

const loginData = JSON.stringify({
  role: 'government',
  email: 'test@test.com',
  password: 'testpass'
});

console.log('=== Step 1: Preflight OPTIONS ===');
const preflightOptions = {
  hostname: 'localhost',
  port: 6005,
  path: '/auth/login',
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:5173',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
  }
};

const preflightReq = http.request(preflightOptions, (res) => {
  console.log(`Preflight Status: ${res.statusCode}`);
  console.log(`Preflight CORS Headers:`);
  console.log(`  access-control-allow-origin: ${res.headers['access-control-allow-origin']}`);
  console.log(`  access-control-allow-credentials: ${res.headers['access-control-allow-credentials']}`);
  console.log(`  access-control-allow-methods: ${res.headers['access-control-allow-methods']}`);
  console.log(`  access-control-allow-headers: ${res.headers['access-control-allow-headers']}`);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('');
    console.log('=== Step 2: Actual POST with credentials ===');
    testActualRequest();
  });
});

preflightReq.on('error', (e) => { console.error(`Preflight error: ${e.message}`); });
preflightReq.end();

function testActualRequest() {
  const postOptions = {
    hostname: 'localhost',
    port: 6005,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData),
      'Origin': 'http://localhost:5173',
      'Cookie': 'ticket=dummy'  // Simulate credentials: include
    }
  };

  const postReq = http.request(postOptions, (res) => {
    console.log(`POST Status: ${res.statusCode}`);
    console.log(`POST CORS Headers:`);
    console.log(`  access-control-allow-origin: ${res.headers['access-control-allow-origin']}`);
    console.log(`  access-control-allow-credentials: ${res.headers['access-control-allow-credentials']}`);
    console.log(`  set-cookie: ${res.headers['set-cookie']}`);
    
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`POST Response: ${data}`);
    });
  });

  postReq.on('error', (e) => { console.error(`POST error: ${e.message}`); });
  postReq.write(loginData);
  postReq.end();
}