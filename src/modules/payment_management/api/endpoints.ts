export const paymentEndpoints = {
  list: { method: 'GET', path: '/api/payments', handler: 'list' },
  create: { method: 'POST', path: '/api/payments', handler: 'create' },
  getById: { method: 'GET', path: '/api/payments/:id', handler: 'getById' },
  update: { method: 'PATCH', path: '/api/payments/:id', handler: 'update' },
  reverse: { method: 'POST', path: '/api/payments/:id/reverse', handler: 'reverse' },
  listMethods: { method: 'GET', path: '/api/payments/methods', handler: 'listMethods' },
  createMethod: { method: 'POST', path: '/api/payments/methods', handler: 'createMethod' },
  updateMethod: { method: 'PATCH', path: '/api/payments/methods/:id', handler: 'updateMethod' },
  deleteMethod: { method: 'DELETE', path: '/api/payments/methods/:id', handler: 'deleteMethod' },
  import: { method: 'POST', path: '/api/payments/import', handler: 'import' },
  export: { method: 'GET', path: '/api/payments/export', handler: 'export' },
};

