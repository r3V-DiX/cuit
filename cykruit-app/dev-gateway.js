const http = require('http');

const PORT = 5000;
const TARGET_HOST = 'http://localhost:3000/api';

const server = http.createServer((req, res) => {
  // If request contains /auth/ (e.g. /auth/google/callback), redirect to Next.js API route /api/auth/...
  // Next.js will then proxy to NestJS auth-service (port 4001)
  const targetPath = req.url.startsWith('/auth') ? req.url : `/auth${req.url}`;
  const redirectUrl = `${TARGET_HOST}${targetPath}`;
  console.log(`[Dev-Gateway] Redirecting: ${req.url} -> ${redirectUrl}`);
  res.writeHead(302, { Location: redirectUrl });
  res.end();
});

server.listen(PORT, () => {
  console.log(`[Dev-Gateway] Listening on port ${PORT} and redirecting to ${TARGET_HOST}`);
});
