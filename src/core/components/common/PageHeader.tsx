interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-4 sm:mb-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground break-words">{title}</h1>
      {description && (
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
