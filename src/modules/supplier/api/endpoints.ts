export const supplierEndpoints = {
  list: { method: 'GET', path: '/api/suppliers', handler: 'list' },
  create: { method: 'POST', path: '/api/suppliers', handler: 'create' },
  getById: { method: 'GET', path: '/api/suppliers/:id', handler: 'getById' },
  update: { method: 'PATCH', path: '/api/suppliers/:id', handler: 'update' },
  delete: { method: 'DELETE', path: '/api/suppliers/:id', handler: 'delete' },
};

