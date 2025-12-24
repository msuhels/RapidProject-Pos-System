// API endpoint definitions for the custom-fields-enabled template module.

export const customTemplateEndpoints = {
  list: { method: 'GET', path: '/api/_templates/custom', handler: 'list' },
  create: { method: 'POST', path: '/api/_templates/custom', handler: 'create' },
  getById: { method: 'GET', path: '/api/_templates/custom/:id', handler: 'getById' },
  update: { method: 'PATCH', path: '/api/_templates/custom/:id', handler: 'update' },
  delete: { method: 'DELETE', path: '/api/_templates/custom/:id', handler: 'delete' },
};


