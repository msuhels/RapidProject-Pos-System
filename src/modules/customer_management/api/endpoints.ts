export const customerEndpoints = {
  list: { method: 'GET', path: '/api/customers', handler: 'list' },
  create: { method: 'POST', path: '/api/customers', handler: 'create' },
  getById: { method: 'GET', path: '/api/customers/:id', handler: 'getById' },
  update: { method: 'PATCH', path: '/api/customers/:id', handler: 'update' },
  delete: { method: 'DELETE', path: '/api/customers/:id', handler: 'delete' },
  import: { method: 'POST', path: '/api/customers/import', handler: 'import' },
  export: { method: 'GET', path: '/api/customers/export', handler: 'export' },
};

