// API endpoint definitions for the inventory module.

export const inventoryEndpoints = {
  list: { method: 'GET', path: '/api/inventory', handler: 'list' },
  getById: { method: 'GET', path: '/api/inventory/:id', handler: 'getById' },
  update: { method: 'PATCH', path: '/api/inventory/:id', handler: 'update' },
  delete: { method: 'DELETE', path: '/api/inventory/:id', handler: 'delete' },
  duplicate: { method: 'POST', path: '/api/inventory/:id/duplicate', handler: 'duplicate' },
  import: { method: 'POST', path: '/api/inventory/import', handler: 'import' },
  export: { method: 'GET', path: '/api/inventory/export', handler: 'export' },
};


