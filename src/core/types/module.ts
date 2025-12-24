// Module contract types and interfaces

export interface ModuleRoute {
  path: string;
  component: string;
  title: string;
  requiresAuth?: boolean;
  permissions?: string[];
}

export interface ModuleApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  handler: string;
  requiresAuth?: boolean;
  permissions?: string[];
  middleware?: string[];
}

export interface ModuleApiConfig {
  basePath: string;
  endpoints: ModuleApiEndpoint[];
}

export interface ModuleNavigation {
  label: string;
  icon?: string;
  path: string;
  order?: number;
  children?: ModuleNavigation[];
}

export interface ModulePermissions {
  create?: string;
  read?: string;
  update?: string;
  delete?: string;
  [key: string]: string | undefined;
}

export interface ModuleConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  enabled?: boolean; // If false, module is hidden from UI and routes/APIs are disabled
  routes?: ModuleRoute[];
  api?: ModuleApiConfig;
  navigation?: ModuleNavigation;
  permissions?: ModulePermissions;
}

export interface LoadedModule {
  id: string;
  config: ModuleConfig;
  routesPath?: string;
  apiHandlersPath?: string;
}
