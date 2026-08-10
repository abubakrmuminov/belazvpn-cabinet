import { uiLocale } from '@/utils/uiLocale';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import type { Subscription } from '../../types';
import { subscriptionApi } from '../../api/subscription';
import { useCurrency } from '../../hooks/useCurrency';
import { useHapticFeedback } from '../../platform/hooks/useHaptic';
import { getInsufficientBalanceError } from '../../utils/subscriptionHelpers';
import { ClockIcon, ExclamationIcon, PlusIcon, SubscriptionIcon } from '@/components/icons';

interface SubscriptionCardExpiredProps {
  subscription: Subscription;
  balanceKopeks?: number;
  balanceRubles?: number;
  className?: string;
}

export default function SubscriptionCardExpired({
  subscription,
  balanceKopeks = 0,
  balanceRubles = 0,
  className,
}: SubscriptionCardExpiredProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatAmount, currencySymbol } = useCurrency();
  const haptic = useHapticFeedback();

  const [isRenewing, setIsRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);

  const formattedDate = new Date(subscription.end_date).toLocaleDateString(uiLocale());

  // Detect limited (traffic exhausted) state
  const isLimited = subscription.is_limited;

  // Detect daily subscription (disabled or expired)
  const isDaily = subscription.is_daily;
  const isDisabledDaily = subscription.status === 'disabled' && isDaily;

  // For daily subs, check if balance covers daily price; otherwise 100 kopeks minimum
  const dailyPrice = subscription.daily_price_kopeks ?? 0;
  const hasBalance = isDaily ? balanceKopeks >= dailyPrice && dailyPrice > 0 : balanceKopeks >= 100;

  const handleQuickRenew = async () => {
    setIsRenewing(true);
    setRenewError(null);
    haptic.buttonPressHeavy();

    try {
      if (isDisabledDaily) {
        // Resume daily subscription via toggle pause endpoint
        await subscriptionApi.togglePause(subscription.id);
      } else if (isDaily && subscription.tariff_id) {
        // Expired daily tariff — purchase for 1 day. Pass subscription.id
        // so the backend resolves the EXACT row instead of doing a
        // (user_id, tariff_id) re-lookup that races with concurrent
        // panel webhooks (would surface as "Тариф уже активен" + refund).
        await subscriptionApi.purchaseTariff(subscription.tariff_id, 1, undefined, subscription.id);
      } else {
        await subscriptionApi.renewSubscription(30, subscription.id);
      }
      haptic.success();
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'subscription',
      });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
    } catch (err: unknown) {
      haptic.error();
      const insufficientData = getInsufficientBalanceError(err);
      if (insufficientData) {
        setRenewError(t('dashboard.expired.insufficientFunds'));
      } else if (err instanceof AxiosError) {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') {
          setRenewError(detail);
        } else {
          setRenewError(t('dashboard.expired.renewError'));
        }
      } else {
        setRenewError(t('dashboard.expired.renewError'));
      }
    } finally {
      setIsRenewing(false);
    }
  };

  const handleTopUp = () => {
    haptic.buttonPress();
    const params = new URLSearchParams();
    params.set('returnTo', location.pathname);
    navigate(`/balance/top-up?${params.toString()}`);
  };

  // Color scheme: amber for limited, red for expired/disabled
  const accent = isLimited
    ? {
        r: 255,
        g: 184,
        b: 0,
        gradient: 'linear-gradient(135deg, #FFB800, #FF8C00)',
        hex: '#FF8C00',
      }
    : {
        r: 244,
        g: 197,
        b: 66,
        hex: '#F4C542',
      };

  return (
    <div className={`relative overflow-hidden border-2 border-dark-300 bg-dark-900 p-6 shadow-[4px_4px_0_0_#000] ${className ?? ''}`}>
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-none border-2"
          style={{
            backgroundColor: `rgba(${accent.r},${accent.g},${accent.b},0.1)`,
            borderColor: accent.hex,
            color: accent.hex,
          }}
        >
          {isLimited ? (
            <ExclamationIcon className="h-[22px] w-[22px]" />
          ) : (
            <ClockIcon className="h-[22px] w-[22px]" />
          )}
        </div>
        <h2 className="font-mono text-sm font-black uppercase tracking-widest text-dark-50">
          {isLimited
            ? t('subscription.trafficLimitedTitle')
            : isDisabledDaily
              ? t('dashboard.suspended.title')
              : subscription.is_trial
                ? t('dashboard.expired.trialTitle')
                : t('dashboard.expired.title')}
        </h2>
      </div>

      {/* Limited description */}
      {isLimited && (
        <p className="mb-4 font-mono text-xs uppercase tracking-wider text-dark-400">
          {t('subscription.trafficLimitedDescription')}
        </p>
      )}

      {/* Expired date + Balance row */}
      <div className="mb-5 flex items-center justify-between border border-dark-750 bg-dark-950 px-4 py-3">
        <div className="flex items-center">
          <div className="mb-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-dark-500">
            {isLimited
              ? t('dashboard.expired.activeUntil')
              : t('dashboard.expired.expiredDate', {
                  context: subscription.is_trial ? 'trial' : '',
                })}
          </div>
          <div className="ml-3 font-mono text-xs font-bold tracking-tight text-dark-300">
            {formattedDate}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-dark-500">
            {t('dashboard.expired.balance')}
          </span>
          <span
            className={`font-mono text-xs font-bold ${hasBalance ? 'text-success-400' : 'text-dark-500'}`}
          >
            {formatAmount(balanceRubles)} {currencySymbol}
          </span>
        </div>
      </div>

      {/* Renew error */}
      {renewError && (
        <div
          className="mb-4 border-l-4 border-error-500 bg-error-500/10 p-3 text-center text-xs font-bold text-error-400"
          role="alert"
        >
          {renewError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2.5">
        {isLimited ? (
          <Link
            to={`/subscriptions/${subscription.id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-none border border-black bg-accent-500 py-3.5 font-mono text-xs font-black uppercase tracking-widest text-dark-950 shadow-[2px_2px_0_0_#000] transition-all duration-100 hover:bg-accent-400 active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]"
          >
            <PlusIcon className="h-4 w-4" />
            {t('subscription.buyTraffic')}
          </Link>
        ) : (
          <>
            {/* Quick Renew or Top Up button (hidden for expired trials) */}
            {!subscription.is_trial && (
              <>
                {hasBalance ? (
                  <button
                    type="button"
                    onClick={handleQuickRenew}
                    disabled={isRenewing}
                    className="flex flex-1 items-center justify-center gap-2 rounded-none border border-black bg-accent-500 py-3.5 font-mono text-xs font-black uppercase tracking-widest text-dark-950 shadow-[2px_2px_0_0_#000] transition-all duration-100 hover:bg-accent-400 active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] disabled:opacity-50"
                  >
                    {isRenewing ? (
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-dark-950/30 border-t-dark-950"
                        aria-hidden="true"
                      />
                    ) : (
                      <SubscriptionIcon className="h-4 w-4" />
                    )}
                    {isRenewing
                      ? t('common.loading')
                      : isDisabledDaily
                        ? t('dashboard.suspended.resume')
                        : t('dashboard.expired.quickRenew')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTopUp}
                    className="flex flex-1 items-center justify-center gap-2 rounded-none border border-black bg-warning-500 py-3.5 font-mono text-xs font-black uppercase tracking-widest text-dark-950 shadow-[2px_2px_0_0_#000] transition-all duration-100 hover:bg-warning-400 active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {t('dashboard.expired.topUp')}
                  </button>
                )}
              </>
            )}

            {/* Tariffs (go to purchase page) — full-width for trials */}
            <Link
              to="/subscription/purchase"
              className={`flex items-center justify-center rounded-none border border-black py-3.5 font-mono text-xs font-black uppercase tracking-widest transition-all duration-100 ${
                subscription.is_trial
                  ? 'flex-1 bg-accent-500 text-dark-950 hover:bg-accent-400 shadow-[2px_2px_0_0_#000] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]'
                  : 'bg-dark-850 text-dark-200 hover:bg-dark-750 shadow-[2px_2px_0_0_#000] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] px-5'
              }`}
            >
              {t('dashboard.expired.tariffs')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
