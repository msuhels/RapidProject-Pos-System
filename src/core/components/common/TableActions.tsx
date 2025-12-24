'use client';

import { Copy, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';

interface TableActionsProps<T = any> {
  item: T;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onDuplicate?: (item: T) => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showDuplicate?: boolean;
}

export function TableActions<T>({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  showEdit = true,
  showDelete = true,
  showDuplicate = true,
}: TableActionsProps<T>) {
  return (
    <div className="flex items-center justify-end gap-1">
      {showDuplicate && onDuplicate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDuplicate(item)}
          title="Duplicate"
          aria-label="Duplicate"
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}
      {showEdit && onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
          title="Edit"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {showDelete && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item)}
          title="Delete"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}

