const path = require('node:path');
const { spawn } = require('node:child_process');
const { createLocalOrdersApp } = require('./local-orders.cjs');

const root = path.resolve(__dirname, '..');
const directory = path.join(root, '.local-test-orders');
let frontend;
const api = createLocalOrdersApp(directory).listen(0, '127.0.0.1', () => {
  console.log(`ТЕСТОВЫЙ РЕЖИМ: заказы записываются только в ${directory}`);
  console.log('Telegram и Google Sheets не подключаются. Открыть: http://localhost:3000');
  frontend = spawn(process.execPath, [require.resolve('react-scripts/scripts/start')], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: '3000',
      BROWSER: 'none',
      LOCAL_ORDER_API_PORT: String(api.address().port),
      REACT_APP_LOCAL_ORDER_TEST: 'true',
    },
  });
  frontend.on('error', (error) => {
    console.error(error.message);
    api.close(() => process.exit(1));
  });
  frontend.on('exit', (code) => api.close(() => process.exit(code || 0)));
});
api.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (frontend) frontend.kill(signal);
    api.close();
  });
}
