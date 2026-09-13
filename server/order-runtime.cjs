const { createOrderService } = require('./order-service.cjs');
const { createIntegrations } = require('./order-integrations.cjs');
let service;
function getService() {
  if (!service) {
    service = createOrderService({ ...createIntegrations(),
      catalog: require('../src/data/catalog.generated.json') });
  }
  return service;
}
module.exports = { getService };
