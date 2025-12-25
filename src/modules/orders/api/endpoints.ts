// API endpoint definitions for the orders module.

export const orderEndpoints = {
  list: { method: 'GET', path: '/api/orders', handler: 'list' },
  create: { method: 'POST', path: '/api/orders', handler: 'create' },
  getById: { method: 'GET', path: '/api/orders/:id', handler: 'getById' },
  update: { method: 'PATCH', path: '/api/orders/:id', handler: 'update' },
  delete: { method: 'DELETE', path: '/api/orders/:id', handler: 'delete' },
  duplicate: { method: 'POST', path: '/api/orders/:id/duplicate', handler: 'duplicate' },
  import: { method: 'POST', path: '/api/orders/import', handler: 'import' },
  export: { method: 'GET', path: '/api/orders/export', handler: 'export' },
};

