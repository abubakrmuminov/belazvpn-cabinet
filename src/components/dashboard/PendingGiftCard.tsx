import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { GiftIcon } from '@/components/icons';
import type { PendingGift } from '../../api/gift';

interface PendingGiftCardProps {
  gifts: PendingGift[];
  className?: string;
}

export default function PendingGiftCard({ gifts, className }: PendingGiftCardProps) {
  const { t } = useTranslation();

  if (gifts.length === 0) return null;

  return (
    <div className={className ?? 'space-y-3'}>
      {gifts.map((gift) => (
        <div
          key={gift.token}
          className="relative overflow-hidden border-2 border-accent-500 bg-dark-900 p-5 shadow-[4px_4px_0_0_#000]"
        >
          <div className="relative flex items-start gap-4">
            {/* Gift icon */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none border border-accent-500 bg-accent-500/10">
              <GiftIcon className="h-6 w-6 text-accent-500" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <h3 className="font-mono text-sm font-black uppercase tracking-wider text-dark-50">{t('gift.pending.title')}</h3>
              <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-dark-300">
                {gift.tariff_name && (
                  <span className="font-bold text-accent-500">
                    {gift.tariff_name} — {gift.period_days} {t('gift.days')}
                  </span>
                )}
                {gift.sender_display && (
                  <span className="ml-1 text-dark-400 font-bold">
                    {t('gift.pending.from', { sender: gift.sender_display })}
                  </span>
                )}
              </p>
              {gift.gift_message && (
                <p className="mt-1.5 line-clamp-2 text-xs italic text-dark-400">
                  &ldquo;{gift.gift_message}&rdquo;
                </p>
              )}
            </div>

            {/* Activate button */}
            <Link
              to={`/gift?tab=activate&code=${gift.token}`}
              className="shrink-0 rounded-none border border-black bg-accent-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-dark-950 shadow-[2px_2px_0_0_#000] transition-all duration-100 hover:bg-accent-400 active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]"
            >
              {t('gift.pending.activate')}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
