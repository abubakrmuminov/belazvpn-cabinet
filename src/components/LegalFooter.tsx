import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlatform } from '@/platform';

interface LegalLink {
  href: string;
  labelKey: string;
  fallback: string;
}

const LINKS: LegalLink[] = [
  { href: '/offer', labelKey: 'footer.offer', fallback: 'Пользовательское соглашение' },
  { href: '/privacy', labelKey: 'footer.privacy', fallback: 'Политика конфиденциальности' },
  { href: '/recurrent-payments', labelKey: 'footer.recurrent', fallback: 'Рекуррентные платежи' },
];

interface LegalFooterProps {
  className?: string;
}

export default function LegalFooter({ className = '' }: LegalFooterProps) {
  const { t } = useTranslation();
  const { openLink } = usePlatform();

  return (
    <footer
      className={`flex flex-col items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-dark-500 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
        {LINKS.map((link, index) => (
          <Fragment key={link.href}>
            {index > 0 && (
              <span className="text-dark-700" aria-hidden="true">
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => openLink(`${window.location.origin}${link.href}`)}
              className="transition-colors hover:text-accent-400"
            >
              {t(link.labelKey, link.fallback)}
            </button>
          </Fragment>
        ))}
      </div>
      <div className="text-[10px] tracking-wider uppercase opacity-60">
        Платега тест
      </div>
    </footer>
  );
}
