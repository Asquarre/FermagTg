module.exports = (req, res) => require('../server/catalog-runtime.cjs').getHandlers().read(req, res);
