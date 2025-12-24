// API endpoint definitions for the static (non-custom-fields) template module.

export const staticTemplateEndpoints = {
  list: { method: 'GET', path: '/api/_templates/static', handler: 'list' },
  create: { method: 'POST', path: '/api/_templates/static', handler: 'create' },
  getById: { method: 'GET', path: '/api/_templates/static/:id', handler: 'getById' },
  update: { method: 'PATCH', path: '/api/_templates/static/:id', handler: 'update' },
  delete: { method: 'DELETE', path: '/api/_templates/static/:id', handler: 'delete' },
};


