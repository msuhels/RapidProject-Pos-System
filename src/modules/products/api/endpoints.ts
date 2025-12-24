// API endpoint definitions for the products module.

export const productEndpoints = {
  list: { method: 'GET', path: '/api/products', handler: 'list' },
  create: { method: 'POST', path: '/api/products', handler: 'create' },
  getById: { method: 'GET', path: '/api/products/:id', handler: 'getById' },
  update: { method: 'PATCH', path: '/api/products/:id', handler: 'update' },
  delete: { method: 'DELETE', path: '/api/products/:id', handler: 'delete' },
  duplicate: { method: 'POST', path: '/api/products/:id/duplicate', handler: 'duplicate' },
  import: { method: 'POST', path: '/api/products/import', handler: 'import' },
  export: { method: 'GET', path: '/api/products/export', handler: 'export' },
};

