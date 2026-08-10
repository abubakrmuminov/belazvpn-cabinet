import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { UseMutationResult } from '@tanstack/react-query';
import type { TrialInfo } from '../../types';
import { useCurrency } from '../../hooks/useCurrency';
import { BoltIcon, SparklesIcon } from '@/components/icons';

interface TrialOfferCardProps {
  trialInfo: TrialInfo;
  balanceKopeks: number;
  balanceRubles: number;
  activateTrialMutation: UseMutationResult<unknown, unknown, void, unknown>;
  trialError: string | null;
}

export default function TrialOfferCard({
  trialInfo,
  balanceKopeks,
  balanceRubles,
  activateTrialMutation,
  trialError,
}: TrialOfferCardProps) {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();
  const isFree = !trialInfo.requires_payment;
  const canAfford = balanceKopeks >= trialInfo.price_kopeks;

  return (
    <div className="relative overflow-hidden border-2 border-dark-300 bg-dark-900 p-8 shadow-[4px_4px_0_0_#000] text-center">
      {/* Icon */}
      <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-none border-2 border-accent-500 bg-accent-500/10">
        {isFree ? (
          <span className="flex text-accent-500" aria-hidden="true">
            <SparklesIcon className="h-[26px] w-[26px]" />
          </span>
        ) : (
          <span className="flex text-warning-500" aria-hidden="true">
            <BoltIcon className="h-[26px] w-[26px]" />
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="mb-1.5 font-mono text-lg font-black uppercase tracking-widest text-dark-50">
        {isFree ? t('dashboard.trialOffer.freeTitle') : t('dashboard.trialOffer.paidTitle')}
      </h2>
      <p className="mb-5 font-mono text-xs uppercase tracking-wider text-dark-400">
        {isFree ? t('dashboard.trialOffer.freeDesc') : t('dashboard.trialOffer.paidDesc')}
      </p>

      {/* Price tag for paid trial */}
      {!isFree && trialInfo.price_rubles > 0 && (
        <div className="mb-5 inline-flex items-baseline gap-1 border border-warning-500/30 bg-warning-500/10 px-5 py-2">
          <span className="font-mono text-3xl font-black leading-none tracking-tight text-warning-400">
            {trialInfo.price_rubles.toFixed(0)}
          </span>
          <span className="font-mono text-base font-bold text-warning-400">
            {currencySymbol}
          </span>
        </div>
      )}

      {/* Trial stats */}
      <div className="mb-7 grid grid-cols-3 gap-2 border border-dark-700 bg-dark-950 p-4">
        {[
          { value: String(trialInfo.duration_days), label: t('subscription.trial.days') },
          {
            value: trialInfo.traffic_limit_gb === 0 ? '∞' : String(trialInfo.traffic_limit_gb),
            label: t('common.units.gb'),
          },
          {
            value: trialInfo.device_limit === 0 ? '∞' : String(trialInfo.device_limit),
            label: t('subscription.trial.devices'),
          },
        ].map((stat, i) => (
          <div key={i} className="text-center border-r last:border-r-0 border-dark-800">
            <div className="font-mono text-2xl font-black leading-none text-dark-50">
              {stat.value}
            </div>
            <div className="mt-1 font-mono text-[9px] font-bold uppercase tracking-wider text-dark-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Balance info for paid trial */}
      {!isFree && trialInfo.price_rubles > 0 && (
        <div className="mb-4 space-y-2 border border-dark-700 bg-dark-950 p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-dark-400">{t('balance.currentBalance')}</span>
            <span
              className={`font-mono text-sm font-bold ${canAfford ? 'text-success-400' : 'text-warning-400'}`}
            >
              {formatAmount(balanceRubles)} {currencySymbol}
            </span>
          </div>
          {!canAfford && (
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-warning-400">
              {t('subscription.trial.insufficientBalance')}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {trialError && (
        <div className="mb-4 border-l-4 border-error-500 bg-error-500/10 p-3 text-center text-xs font-bold text-error-400">
          {trialError}
        </div>
      )}

      {/* CTA Button */}
      {!isFree && trialInfo.price_kopeks > 0 ? (
        canAfford ? (
          <button
            onClick={() => !activateTrialMutation.isPending && activateTrialMutation.mutate()}
            disabled={activateTrialMutation.isPending}
            className="w-full rounded-none border-2 border-dark-300 bg-accent-500 py-3.5 text-sm font-black uppercase tracking-widest text-dark-950 shadow-[3px_3px_0_0_#000] transition-all duration-100 hover:bg-accent-400 active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] disabled:opacity-50"
          >
            {activateTrialMutation.isPending
              ? t('common.loading')
              : t('subscription.trial.payAndActivate')}
          </button>
        ) : (
          <Link
            to="/balance"
            className="block w-full rounded-none border-2 border-dark-300 bg-warning-500 py-3.5 text-center text-sm font-black uppercase tracking-widest text-dark-950 shadow-[3px_3px_0_0_#000] transition-all duration-100 hover:bg-warning-400 active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]"
          >
            {t('subscription.trial.topUpToActivate')}
          </Link>
        )
      ) : (
        <button
          onClick={() => !activateTrialMutation.isPending && activateTrialMutation.mutate()}
          disabled={activateTrialMutation.isPending}
          className="w-full rounded-none border-2 border-dark-300 bg-accent-500 py-3.5 text-sm font-black uppercase tracking-widest text-dark-950 shadow-[3px_3px_0_0_#000] transition-all duration-100 hover:bg-accent-400 active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] disabled:opacity-50"
        >
          {activateTrialMutation.isPending ? t('common.loading') : t('subscription.trial.activate')}
        </button>
      )}
    </div>
  );
}
