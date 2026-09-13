const http = require('node:http');

// CRA loads this file only in development. Never forwards to a production host.
module.exports = function setupProxy(app) {
  const port = Number(process.env.LOCAL_ORDER_API_PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return;
  app.use('/api', (req, res) => {
    const upstream = http.request({
      hostname: '127.0.0.1', port, path: req.originalUrl,
      method: req.method, headers: req.headers,
    }, (response) => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    });
    upstream.on('error', () => {
      if (!res.headersSent) res.status(502).json({ error: 'Локальный тестовый API недоступен.' });
      else res.end();
    });
    req.pipe(upstream);
  });
};
