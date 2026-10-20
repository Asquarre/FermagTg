module.exports = (req, res) => require('../server/catalog-runtime.cjs').getHandlers().upload(req, res);
