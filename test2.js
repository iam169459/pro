const fs = require('fs');
const http = require('http');

const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const image = "data:image/png;base64," + base64Data;
const payload = JSON.stringify({ id: "test-real", image });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webcam',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (e) => {
  console.error(e);
});

req.write(payload);
req.end();
