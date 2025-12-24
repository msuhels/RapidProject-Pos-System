'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { TableActions } from '@/core/components/common/TableActions';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import type { StaticTemplateRecord } from '../types';

interface StaticTemplateTableProps {
  records: StaticTemplateRecord[];
  loading?: boolean;
  onEdit?: (record: StaticTemplateRecord) => void;
  onDelete?: (record: StaticTemplateRecord) => void;
  showActions?: boolean;
}

const STANDARD_FIELDS = [
  { code: 'name', label: 'Name', render: (r: StaticTemplateRecord) => r.name },
  {
    code: 'description',
    label: 'Description',
    render: (r: StaticTemplateRecord) => r.description ?? '',
  },
  { code: 'status', label: 'Status', render: (r: StaticTemplateRecord) => r.status },
] as const;

export function StaticTemplateTable({
  records,
  loading = false,
  onEdit,
  onDelete,
  showActions = true,
}: StaticTemplateTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('template_static');

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading records...
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No records found.
      </div>
    );
  }

  const visibleFields = STANDARD_FIELDS.filter((field) =>
    isFieldVisible('template_static', field.code),
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleFields.map((field) => (
              <TableHead key={field.code}>{field.label}</TableHead>
            ))}
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              {visibleFields.map((field) => (
                <TableCell key={field.code}>{field.render(record)}</TableCell>
              ))}
              {showActions && (
                <TableCell className="text-right">
                  <TableActions
                    item={record}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


