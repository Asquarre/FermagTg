const { getService } = require('../server/order-runtime.cjs');
const { validId, publicStatus } = require('../server/order-service.cjs');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = req.query.orderId;
  if (!validId(id)) return res.status(400).json({ error: 'Некорректный номер запроса.' });
  try {
    // UUID is an unguessable capability; response deliberately contains no personal data.
    const order = await getService().find(id);
    if (!order) return res.status(404).json({ status: 'not_found' });
    return res.status(200).json(publicStatus(order));
  } catch {
    return res.status(503).json({ error: 'Проверяем состояние заказа. Повторите проверку позже.' });
  }
};
