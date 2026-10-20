const { createOrderService } = require('./order-service.cjs');
const { createIntegrations } = require('./order-integrations.cjs');
const { getCatalog } = require('./catalog-runtime.cjs');
let service;
function getService() {
  if (!service) {
    service = createOrderService({ ...createIntegrations(),
      catalog: getCatalog });
  }
  return service;
}
module.exports = { getService };
