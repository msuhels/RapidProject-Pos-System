// API endpoint definitions for the carts module.

export const cartEndpoints = {
  list: { method: 'GET', path: '/api/carts', handler: 'list' },
  create: { method: 'POST', path: '/api/carts', handler: 'create' },
  getById: { method: 'GET', path: '/api/carts/:id', handler: 'getById' },
  update: { method: 'PATCH', path: '/api/carts/:id', handler: 'update' },
  delete: { method: 'DELETE', path: '/api/carts/:id', handler: 'delete' },
  duplicate: { method: 'POST', path: '/api/carts/:id/duplicate', handler: 'duplicate' },
  import: { method: 'POST', path: '/api/carts/import', handler: 'import' },
  export: { method: 'GET', path: '/api/carts/export', handler: 'export' },
};

