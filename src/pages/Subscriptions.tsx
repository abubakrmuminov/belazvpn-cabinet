import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ClipboardIcon, PlusIcon } from '@/components/icons';
import { subscriptionApi } from '../api/subscription';
import { balanceApi } from '../api/balance';
import { useAuthStore } from '../store/auth';
import SubscriptionListCard from '../components/subscription/SubscriptionListCard';
import TrialOfferCard from '../components/dashboard/TrialOfferCard';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/primitives/Button';

function SubscriptionsEmptyState({ onBuy }: { onBuy: () => void }) {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={<ClipboardIcon className="h-8 w-8 text-dark-500" />}
      title={t('subscriptions.empty', 'Нет подписок')}
      description={t('subscriptions.emptyDesc', 'У вас пока нет активных подписок')}
      action={<Button onClick={onBuy}>{t('subscriptions.buy', 'Купить подписку')}</Button>}
    />
  );
}

export default function Subscriptions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [trialError, setTrialError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions-list'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    staleTime: 30_000,
    refetchOnMount: 'always',
  });

  const subscriptions = data?.subscriptions ?? [];
  const isMultiTariff = data?.multi_tariff_enabled ?? false;
  const hasNoSubscriptions = !isLoading && subscriptions.length === 0;
  const hasActivePaid = subscriptions.some(
    (s) => !s.is_trial && (s.status === 'active' || s.status === 'limited'),
  );

  const { data: trialInfo, isLoading: trialLoading } = useQuery({
    queryKey: ['trial-info'],
    queryFn: () => subscriptionApi.getTrialInfo(),
    enabled: hasNoSubscriptions,
    staleTime: 30_000,
  });

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    enabled: hasNoSubscriptions && !!trialInfo?.is_available,
    staleTime: 30_000,
  });

  const activateTrialMutation = useMutation({
    mutationFn: () => subscriptionApi.activateTrial(),
    onSuccess: () => {
      setTrialError(null);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['trial-info'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
      refreshUser();
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      setTrialError(error.response?.data?.detail || t('common.error'));
    },
  });

  // Single-tariff mode with one subscription: skip list, go directly to detail
  if (data && !isMultiTariff && subscriptions.length === 1) {
    return <Navigate to={`/subscriptions/${subscriptions[0].id}`} replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('subscriptions.title', 'Мои подписки')}
        action={
          !isLoading &&
          hasActivePaid && (
            <Button
              variant="accent-outline"
              size="sm"
              onClick={() => navigate('/subscription/purchase')}
            >
              <PlusIcon className="h-4 w-4" />
              {t('subscriptions.buyAnother', 'Новый тариф')}
            </Button>
          )
        }
      />

      {/* Has subscriptions but no paid active — explicit buy CTA */}
      {!isLoading && subscriptions.length > 0 && !hasActivePaid && (
        <Button fullWidth onClick={() => navigate('/subscription/purchase')}>
          <PlusIcon className="h-5 w-5" />
          {t('subscriptions.browsePlans', 'Посмотреть тарифы и купить подписку')}
        </Button>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse border border-dark-300 bg-dark-800" />
          ))}
        </div>
      )}

      {/* Empty state: show trial if available, otherwise plain empty */}
      {hasNoSubscriptions && !trialLoading && trialInfo?.is_available && (
        <div className="space-y-4">
          <TrialOfferCard
            trialInfo={trialInfo}
            balanceKopeks={balanceData?.balance_kopeks ?? 0}
            balanceRubles={balanceData?.balance_rubles ?? 0}
            activateTrialMutation={activateTrialMutation}
            trialError={trialError}
          />
          <Button fullWidth onClick={() => navigate('/subscription/purchase')}>
            <PlusIcon className="h-5 w-5" />
            {t('subscriptions.browsePlans', 'Посмотреть тарифы и купить подписку')}
          </Button>
        </div>
      )}
      {hasNoSubscriptions && !trialLoading && !trialInfo?.is_available && (
        <SubscriptionsEmptyState onBuy={() => navigate('/subscription/purchase')} />
      )}

      {/* Subscription grid */}
      {subscriptions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
          {subscriptions.map((sub) => (
            <SubscriptionListCard
              key={sub.id}
              subscription={sub}
              onClick={() => navigate(`/subscriptions/${sub.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
