import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Canonical "nothing here" panel — bordered icon box + mono heading, used across the cabinet. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-2 border-dark-300 bg-dark-900 p-10 text-center shadow-[4px_4px_0_0_#000]',
        className,
      )}
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-dark-300 bg-dark-800">
        {icon}
      </div>
      <h3 className="mb-2 font-mono text-xl font-black uppercase tracking-tight text-dark-100">
        {title}
      </h3>
      {description && (
        <p className="font-mono text-xs uppercase tracking-wider text-dark-400">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export default EmptyState;
