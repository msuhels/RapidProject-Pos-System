/**
 * Template Module Seed Data
 *
 * Copy and customize this file when creating a new module.
 * You can use this to insert initial demo data for the module.
 */

export interface TemplateSeedRecord {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export const TEMPLATE_SEED_DATA: TemplateSeedRecord[] = [
  {
    id: 'template-1',
    name: 'Example Template Record',
    description: 'Replace this with your own seed data',
    createdAt: new Date().toISOString(),
  },
];


