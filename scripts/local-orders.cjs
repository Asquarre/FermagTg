// Deliberately independent of api/submit-order.js: no external clients or credentials.
const express = require('express');
const { mkdir, writeFile, readFile } = require('node:fs/promises');
const path = require('node:path');
const { validId } = require('../server/order-service.cjs');

function createLocalOrdersApp(directory) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.post('/api/submit-order', async (req, res) => {
    const { items } = req.body || {};
    if (!validId(req.body?.orderId) || !Array.isArray(items) || !items.length || items.some((item) =>
      !item || typeof item.id !== 'string' || !item.id ||
      !Number.isFinite(item.quantity) || item.quantity <= 0 ||
      !Number.isFinite(item.price) || item.price < 0
    )) {
      return res.status(400).json({ error: 'Некорректный или пустой тестовый заказ.' });
    }
    try {
      const id = req.body.orderId;
      const order = {
        ...req.body,
        testMode: true,
        orderId: id,
        receivedAt: new Date().toISOString(),
        total: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
        delivery: { telegram: 'not_sent', googleSheets: 'not_sent' },
      };
      await mkdir(directory, { recursive: true });
      try {
        await writeFile(path.join(directory, `${id}.json`), JSON.stringify(order, null, 2) + '\n', { flag: 'wx' });
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
      console.log(`Тестовый заказ ${id} сохранён локально. Telegram и Google Sheets: не отправлено.`);
      return res.json({ status: 'confirmed', message: 'Тестовый заказ сохранён локально.', testMode: true, orderId: id });
    } catch (error) {
      console.error('Не удалось сохранить тестовый заказ:', error.message);
      return res.status(500).json({ error: 'Не удалось сохранить тестовый заказ.' });
    }
  });
  app.get('/api/order-status', async (req, res) => {
    if (!validId(req.query.orderId)) return res.status(400).json({ error: 'Invalid order id' });
    try {
      await readFile(path.join(directory, `${req.query.orderId}.json`), 'utf8');
      return res.json({ status: 'confirmed', testMode: true, orderId: req.query.orderId });
    } catch (error) {
      return res.status(error.code === 'ENOENT' ? 404 : 503).json({ status: 'not_found' });
    }
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown local API route' }));
  return app;
}

module.exports = { createLocalOrdersApp };
