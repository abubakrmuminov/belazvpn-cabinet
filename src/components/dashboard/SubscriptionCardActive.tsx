import { uiLocale } from '@/utils/uiLocale';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import type { UseMutationResult } from '@tanstack/react-query';
import TrafficProgressBar from './TrafficProgressBar';
import Sparkline from './Sparkline';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { useTrafficZone } from '../../hooks/useTrafficZone';
import { formatTraffic } from '../../utils/formatTraffic';
import { CalendarIcon, RefreshIcon } from '@/components/icons';
import { useHaptic } from '../../platform';
import type { Subscription } from '../../types';

interface SubscriptionCardActiveProps {
  subscription: Subscription;
  trafficData: {
    traffic_used_gb: number;
    traffic_used_percent: number;
    is_unlimited: boolean;
  } | null;
  refreshTrafficMutation: UseMutationResult<unknown, unknown, void, unknown>;
  trafficRefreshCooldown: number;
  connectedDevices: number;
}

export default function SubscriptionCardActive({
  subscription,
  trafficData,
  refreshTrafficMutation,
  trafficRefreshCooldown,
  connectedDevices,
}: SubscriptionCardActiveProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const usedPercent = trafficData?.traffic_used_percent ?? subscription.traffic_used_percent;
  const usedGb = trafficData?.traffic_used_gb ?? subscription.traffic_used_gb;
  const isUnlimited = trafficData?.is_unlimited ?? subscription.traffic_limit_gb === 0;
  const zone = useTrafficZone(usedPercent);
  const animatedPercent = useAnimatedNumber(usedPercent);
  const haptic = useHaptic();

  const isAtDeviceLimit =
    subscription.device_limit > 0 && connectedDevices >= subscription.device_limit;

  const formattedDate = new Date(subscription.end_date).toLocaleDateString(uiLocale());
  const daysLeft = subscription.days_left;

  // Sparkline placeholder data (hidden until API provides daily usage)
  const dailyUsage: number[] = [];

  return (
    <div className="relative overflow-hidden border-2 border-dark-300 bg-dark-900 p-6 shadow-[4px_4px_0_0_#000]">
      {/* ─── Header ─── */}
      <div className="mb-6 flex items-start justify-between border-b border-dark-700 pb-4">
        <div>
          {/* Zone indicator */}
          <div className="mb-1 flex items-center gap-2">
            <span
              className="inline-block h-3.5 w-3.5 border border-black shadow-[1px_1px_0_0_#000]"
              style={{
                backgroundColor: zone.mainVar,
                transition: 'background-color 0.3s ease',
              }}
              aria-hidden="true"
            />
            <span
              className="font-mono text-[10px] font-black uppercase tracking-wider"
              style={{ color: zone.mainVar }}
            >
              {isUnlimited ? t('dashboard.unlimited') : t(zone.labelKey)}
            </span>
            {subscription.is_trial && (
              <span className="inline-flex items-center gap-1 border border-accent-500 bg-accent-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-accent-500">
                {t('subscription.trialStatus')}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="font-mono text-sm font-black uppercase tracking-widest text-dark-200">
            {t('dashboard.trafficUsageTitle')}
          </h2>
        </div>

        {/* Big percentage / infinity */}
        <div className="text-right">
          {isUnlimited ? (
            <>
              <div
                className="font-mono text-3xl font-black leading-none tracking-tight"
                style={{ color: zone.mainVar }}
              >
                &#8734;
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase font-bold text-dark-500">
                {formatTraffic(usedGb)} {t('dashboard.usedSuffix')}
              </div>
            </>
          ) : (
            <>
              <div className="font-mono text-3xl font-black leading-none tracking-tighter text-dark-50">
                {animatedPercent.toFixed(0)}
                <span className="ml-0.5 text-base font-bold text-dark-400">%</span>
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase font-bold text-dark-400">
                {formatTraffic(usedGb)} / {formatTraffic(subscription.traffic_limit_gb)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Progress Bar ─── */}
      <div className="mb-6">
        <TrafficProgressBar
          usedGb={usedGb}
          limitGb={subscription.traffic_limit_gb}
          percent={usedPercent}
          isUnlimited={isUnlimited}
        />
      </div>

      {/* ─── Connect Device Button ─── */}
      {subscription.subscription_url && (
        <button
          disabled={isAtDeviceLimit}
          onClick={() => {
            if (isAtDeviceLimit) {
              haptic.notification('error');
              return;
            }
            navigate(`/connection?sub=${subscription.id}`);
          }}
          className={`mb-4 flex w-full items-center gap-3.5 border border-dark-300 bg-dark-950 p-3.5 text-left shadow-[2px_2px_0_0_#000] hover:bg-dark-850 transition-all duration-100 active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] disabled:opacity-50 disabled:cursor-not-allowed`}
          data-onboarding="connect-devices"
        >
          {/* Monitor icon */}
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-dark-600 bg-dark-900"
            style={{ color: zone.mainVar }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
              aria-hidden="true"
            >
              <rect x="2" y="3" width="20" height="14" />
              <path d="M12 17v4M8 21h8" />
              <path d="M10 10h4" opacity="0.7" />
            </svg>
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="font-mono text-xs font-black uppercase tracking-wider text-dark-100">
              {t('dashboard.connectDevice')}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase font-bold text-dark-500">
              {subscription.device_limit === 0
                ? t('dashboard.devicesConnectedUnlimited', { used: connectedDevices })
                : t('dashboard.devicesOfMax', {
                    used: connectedDevices,
                    max: subscription.device_limit,
                  })}
            </div>
            {isAtDeviceLimit && (
              <div className="mt-1 font-mono text-[9px] font-bold uppercase tracking-wider text-warning-500">
                {t('dashboard.deviceLimitReached')}
              </div>
            )}
          </div>

          {/* Device indicator */}
          {subscription.device_limit === 0 ? (
            <div
              className="flex flex-shrink-0 items-center font-mono text-lg font-black text-dark-400"
              aria-hidden="true"
            >
              ∞
            </div>
          ) : subscription.device_limit <= 10 ? (
            <div className="flex flex-shrink-0 gap-1" aria-hidden="true">
              {Array.from({ length: subscription.device_limit }, (_, i) => (
                <div
                  key={i}
                  className="h-2.5 w-2.5 border border-black transition-colors duration-100"
                  style={{
                    backgroundColor: i < connectedDevices ? zone.mainVar : '#1A1A1B',
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex w-16 flex-shrink-0 items-center" aria-hidden="true">
              <div className="h-2 w-full border border-dark-600 bg-dark-950">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.round((connectedDevices / subscription.device_limit) * 100)}%`,
                    backgroundColor: zone.mainVar,
                    minWidth: connectedDevices > 0 ? '4px' : '0px',
                  }}
                />
              </div>
            </div>
          )}
        </button>
      )}

      {/* ─── Stats row: Tariff + Days Left ─── */}
      <div className="mb-4 flex gap-2.5">
        {/* Tariff badge — clickable */}
        <Link
          to={`/subscriptions/${subscription.id}`}
          className="flex-1 border border-dark-300 bg-dark-950 p-3.5 shadow-[2px_2px_0_0_#000] hover:bg-dark-850 transition-colors"
        >
          <div className="mb-1 font-mono text-[9px] font-bold uppercase tracking-wider text-dark-500">
            {t('dashboard.tariff')}
          </div>
          <div className="min-w-0 truncate font-mono text-sm font-black uppercase tracking-wide text-dark-100">
            {subscription.tariff_name || t('subscription.currentPlan')}
          </div>
          <div className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-dark-500">
            {t('dashboard.validUntil', { date: formattedDate })}
          </div>
        </Link>

        {/* Days remaining */}
        <div
          className={`flex-1 border p-3.5 bg-dark-950 shadow-[2px_2px_0_0_#000] transition-colors duration-100 ${
            daysLeft <= 3 ? 'border-warning-500' : 'border-dark-300'
          }`}
        >
          <div className="mb-1 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-dark-500">
            <div className={`flex h-5 w-5 items-center justify-center border ${daysLeft <= 3 ? 'border-warning-500 bg-warning-500/10' : 'border-dark-600 bg-dark-900'}`}>
              <CalendarIcon className="h-3 w-3" />
            </div>
            {t('dashboard.remaining')}
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="font-mono text-xl font-black transition-colors duration-100"
              style={{ color: daysLeft <= 3 ? '#FF8C00' : '#e5e2e3' }}
            >
              {daysLeft}
            </span>
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-dark-500">
              {t('subscription.daysShort')}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Traffic Refresh ─── */}
      <div className="mb-5 flex items-center justify-between px-0.5 border-t border-dark-800 pt-3">
        <button
          onClick={() => refreshTrafficMutation.mutate()}
          disabled={refreshTrafficMutation.isPending || trafficRefreshCooldown > 0}
          className="flex items-center gap-1.5 border border-dark-400 bg-dark-850 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-dark-200 shadow-[1px_1px_0_0_#000] hover:bg-dark-750 active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t('common.refresh')}
        >
          <RefreshIcon
            className={`h-3 w-3 ${refreshTrafficMutation.isPending ? 'animate-spin' : ''}`}
          />
          {trafficRefreshCooldown > 0 ? `${trafficRefreshCooldown}s` : t('common.refresh')}
        </button>
        <Link
          to={`/subscriptions/${subscription.id}`}
          className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent-500 hover:text-accent-400"
        >
          {t('dashboard.viewSubscription')} &rarr;
        </Link>
      </div>

      {/* ─── Sparkline ─── */}
      {dailyUsage.length >= 2 && (
        <div className="border border-dark-300 bg-dark-950 p-3.5 shadow-[2px_2px_0_0_#000]">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-dark-400">
              {t('dashboard.usageLast14Days')}
            </span>
            <span className="font-mono text-[9px] font-bold text-dark-500 uppercase tracking-wider">
              {t('dashboard.maxUsage', { amount: formatTraffic(Math.max(...dailyUsage)) })}
            </span>
          </div>
          <Sparkline data={dailyUsage} width={440} height={44} color={zone.mainVar} />
        </div>
      )}
    </div>
  );
}
