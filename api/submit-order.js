const { getService } = require('../server/order-runtime.cjs');
const { OrderError, publicStatus } = require('../server/order-service.cjs');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const order = await getService().submit(req.body);
    return res.status(order.sheetsDone ? 200 : 202).json(publicStatus(order));
  } catch (error) {
    if (error instanceof OrderError) return res.status(error.status).json({ error: error.message });
    console.error('Order submission temporarily unavailable');
    return res.status(503).json({ error: 'Не удалось подтвердить заказ. Проверяем его состояние; повторно создавать заказ не нужно.' });
  }
};
