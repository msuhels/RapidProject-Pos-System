// Auto API routing

import { NextRequest, NextResponse } from 'next/server';
import { moduleRegistry } from '@/core/config/moduleRegistry';
import { getAuthToken } from '@/core/middleware/auth';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { ModuleApiEndpoint } from '@/core/types/module';

const MODULES_DIR = join(process.cwd(), 'src', 'modules');

/**
 * Get handler function from module
 */
async function getHandler(moduleId: string, handlerName: string, method: string) {
  // Support nested handler paths like "entity/create"
  const handlerSegments = handlerName.split('/').filter(Boolean);
  const handlerPath = join(
    MODULES_DIR,
    moduleId,
    'api',
    'handlers',
    ...handlerSegments
  ) + '.ts';
  
  if (!existsSync(handlerPath)) {
    return null;
  }

  try {
    const modulePath = `@/modules/${moduleId}/api/handlers/${handlerSegments.join('/')}`;
    const handlerModule = await import(modulePath);
    
    // Handlers export named functions like GET, POST, etc.
    const handler = handlerModule[method] || handlerModule.default;
    return handler;
  } catch (error) {
    console.error(`Failed to load handler ${handlerName} from module ${moduleId}:`, error);
    return null;
  }
}

/**
 * Match route path with endpoint pattern
 */
function matchRoute(path: string, pattern: string): { match: boolean; params: Record<string, string> } {
  // Handle empty pattern (root path)
  if (pattern === '' || pattern === '/') {
    // Match if path is empty or just a slash
    return { match: path === '' || path === '/', params: {} };
  }

  // Convert pattern like "/:id" to regex
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return { match: false, params: {} };
  }

  const params: Record<string, string> = {};
  let match = true;

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      // It's a parameter
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else if (patternPart !== pathPart) {
      match = false;
      break;
    }
  }

  return { match, params };
}

/**
 * Route API request to appropriate module handler
 */
export async function routeApiRequest(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  // Get all API endpoints from registered modules
  const allEndpoints = moduleRegistry.getAllApiEndpoints();

  // Reconstruct full request path (pathSegments come from /api/[...path] route, so we need to prepend /api)
  const fullPath = '/api/' + pathSegments.join('/');

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Router] Request: ${request.method} ${fullPath}`);
    console.log(`[API Router] Available endpoints:`, allEndpoints.map(e => `${e.endpoint.method} ${e.basePath}${e.endpoint.path}`));
  }

  // Sort endpoints to prioritize static paths over dynamic paths
  // E.g., /api/customers/export should match before /api/customers/:id
  const sortedEndpoints = [...allEndpoints].sort((a, b) => {
    const aIsDynamic = a.endpoint.path.includes(':');
    const bIsDynamic = b.endpoint.path.includes(':');

    if (aIsDynamic && !bIsDynamic) return 1; // b (static) before a (dynamic)
    if (!aIsDynamic && bIsDynamic) return -1; // a (static) before b (dynamic)
    return 0; // keep original order for same type
  });

  // Find matching endpoint
  let matchedEndpoint: { moduleId: string; basePath: string; endpoint: ModuleApiEndpoint } | null = null;
  let routeParams: Record<string, string> = {};

  for (const { moduleId, basePath, endpoint } of sortedEndpoints) {
    // Check if method matches first (faster check)
    if (endpoint.method !== request.method) {
      continue;
    }

    // Check if the request path starts with the base path
    if (!fullPath.startsWith(basePath)) {
      continue;
    }

    // Get the remaining path after base path
    const remainingPath = fullPath.slice(basePath.length) || '/';
    
    // Match the endpoint path pattern
    const { match, params } = matchRoute(remainingPath, endpoint.path);
    
    if (match) {
      matchedEndpoint = { moduleId, basePath, endpoint };
      routeParams = params;
      break;
    }
  }

  if (!matchedEndpoint) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Router] No matching endpoint found for ${request.method} ${fullPath}`);
    }
    return NextResponse.json(
      { error: 'Endpoint not found' },
      { status: 404 }
    );
  }

  const { moduleId, endpoint } = matchedEndpoint;

  // Check if module is enabled
  const module = moduleRegistry.getModule(moduleId);
  if (!module || module.config.enabled === false) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Router] Module ${moduleId} is disabled`);
    }
    return NextResponse.json(
      { error: 'Endpoint not found' },
      { status: 404 }
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Router] Matched: ${moduleId} -> ${endpoint.handler}`);
  }

  // Auth is validated inside handlers (via verifyAuth) so we don't block here.

  // TODO: Add permission checks if endpoint.permissions is defined
  // TODO: Add middleware execution if endpoint.middleware is defined

  // Load and execute handler
  const handler = await getHandler(moduleId, endpoint.handler, endpoint.method);
  
  if (!handler) {
    return NextResponse.json(
      { error: 'Handler not found' },
      { status: 500 }
    );
  }

  try {
    // Handlers are Next.js route handlers that receive NextRequest and params
    // Pass params as a plain object (not a Promise) to match Next.js 15 handler signature
    const result = await handler(request, { params: routeParams });

    // Handlers should return NextResponse
    if (result instanceof NextResponse) {
      return result;
    }

    // Fallback: wrap in NextResponse if handler returns plain object
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error executing handler ${endpoint.handler} from module ${moduleId}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
