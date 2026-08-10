import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { referralApi } from '../api/referral';
import { usePlatform } from '../platform';
import { copyToClipboard } from '../utils/clipboard';
import { brandingApi } from '../api/branding';
import { partnerApi } from '../api/partners';
import { withdrawalApi } from '../api/withdrawals';
import { CampaignCard } from '../components/partner/CampaignCard';
import { useCurrency } from '../hooks/useCurrency';
import { StatCard } from '@/components/stats';
import { Button } from '@/components/primitives/Button';
import { PageHeader } from '@/components/common/PageHeader';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknotesIcon,
  CardIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  ExclamationIcon,
  GiftIcon,
  LinkIcon,
  PartnerIcon,
  PercentIcon,
  ShareIcon,
  TelegramIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from '@/components/icons';

function getWithdrawalStatusBadge(status: string): string {
  switch (status) {
    case 'completed':
      return 'badge-success';
    case 'approved':
      return 'badge-info';
    case 'pending':
      return 'badge-warning';
    case 'rejected':
    case 'cancelled':
      return 'badge-error';
    default:
      return 'badge-neutral';
  }
}

export default function Referral() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { formatAmount, currencySymbol, formatPositive, formatWithCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [copiedLink, setCopiedLink] = useState<'cabinet' | 'bot' | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const { data: info, isLoading: infoLoading } = useQuery({
    queryKey: ['referral-info'],
    queryFn: referralApi.getReferralInfo,
  });

  // Build referral link for cabinet registration
  const referralLink = info?.referral_code
    ? `${window.location.origin}/login?ref=${info.referral_code}`
    : '';
  const botReferralLink = info?.bot_referral_link || '';

  const { data: terms, isLoading: termsLoading } = useQuery({
    queryKey: ['referral-terms'],
    queryFn: referralApi.getReferralTerms,
  });

  const { data: referralList, isLoading: referralListLoading } = useQuery({
    queryKey: ['referral-list'],
    queryFn: () => referralApi.getReferralList({ per_page: 10 }),
  });

  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['referral-earnings'],
    queryFn: () => referralApi.getReferralEarnings({ per_page: 10 }),
  });

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: brandingApi.getBranding,
    staleTime: 60000,
  });

  // Partner status query
  const { data: partnerStatus, isLoading: partnerStatusLoading } = useQuery({
    queryKey: ['partner-status'],
    queryFn: partnerApi.getStatus,
  });

  const isPartner = partnerStatus?.partner_status === 'approved';

  // Withdrawal queries (only when partner is approved)
  const { data: withdrawalBalance, isLoading: withdrawalBalanceLoading } = useQuery({
    queryKey: ['withdrawal-balance'],
    queryFn: withdrawalApi.getBalance,
    enabled: isPartner,
  });

  const { data: withdrawalHistory, isLoading: withdrawalHistoryLoading } = useQuery({
    queryKey: ['withdrawal-history'],
    queryFn: withdrawalApi.getHistory,
    enabled: isPartner,
  });

  // Withdrawal cancel mutation
  const cancelWithdrawalMutation = useMutation({
    mutationFn: withdrawalApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-balance'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-history'] });
    },
  });

  const programTerms = useMemo(() => {
    if (!terms) return null;
    const showNewUserBonus = terms.first_topup_bonus_kopeks > 0;
    const showInviterBonus = terms.inviter_bonus_kopeks > 0;
    const cardCount = 2 + (showNewUserBonus ? 1 : 0) + (showInviterBonus ? 1 : 0);
    const gridColsMap: Record<number, string> = {
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
    };
    const gridCols = gridColsMap[cardCount] ?? 'md:grid-cols-4';

    return (
      <div className="border border-dark-300 bg-dark-900 p-5 shadow-[3px_3px_0_0_#000]">
        <h2 className="mb-4 border-b border-dark-300 pb-3 font-mono text-sm font-black uppercase tracking-widest text-dark-100">
          {t('referral.terms.title')}
        </h2>
        <div className={`grid grid-cols-2 gap-4 ${gridCols}`}>
          <StatCard
            label={t('referral.terms.commission')}
            value={`${terms.commission_percent}%`}
            icon={<PercentIcon className="h-5 w-5" />}
            tone="neutral"
          />
          <StatCard
            label={t('referral.terms.minTopup')}
            value={`${formatAmount(terms.minimum_topup_rubles)} ${currencySymbol}`}
            icon={<BanknotesIcon className="h-5 w-5" />}
            tone="neutral"
          />
          {showNewUserBonus && (
            <StatCard
              label={t('referral.terms.newUserBonus')}
              value={formatPositive(terms.first_topup_bonus_rubles)}
              icon={<GiftIcon className="h-5 w-5" />}
              tone="success"
            />
          )}
          {showInviterBonus && (
            <StatCard
              label={t('referral.terms.inviterBonus')}
              value={formatPositive(terms.inviter_bonus_rubles)}
              icon={<UserPlusIcon className="h-5 w-5" />}
              tone="success"
            />
          )}
        </div>
      </div>
    );
  }, [terms, t, formatAmount, formatPositive, currencySymbol]);

  const copyLink = async (link: string, type: 'cabinet' | 'bot') => {
    if (!link) return;
    try {
      await copyToClipboard(link);
      setCopiedLink(type);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      // clipboard write failed silently
    }
  };

  const { openTelegramLink } = usePlatform();

  const shareLink = () => {
    if (!referralLink) return;
    const shareText = t('referral.shareMessage', {
      percent: info?.commission_percent || 0,
      botName: branding?.name || import.meta.env.VITE_APP_NAME || 'Cabinet',
    });

    if (navigator.share) {
      navigator
        .share({
          title: t('referral.title'),
          text: shareText,
          url: referralLink,
        })
        .catch(() => {});
      return;
    }

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink,
    )}&text=${encodeURIComponent(shareText)}`;
    openTelegramLink(telegramUrl);
  };

  // These all fire in parallel on mount, so combining them costs no extra latency
  // (bounded by the slowest of the batch either way) but stops terms/list/earnings/
  // partner-status from silently popping into a page the user is already reading.
  const isLoading =
    infoLoading || termsLoading || referralListLoading || earningsLoading || partnerStatusLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin border-2 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  // Show disabled state if referral program is disabled
  if (terms && !terms.is_enabled) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center border border-dark-300 bg-dark-800">
          <UsersIcon className="h-12 w-12 text-dark-500" />
        </div>
        <div className="text-center">
          <h1 className="mb-2 font-mono text-2xl font-black uppercase tracking-tight text-dark-100 sm:text-3xl">
            {t('referral.title')}
          </h1>
          <p className="font-mono text-xs uppercase tracking-wider text-dark-400">
            {t('referral.disabled')}
          </p>
        </div>
      </div>
    );
  }

  const partnerStatusValue = partnerStatus?.partner_status ?? 'none';
  const showApplySection = partnerStatusValue === 'none';
  const showPendingSection = partnerStatusValue === 'pending';
  const showApprovedSection = partnerStatusValue === 'approved';
  const showRejectedSection = partnerStatusValue === 'rejected';

  return (
    <div className="space-y-6">
      <PageHeader title={t('referral.title')} />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <div className="col-span-2 md:col-span-1">
          <StatCard
            label={t('referral.stats.totalReferrals')}
            value={info?.total_referrals || 0}
            icon={<UsersIcon className="h-5 w-5" />}
            tone="neutral"
            subValue={`${info?.active_referrals || 0} ${t('referral.stats.activeReferrals').toLowerCase()}`}
          />
        </div>
        <StatCard
          label={t('referral.stats.totalEarnings')}
          value={formatPositive(info?.total_earnings_rubles || 0)}
          icon={<BanknotesIcon className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label={t('referral.stats.commissionRate')}
          value={`${info?.commission_percent || 0}%`}
          icon={<PercentIcon className="h-5 w-5" />}
          tone="accent"
        />
      </div>

      {/* Referral Links */}
      <div className="border border-dark-300 bg-dark-900 p-5 shadow-[3px_3px_0_0_#000]">
        <h2 className="mb-4 border-b border-dark-300 pb-3 font-mono text-sm font-black uppercase tracking-widest text-dark-100">
          {t('referral.yourLink')}
        </h2>
        <div className="space-y-4">
          {/* Bot link */}
          {botReferralLink && (
            <div>
              <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-dark-400">
                <TelegramIcon className="h-4 w-4 text-accent-400" />
                {t('referral.botLink')}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  readOnly
                  value={botReferralLink}
                  className="input flex-1 rounded-none font-mono text-xs"
                />
                <Button
                  onClick={() => copyLink(botReferralLink, 'bot')}
                  className={copiedLink === 'bot' ? 'bg-success-500 hover:bg-success-500' : ''}
                >
                  {copiedLink === 'bot' ? <CheckIcon /> : <CopyIcon />}
                  <span className="ml-2">
                    {copiedLink === 'bot' ? t('referral.copied') : t('referral.copyLink')}
                  </span>
                </Button>
              </div>
            </div>
          )}
          {/* Cabinet link */}
          <div>
            <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-dark-400">
              <LinkIcon className="h-4 w-4 text-accent-400" />
              {t('referral.cabinetLink')}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="input flex-1 rounded-none font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => copyLink(referralLink, 'cabinet')}
                  disabled={!referralLink}
                  className={copiedLink === 'cabinet' ? 'bg-success-500 hover:bg-success-500' : ''}
                >
                  {copiedLink === 'cabinet' ? <CheckIcon /> : <CopyIcon />}
                  <span className="ml-2">
                    {copiedLink === 'cabinet' ? t('referral.copied') : t('referral.copyLink')}
                  </span>
                </Button>
                <Button variant="secondary" onClick={shareLink} disabled={!referralLink}>
                  <ShareIcon className="h-4 w-4" />
                  <span className="ml-2">{t('referral.shareButton')}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-dark-500">
          {t('referral.shareHint', { percent: info?.commission_percent || 0 })}
        </p>
      </div>

      {/* Program Terms */}
      {programTerms}

      {/* Referrals List */}
      <div className="border border-dark-300 bg-dark-900 p-5 shadow-[3px_3px_0_0_#000]">
        <h2 className="mb-4 border-b border-dark-300 pb-3 font-mono text-sm font-black uppercase tracking-widest text-dark-100">
          {t('referral.yourReferrals')}
        </h2>
        {referralList?.items && referralList.items.length > 0 ? (
          <div className="space-y-2">
            {referralList.items.map((ref) => (
              <div
                key={ref.id}
                className="flex items-center justify-between border border-dark-300 bg-dark-850 p-3"
              >
                <div>
                  <div className="font-mono text-xs font-black uppercase tracking-wider text-dark-100">
                    {ref.first_name || ref.username || t('referral.anonymousUser', { id: ref.id })}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-dark-500">
                    {new Date(ref.created_at).toLocaleDateString(i18n.language)}
                  </div>
                </div>
                {ref.has_paid ? (
                  <span className="badge-success rounded-none font-mono text-[9px] font-black uppercase tracking-widest">
                    {t('referral.status.paid')}
                  </span>
                ) : (
                  <span className="badge-neutral rounded-none font-mono text-[9px] font-black uppercase tracking-widest">
                    {t('referral.status.pending')}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-dark-300 bg-dark-800">
              <UsersIcon className="h-8 w-8 text-dark-500" />
            </div>
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-dark-400">
              {t('referral.noReferrals')}
            </div>
          </div>
        )}
      </div>

      {/* Earnings History */}
      {earnings?.items && earnings.items.length > 0 && (
        <div className="border border-dark-300 bg-dark-900 p-5 shadow-[3px_3px_0_0_#000]">
          <h2 className="mb-4 border-b border-dark-300 pb-3 font-mono text-sm font-black uppercase tracking-widest text-dark-100">
            {t('referral.earningsHistory')}
          </h2>
          <div className="space-y-2">
            {earnings.items.map((earning) => (
              <div
                key={earning.id}
                className="flex items-center justify-between border border-dark-300 bg-dark-850 p-3"
              >
                <div>
                  <div className="font-mono text-xs font-black uppercase tracking-wider text-dark-100">
                    {earning.referral_first_name ||
                      earning.referral_username ||
                      t('referral.anonymousReferral')}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-dark-500">
                    {t(`referral.reasons.${earning.reason}`, earning.reason)} •{' '}
                    {new Date(earning.created_at).toLocaleDateString(i18n.language)}
                  </div>
                </div>
                <div className="font-mono text-sm font-black text-success-400">
                  {formatPositive(earning.amount_rubles)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== Partner Application Section ==================== */}

      {/* Status: none — Become a Partner CTA */}
      {terms?.partner_section_visible !== false && showApplySection && (
        <div className="border border-dark-300 bg-dark-900 p-5 shadow-[3px_3px_0_0_#000]">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-accent-500/30 bg-accent-500/10 text-accent-400">
              <PartnerIcon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h2 className="font-mono text-sm font-black uppercase tracking-widest text-dark-100">
                {t('referral.partner.becomePartner')}
              </h2>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-dark-400">
                {t('referral.partner.becomePartnerDesc')}
              </p>
              <Button onClick={() => navigate('/referral/partner/apply')} className="mt-4">
                {t('referral.partner.applyButton')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status: pending — Application Under Review */}
      {terms?.partner_section_visible !== false && showPendingSection && (
        <div className="border border-warning-500/30 bg-dark-900 p-5 shadow-[3px_3px_0_0_#000]">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-warning-500/30 bg-warning-500/10 text-warning-400">
              <ClockIcon />
            </div>
            <div className="flex-1">
              <h2 className="font-mono text-sm font-black uppercase tracking-widest text-dark-100">
                {t('referral.partner.underReview')}
              </h2>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-dark-400">
                {t('referral.partner.underReviewDesc')}
              </p>
              {partnerStatus?.latest_application?.created_at && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-dark-500">
                  {t('referral.partner.submittedAt', {
                    date: new Date(partnerStatus.latest_application.created_at).toLocaleDateString(
                      i18n.language,
                    ),
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status: approved — Partner Badge */}
      {terms?.partner_section_visible !== false && showApprovedSection && (
        <div className="border border-success-500/30 bg-dark-900 p-5 shadow-[3px_3px_0_0_#000]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-success-500/30 bg-success-500/10 text-success-400">
              <PartnerIcon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-black uppercase tracking-widest text-dark-100">
                  {t('referral.partner.partnerStatus')}
                </h2>
                <span className="badge-success rounded-none font-mono text-[9px] font-black uppercase tracking-widest">
                  {t('referral.partner.active')}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-dark-400">
                {t('referral.partner.commissionInfo', {
                  percent: partnerStatus?.commission_percent ?? 0,
                })}
              </p>
            </div>
            <Button asChild variant="secondary" className="hidden sm:inline-flex">
              <a href="#withdrawal-section">{t('referral.withdrawal.goToWithdrawal')}</a>
            </Button>
          </div>
        </div>
      )}

      {/* Status: rejected — Rejection Notice */}
      {terms?.partner_section_visible !== false && showRejectedSection && (
        <div className="border border-error-500/30 bg-dark-900 p-5 shadow-[3px_3px_0_0_#000]">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-error-500/30 bg-error-500/10 text-error-400">
              <ExclamationIcon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h2 className="font-mono text-sm font-black uppercase tracking-widest text-dark-100">
                {t('referral.partner.rejected')}
              </h2>
              {partnerStatus?.latest_application?.admin_comment && (
                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-dark-300">
                  {partnerStatus.latest_application.admin_comment}
                </p>
              )}
              <Button onClick={() => navigate('/referral/partner/apply')} className="mt-4">
                {t('referral.partner.reapplyButton')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Partner Campaigns Section ==================== */}

      {terms?.partner_section_visible !== false &&
        isPartner &&
        partnerStatus?.campaigns &&
        partnerStatus.campaigns.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-accent-500/30 bg-accent-500/10 text-accent-400">
                <LinkIcon />
              </div>
              <h2 className="font-mono text-sm font-black uppercase tracking-widest text-dark-100">
                {t('referral.partner.yourCampaigns')}
              </h2>
            </div>

            {partnerStatus.campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}

      {/* ==================== Withdrawal Section (approved partners only) ==================== */}

      {terms?.partner_section_visible !== false && isPartner && (
        <div id="withdrawal-section" className="space-y-6">
          {/* Withdrawal Balance Card */}
          {(withdrawalBalanceLoading || withdrawalHistoryLoading) && !withdrawalBalance && (
            <div className="h-40 animate-pulse border border-dark-300 bg-dark-800" />
          )}
          {withdrawalBalance && (
            <div className="border border-dark-300 bg-dark-900 p-5 shadow-[3px_3px_0_0_#000]">
              <div className="mb-4 flex items-center gap-3 border-b border-dark-300 pb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-accent-500/30 bg-accent-500/10 text-accent-400">
                  <WalletIcon className="h-6 w-6" />
                </div>
                <h2 className="font-mono text-sm font-black uppercase tracking-widest text-dark-100">
                  {t('referral.withdrawal.title')}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="col-span-2 md:col-span-1">
                  <StatCard
                    label={t('referral.withdrawal.available')}
                    value={formatWithCurrency(withdrawalBalance.available_total / 100)}
                    icon={<WalletIcon className="h-5 w-5" />}
                    tone="success"
                  />
                </div>
                <StatCard
                  label={t('referral.withdrawal.totalEarned')}
                  value={formatWithCurrency(withdrawalBalance.total_earned / 100)}
                  icon={<BanknotesIcon className="h-5 w-5" />}
                  tone="neutral"
                />
                <StatCard
                  label={t('referral.withdrawal.withdrawn')}
                  value={formatWithCurrency(withdrawalBalance.withdrawn / 100)}
                  icon={<ArrowUpIcon className="h-5 w-5" />}
                  tone="neutral"
                />
                <StatCard
                  label={t('referral.withdrawal.spent')}
                  value={formatWithCurrency(withdrawalBalance.referral_spent / 100)}
                  icon={<CardIcon className="h-5 w-5" />}
                  tone="neutral"
                />
                <StatCard
                  label={t('referral.withdrawal.pending')}
                  value={formatWithCurrency(withdrawalBalance.pending / 100)}
                  icon={<ArrowDownIcon className="h-5 w-5" />}
                  tone="warning"
                />
              </div>

              <div className="mt-4">
                <Button
                  onClick={() => navigate('/referral/withdrawal/request')}
                  disabled={!withdrawalBalance.can_request}
                  className="w-full sm:w-auto"
                >
                  {t('referral.withdrawal.requestButton')}
                </Button>
                {!withdrawalBalance.can_request && withdrawalBalance.cannot_request_reason ? (
                  <p className="mt-2 text-xs text-dark-500">
                    {withdrawalBalance.cannot_request_reason}
                  </p>
                ) : (
                  withdrawalBalance.min_amount_kopeks > 0 && (
                    <p className="mt-2 text-xs text-dark-500">
                      {t('referral.withdrawal.minAmount', {
                        amount: formatWithCurrency(withdrawalBalance.min_amount_kopeks / 100),
                      })}
                    </p>
                  )
                )}
              </div>
            </div>
          )}

          {/* Withdrawal History */}
          <div className="border border-dark-300 bg-dark-900 p-5 shadow-[3px_3px_0_0_#000]">
            <h2 className="mb-4 border-b border-dark-300 pb-3 font-mono text-sm font-black uppercase tracking-widest text-dark-100">
              {t('referral.withdrawal.history')}
            </h2>
            {withdrawalHistory?.items && withdrawalHistory.items.length > 0 ? (
              <div className="space-y-2">
                {withdrawalHistory.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border border-dark-300 bg-dark-850 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-dark-100">
                          {formatWithCurrency(item.amount_rubles)}
                        </span>
                        <span
                          className={`${getWithdrawalStatusBadge(item.status)} rounded-none font-mono text-[9px] font-black uppercase tracking-widest`}
                        >
                          {t(`referral.withdrawal.status.${item.status}`, item.status)}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-dark-500">
                        {new Date(item.created_at).toLocaleDateString(i18n.language)}
                        {item.payment_details && (
                          <span className="ml-1">
                            &bull;{' '}
                            {item.payment_details.length > 40
                              ? `${item.payment_details.slice(0, 40)}...`
                              : item.payment_details}
                          </span>
                        )}
                      </div>
                      {item.admin_comment && (
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-dark-400">
                          {item.admin_comment}
                        </div>
                      )}
                    </div>
                    {item.status === 'pending' && (
                      <button
                        onClick={() => cancelWithdrawalMutation.mutate(item.id)}
                        disabled={cancelWithdrawalMutation.isPending}
                        className="ml-3 shrink-0 font-mono text-xs font-bold uppercase tracking-wider text-error-400 transition-colors hover:text-error-300"
                      >
                        {t('common.cancel')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-dark-400">
                  {t('referral.withdrawal.noHistory')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
