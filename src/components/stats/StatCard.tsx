import { type ReactNode } from 'react';

import { TREND_STYLES } from './constants';

export interface StatCardDelta {
  /** Signed percent change vs the comparison period. */
  percent: number;
  trend: 'up' | 'down' | 'stable';
}

/** Soft tinted chip + matching value colour, in the spirit of the Remnawave stats. */
const TONE = {
  neutral: { chip: 'bg-dark-800 text-dark-300 border border-dark-600', value: 'text-dark-100' },
  success: { chip: 'bg-success-500/10 text-success-400 border border-success-500/20', value: 'text-success-400' },
  accent: { chip: 'bg-accent-500/10 text-accent-500 border border-accent-500/20', value: 'text-accent-500' },
  warning: { chip: 'bg-warning-500/10 text-warning-400 border border-warning-500/20', value: 'text-warning-400' },
  error: { chip: 'bg-error-500/10 text-error-400 border border-error-500/20', value: 'text-error-400' },
} as const;

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  /** Tints the icon chip and (unless valueClassName is set) the value colour. */
  tone?: keyof typeof TONE;
  valueClassName?: string;
  /** Optional secondary line shown under the value (e.g. a subtitle or context). */
  subValue?: string;
  /** When true, shows a skeleton placeholder instead of the value. */
  loading?: boolean;
  /** Optional node rendered at the right edge of the label row (e.g. a chevron for nav cards). */
  trailing?: ReactNode;
  /** Optional period-over-period change shown under the value. */
  delta?: StatCardDelta | null;
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'neutral',
  valueClassName,
  subValue,
  loading,
  trailing,
  delta,
}: StatCardProps) {
  const toneStyle = TONE[tone];
  const valueClass = valueClassName ?? toneStyle.value;
  const trendStyle = delta ? (TREND_STYLES[delta.trend] ?? TREND_STYLES.stable) : null;

  return (
    <div className="h-full border border-dark-300 bg-dark-900 p-3 shadow-[2px_2px_0_0_#000] hover:bg-dark-850 transition-colors">
      <div className="flex items-center justify-between gap-2 border-b border-dark-800 pb-1.5 mb-2">
        <span className="line-clamp-2 font-mono text-xs font-bold uppercase tracking-wider text-dark-400 sm:text-sm">{label}</span>
        {trailing}
      </div>
      {/* Chip is centred against the value line only (delta sits below the whole
          row), so the icon lands in the same spot on every card. The forced svg
          size normalises every icon regardless of what the call site passes. */}
      <div className="flex items-center gap-2.5">
        {icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-none [&>svg]:h-5 [&>svg]:w-5 ${toneStyle.chip}`}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="skeleton h-7 w-20" />
          ) : (
            <>
              <div className={`truncate font-mono text-lg font-black tracking-tighter sm:text-xl uppercase ${valueClass}`}>
                {value}
              </div>
              {subValue && <div className="truncate font-mono text-xs text-dark-500 font-bold uppercase">{subValue}</div>}
            </>
          )}
        </div>
      </div>
      {trendStyle && (
        <div className={`mt-1.5 text-xs font-medium ${trendStyle.className}`}>
          {trendStyle.arrow} {Math.abs(delta!.percent)}%
        </div>
      )}
    </div>
  );
}
