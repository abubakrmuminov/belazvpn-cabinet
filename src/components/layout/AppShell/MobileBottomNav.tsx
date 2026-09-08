import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { usePlatform } from '@/platform';
import { HIDDEN_UNDER_KEYBOARD, useVirtualKeyboard } from '@/hooks/useVirtualKeyboard';

import { HomeIcon, SubscriptionIcon, WalletIcon, UsersIcon, ChatIcon, WheelIcon } from './icons';
import type { MobileNavItem, MobileNavKey } from './mobileNavRoutes';

type NavIcon = React.ComponentType<{ className?: string }>;

const ICONS: Record<MobileNavKey, NavIcon> = {
  dashboard: HomeIcon,
  subscription: SubscriptionIcon,
  balance: WalletIcon,
  wheel: WheelIcon,
  referral: UsersIcon,
  support: ChatIcon,
};

interface MobileBottomNavProps {
  /** Экраны панели — из mobileNavItems(); AppShell рендерит панель только на них. */
  items: readonly MobileNavItem[];
  /** Открыто выезжающее меню шапки: у него есть все те же пункты, панель поверх него лишняя. */
  isMenuOpen?: boolean;
}

export function MobileBottomNav({ items, isMenuOpen = false }: MobileBottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { haptic } = usePlatform();
  const isKeyboardOpen = useVirtualKeyboard();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleNavClick = () => {
    haptic.impact('light');
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 transition-all duration-200 lg:hidden',
        'bg-dark-900 border-t-2 border-dark-600',
        'shadow-[0_-3px_0_0_#000]',
        isKeyboardOpen || isMenuOpen ? HIDDEN_UNDER_KEYBOARD : 'opacity-100',
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around">
        {items.map((item) => {
          const Icon = ICONS[item.key];
          return (
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
              {Icon && <Icon className="relative z-10 h-5 w-5 mb-0.5" />}
              <span className="relative z-10 w-full truncate text-center">{t(`nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
