export interface ReportPermissionDefinition {
  code: string;
  name: string;
  action: 'read' | 'export' | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const REPORT_PERMISSIONS: ReportPermissionDefinition[] = [
  {
    code: 'reports:read',
    name: 'View Reports',
    action: 'read',
    description: 'View and read report data',
  },
  {
    code: 'reports:export',
    name: 'Export Reports',
    action: 'export',
    description: 'Export report data to CSV files',
  },
  {
    code: 'reports:*',
    name: 'Full Report Access',
    action: 'manage',
    description: 'Full access to all report operations',
  },
];

