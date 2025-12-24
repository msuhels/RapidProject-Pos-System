// EmptyState component

import { Button } from '@/core/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
