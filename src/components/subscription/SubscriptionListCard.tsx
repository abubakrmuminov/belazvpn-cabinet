import { useTranslation } from 'react-i18next';
import { useHaptic } from '../../platform';
import { CalendarIcon, CheckIcon, ChevronRightIcon, DevicesIcon } from '@/components/icons';
import type { SubscriptionListItem } from '../../types';

function formatDate(iso: string | null, locale?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale ?? undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function StatusBadge({
  status,
  isTrial,
  t,
}: {
  status: string;
  isTrial: boolean;
  t: (key: string, fallback: string) => string;
}) {
  const isActive = status === 'active' || status === 'trial';
  const isLimited = status === 'limited';
  const isExpired = status === 'expired' || status === 'disabled';

  if (isTrial) {
    return (
      <span className="inline-flex items-center gap-1 border border-warning-400/40 bg-warning-400/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest text-warning-400">
        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        {t('subscription.statusTrial', 'Тестовая')}
      </span>
    );
  }

  const color = isActive
    ? 'bg-success-400/10 text-success-400 border-success-400/40'
    : isLimited
      ? 'bg-warning-400/10 text-warning-400 border-warning-400/40'
      : 'bg-error-400/10 text-error-400 border-error-400/40';

  const label = isActive
    ? t('subscription.statusActive', 'Активна')
    : isLimited
      ? t('subscription.statusLimited', 'Ограничена')
      : isExpired
        ? t('subscription.statusExpired', 'Истекла')
        : status;

  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest ${color}`}
    >
      {label}
    </span>
  );
}

export default function SubscriptionListCard({
  subscription,
  onClick,
}: {
  subscription: SubscriptionListItem;
  onClick: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { impact } = useHaptic();

  const handleClick = () => {
    impact('light');
    onClick();
  };

  const isTrial = subscription.is_trial;
  const isActive =
    subscription.status === 'active' ||
    subscription.status === 'trial' ||
    subscription.status === 'limited';
  const isExpired = subscription.status === 'expired' || subscription.status === 'disabled';
  const isLimitedStatus = subscription.status === 'limited';
  const trafficLimit = subscription.traffic_limit_gb;
  const trafficUsed = subscription.traffic_used_gb;
  const isUnlimited = trafficLimit === 0;
  const trafficPercent = isUnlimited
    ? 0
    : trafficLimit > 0
      ? Math.min(100, (trafficUsed / trafficLimit) * 100)
      : 0;
  const trafficColor =
    trafficPercent >= 90
      ? 'bg-error-400'
      : trafficPercent >= 70
        ? 'bg-warning-400'
        : 'bg-success-400';

  const borderClass =
    isTrial || isLimitedStatus
      ? 'border-warning-400/30'
      : isExpired
        ? 'border-error-400/20'
        : 'border-dark-300';

  return (
    <button
      onClick={handleClick}
      className={`w-full border-2 bg-dark-900 p-4 text-left shadow-[3px_3px_0_0_#000] transition-all duration-100 hover:shadow-[5px_5px_0_0_#000] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#000] ${borderClass}`}
    >
      {/* Header: tariff name + status badge + chevron */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-sm font-black uppercase tracking-tight text-dark-100">
            {subscription.tariff_name || t('subscription.defaultName', 'Подписка')}
          </span>
          <StatusBadge status={subscription.status} isTrial={isTrial} t={t} />
        </div>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-dark-500" />
      </div>

      {/* Traffic mini progress bar */}
      {isActive && (
        <div className="mt-3">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-dark-500">
              {t('subscription.traffic', 'Трафик')}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-dark-500">
              {isUnlimited
                ? '∞'
                : `${trafficUsed.toFixed(1)} / ${trafficLimit} ${t('common.units.gb', 'ГБ')}`}
            </span>
          </div>
          {!isUnlimited && (
            <div className="h-1.5 overflow-hidden bg-dark-700">
              <div
                className={`h-full transition-all ${trafficColor}`}
                style={{ width: `${Math.max(1, trafficPercent)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="mt-2.5 flex items-center gap-4 font-mono text-[11px] font-bold uppercase tracking-widest text-dark-500">
        <span className="flex items-center gap-1">
          <DevicesIcon className="h-3.5 w-3.5" />
          {subscription.device_limit}
        </span>
        <span className="flex items-center gap-1">
          <CalendarIcon className="h-3.5 w-3.5" />
          {formatDate(subscription.end_date, i18n.language)}
        </span>
        {!isTrial &&
          (() => {
            const isDaily = subscription.is_daily;
            const enabled = isDaily ? !subscription.is_daily_paused : subscription.autopay_enabled;
            const label = isDaily
              ? t('subscription.dailyAutoCharge', 'Автосписание')
              : t('subscription.autopay', 'Автопродление');
            return (
              <span
                className={`flex items-center gap-1 ${enabled ? 'text-success-400/70' : 'text-error-400/50'}`}
              >
                {enabled ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {label}
              </span>
            );
          })()}
      </div>
    </button>
  );
}
