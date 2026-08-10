import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Canonical page-title block — industrial mono/uppercase heading used across the cabinet. */
export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate font-mono text-2xl font-black uppercase tracking-tight text-dark-50 sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <div className="mt-1 font-mono text-xs uppercase tracking-wider text-dark-400">
            {subtitle}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default PageHeader;
