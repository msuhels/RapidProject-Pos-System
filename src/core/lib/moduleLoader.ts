// Module auto-discovery and loading system

import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { ModuleConfig, LoadedModule } from '@/core/types/module';

const MODULES_DIR = join(process.cwd(), 'src', 'modules');

/**
 * Scans the modules directory and discovers all modules
 */
export function discoverModules(): string[] {
  if (!existsSync(MODULES_DIR)) {
    return [];
  }

  const entries = readdirSync(MODULES_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name);
}

/**
 * Loads module configuration from module.config.json
 */
export function loadModuleConfig(moduleId: string): ModuleConfig | null {
  const configPath = join(MODULES_DIR, moduleId, 'module.config.json');
  
  if (!existsSync(configPath)) {
    console.warn(`Module ${moduleId} has no module.config.json`);
    return null;
  }

  try {
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent) as ModuleConfig;
    
    // Validate required fields
    if (!config.id || !config.name || !config.version) {
      console.error(`Module ${moduleId} has invalid configuration`);
      return null;
    }

    return config;
  } catch (error) {
    console.error(`Failed to load config for module ${moduleId}:`, error);
    return null;
  }
}

/**
 * Loads all modules and their configurations
 */
export function loadAllModules(): LoadedModule[] {
  const moduleIds = discoverModules();
  const loadedModules: LoadedModule[] = [];

  for (const moduleId of moduleIds) {
    const config = loadModuleConfig(moduleId);
    if (!config) {
      continue;
    }

    const routesPath = join(MODULES_DIR, moduleId, 'routes');
    const apiHandlersPath = join(MODULES_DIR, moduleId, 'api', 'handlers');

    loadedModules.push({
      id: moduleId,
      config,
      routesPath: existsSync(routesPath) ? routesPath : undefined,
      apiHandlersPath: existsSync(apiHandlersPath) ? apiHandlersPath : undefined,
    });
  }

  return loadedModules;
}

/**
 * Gets module route component path
 */
export function getModuleRoutePath(moduleId: string, component: string): string | null {
  const routeFile = join(MODULES_DIR, moduleId, 'routes', `${component}.tsx`);
  const routeFileTs = join(MODULES_DIR, moduleId, 'routes', `${component}.ts`);
  
  if (existsSync(routeFile)) {
    return routeFile;
  }
  if (existsSync(routeFileTs)) {
    return routeFileTs;
  }
  
  return null;
}
