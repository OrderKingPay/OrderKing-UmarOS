const http = require('http');

const ports = [8081, 8082, 8083, 8084];

ports.forEach(port => {
  const req = http.get(`http://localhost:${port}`, (res) => {
    console.log(`Port ${port}: HTTP ${res.statusCode} OK`);
  });
  req.on('error', (err) => {
    console.log(`Port ${port}: ERROR ${err.message}`);
  });
  req.setTimeout(2000, () => {
    req.destroy();
    console.log(`Port ${port}: TIMEOUT`);
  });
});
