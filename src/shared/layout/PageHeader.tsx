import { cn } from "@/shared/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div>
        <p className="section-eyebrow mb-3">Espace Elintys</p>
        <h1 className="font-serif text-[clamp(30px,4vw,44px)] leading-tight text-navy-dark">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
