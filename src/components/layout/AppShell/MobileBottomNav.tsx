import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { usePlatform } from '@/platform';

// Icons
import { HomeIcon, SubscriptionIcon, WalletIcon, UsersIcon, ChatIcon, WheelIcon } from './icons';

interface MobileBottomNavProps {
  isKeyboardOpen: boolean;
  referralEnabled?: boolean;
  wheelEnabled?: boolean;
}

export function MobileBottomNav({
  isKeyboardOpen,
  referralEnabled,
  wheelEnabled,
}: MobileBottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { haptic } = usePlatform();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Core navigation items for bottom bar.
  //
  // Support is ALWAYS present — frustrated paying customers must find help
  // in the primary nav, not in the hamburger drawer. Previously Wheel
  // (a brand-moment surface) displaced Support (a critical-path surface)
  // when the wheel feature flag was on; that trade is hostile to the
  // support-user persona and was flagged by the /impeccable critique.
  //
  // Slot priority when both Wheel and Referral are enabled and only
  // four slots remain after Dashboard / Subscriptions / Balance / Support:
  //   - Wheel wins (operator opted in as a deliberate brand moment)
  //   - Referral falls back to the hamburger drawer
  // When only one of them is enabled, that one fills the slot.
  const coreItems = [
    { path: '/', label: t('nav.dashboard'), icon: HomeIcon },
    { path: '/subscriptions', label: t('nav.subscription'), icon: SubscriptionIcon },
    { path: '/balance', label: t('nav.balance'), icon: WalletIcon },
    ...(wheelEnabled
      ? [{ path: '/wheel', label: t('nav.wheel'), icon: WheelIcon }]
      : referralEnabled
        ? [{ path: '/referral', label: t('nav.referral'), icon: UsersIcon }]
        : []),
    { path: '/support', label: t('nav.support'), icon: ChatIcon },
  ];

  const handleNavClick = () => {
    haptic.impact('light');
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 transition-all duration-200 lg:hidden',
        'bg-dark-900 border-t-2 border-dark-600',
        'shadow-[0_-3px_0_0_#000]',
        isKeyboardOpen ? 'pointer-events-none translate-y-full' : 'translate-y-0',
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around">
        {coreItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={cn(
              'relative flex min-w-0 flex-1 shrink-0 flex-col items-center justify-center px-1 py-2.5 transition-all duration-[80ms]',
              'font-mono text-[9px] font-black uppercase tracking-wider',
              isActive(item.path) ? 'text-accent-500' : 'text-dark-500 hover:text-dark-200',
            )}
          >
            {/* Active top-bar indicator — industrial accent stripe */}
            {isActive(item.path) && (
              <>
                <span className="absolute inset-x-0 top-0 h-[3px] bg-accent-500" />
                <span className="absolute inset-x-0 top-0 h-px bg-accent-400/50" />
              </>
            )}
            <item.icon className="relative z-10 h-5 w-5 mb-0.5" />
            <span className="relative z-10 w-full truncate text-center">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
