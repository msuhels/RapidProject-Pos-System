// Module seed auto-discovery and loading system

import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

const MODULES_DIR = join(process.cwd(), 'src', 'modules');

/**
 * Seed function type that modules should export
 * @param db - Database instance (Drizzle ORM)
 */
export type SeedFunction = (db: any) => Promise<void>;

/**
 * Discover all modules with seed files
 */
export function discoverModuleSeeds(): string[] {
  if (!existsSync(MODULES_DIR)) {
    return [];
  }

  const moduleIds: string[] = [];
  const entries = readdirSync(MODULES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      const seedPath = join(MODULES_DIR, entry.name, 'seeds', 'seed.ts');
      if (existsSync(seedPath)) {
        moduleIds.push(entry.name);
      }
    }
  }

  return moduleIds;
}

/**
 * Load seed function from a module
 */
export async function loadModuleSeed(moduleId: string): Promise<SeedFunction | null> {
  const seedPath = join(MODULES_DIR, moduleId, 'seeds', 'seed.ts');
  
  if (!existsSync(seedPath)) {
    return null;
  }

  try {
    // Dynamic import the seed file
    const modulePath = `@/modules/${moduleId}/seeds/seed`;
    const seedModule = await import(modulePath);
    
    // Seed function should be the default export
    if (typeof seedModule.default === 'function') {
      return seedModule.default;
    }
    
    // Or exported as 'seed'
    if (typeof seedModule.seed === 'function') {
      return seedModule.seed;
    }
    
    console.warn(`Module ${moduleId}: No seed function found (expected default export or named 'seed')`);
    return null;
  } catch (error) {
    console.error(`Failed to load seed for module ${moduleId}:`, error);
    return null;
  }
}

/**
 * Load all module seeds
 */
export async function loadAllModuleSeeds(): Promise<Array<{ moduleId: string; seed: SeedFunction }>> {
  const moduleIds = discoverModuleSeeds();
  const seeds: Array<{ moduleId: string; seed: SeedFunction }> = [];

  for (const moduleId of moduleIds) {
    const seed = await loadModuleSeed(moduleId);
    if (seed) {
      seeds.push({ moduleId, seed });
    }
  }

  return seeds;
}

