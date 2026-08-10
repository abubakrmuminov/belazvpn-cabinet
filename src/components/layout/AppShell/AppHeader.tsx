import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { initDataUser } from '@telegram-apps/sdk-react';

import { useAuthStore } from '@/store/auth';
import { displayName } from '@/utils/displayName';
import { useShallow } from 'zustand/shallow';
import { useTheme } from '@/hooks/useTheme';
import { usePlatform } from '@/platform';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
  isLogoPreloaded,
} from '@/api/branding';
import { themeColorsApi } from '@/api/themeColors';
import { cn } from '@/lib/utils';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import TicketNotificationBell from '@/components/TicketNotificationBell';

// Icons
import {
  HomeIcon,
  SubscriptionIcon,
  WalletIcon,
  UsersIcon,
  ChatIcon,
  UserIcon,
  LogoutIcon,
  GamepadIcon,
  ClipboardIcon,
  InfoIcon,
  CogIcon,
  WheelIcon,
  GiftIcon,
  MenuIcon,
  CloseIcon,
  SunIcon,
  MoonIcon,
  SearchIcon,
} from './icons';

const FALLBACK_NAME = import.meta.env.VITE_APP_NAME || 'Cabinet';
const FALLBACK_LOGO = import.meta.env.VITE_APP_LOGO || 'V';

import type { TelegramPlatform } from '@/hooks/useTelegramSDK';

interface AppHeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onCommandPaletteOpen: () => void;
  headerHeight: number;
  isFullscreen: boolean;
  safeAreaInset: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset: { top: number; bottom: number; left: number; right: number };
  telegramPlatform?: TelegramPlatform;
  wheelEnabled?: boolean;
  referralEnabled?: boolean;
  hasContests?: boolean;
  hasPolls?: boolean;
  giftEnabled?: boolean;
}

export function AppHeader({
  mobileMenuOpen,
  setMobileMenuOpen,
  onCommandPaletteOpen,
  headerHeight,
  isFullscreen,
  safeAreaInset,
  contentSafeAreaInset,
  telegramPlatform,
  wheelEnabled,
  referralEnabled,
  hasContests,
  hasPolls,
  giftEnabled,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuthStore(
    useShallow((state) => ({ user: state.user, logout: state.logout, isAdmin: state.isAdmin })),
  );
  const { toggleTheme, isDark } = useTheme();
  const { haptic, platform } = usePlatform();
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(() => isLogoPreloaded());

  // Branding
  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      setCachedBranding(data);
      await preloadLogo(data);
      return data;
    },
    initialData: getCachedBranding() ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: 60000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const appName = branding ? branding.name : FALLBACK_NAME;
  const logoLetter = branding?.logo_letter || FALLBACK_LOGO;
  const hasCustomLogo = branding?.has_custom_logo || false;
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;

  // Theme toggle visibility
  const { data: enabledThemes } = useQuery({
    queryKey: ['enabled-themes'],
    queryFn: themeColorsApi.getEnabledThemes,
    staleTime: 1000 * 60 * 5,
  });
  const canToggle = enabledThemes?.dark && enabledThemes?.light;

  // Get user photo from Telegram
  useEffect(() => {
    try {
      const user = initDataUser();
      if (user?.photo_url) {
        setUserPhotoUrl(user.photo_url);
      }
    } catch {
      // Not in Telegram or init data not available
    }
  }, []);

  // Lock scroll when menu is open (works in iframe/Telegram Mini App)
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const preventDefault = (e: TouchEvent) => {
      // Allow scrolling inside menu content
      const target = e.target as HTMLElement;
      if (target.closest('.mobile-menu-content')) return;
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  const isAdminActive = () => location.pathname.startsWith('/admin');

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: HomeIcon },
    { path: '/subscriptions', label: t('nav.subscription'), icon: SubscriptionIcon },
    { path: '/balance', label: t('nav.balance'), icon: WalletIcon },
    ...(referralEnabled ? [{ path: '/referral', label: t('nav.referral'), icon: UsersIcon }] : []),
    { path: '/support', label: t('nav.support'), icon: ChatIcon },
    ...(hasContests ? [{ path: '/contests', label: t('nav.contests'), icon: GamepadIcon }] : []),
    ...(hasPolls ? [{ path: '/polls', label: t('nav.polls'), icon: ClipboardIcon }] : []),
    ...(wheelEnabled ? [{ path: '/wheel', label: t('nav.wheel'), icon: WheelIcon }] : []),
    ...(giftEnabled ? [{ path: '/gift', label: t('nav.gift'), icon: GiftIcon }] : []),
    { path: '/info', label: t('nav.info'), icon: InfoIcon },
  ];

  return (
    <>
      {/* Header - only on mobile */}
      <header
        className="fixed left-0 right-0 top-0 z-50 bg-dark-900 border-b-2 border-dark-300 shadow-[0_2px_0_0_rgba(0,0,0,0.6)] lg:hidden"
        style={{
          paddingTop: isFullscreen
            ? `${Math.max(safeAreaInset.top, contentSafeAreaInset.top) + (telegramPlatform === 'android' ? 48 : 45)}px`
            : undefined,
        }}
      >
        {/* Top hazard line */}
        <div className="h-1.5 w-full hazard-stripes" />
        <div
          className="mx-auto w-full px-4"
          onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}
        >
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={cn('flex flex-shrink-0 items-center gap-2.5', !appName && 'mr-4')}
            >
              <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-none border border-dark-400 bg-dark-850 shadow-[2px_2px_0_0_#000]">
                <span
                  className={cn(
                    'absolute text-sm font-black text-accent-500 transition-opacity duration-200',
                    hasCustomLogo && logoLoaded ? 'opacity-0' : 'opacity-100',
                  )}
                >
                  {logoLetter}
                </span>
                {hasCustomLogo && logoUrl && (
                  <img
                    src={logoUrl}
                    alt={appName || 'Logo'}
                    className={cn(
                      'absolute h-full w-full object-contain transition-opacity duration-200',
                      logoLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                    onLoad={() => setLogoLoaded(true)}
                  />
                )}
              </div>
              {appName && (
                <span className="whitespace-nowrap text-sm font-black tracking-tighter text-industrial-yellow uppercase">
                  {appName}
                </span>
              )}
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              {/* Command palette trigger (web only) */}
              {platform !== 'telegram' && (
                <button
                  onClick={() => {
                    haptic.impact('light');
                    onCommandPaletteOpen();
                  }}
                  className="touch-target hidden items-center justify-center rounded-none border border-dark-300 bg-dark-850 p-2 text-dark-200 shadow-[2px_2px_0_0_#000] transition-all duration-100 hover:bg-accent-500 hover:text-dark-950 sm:flex active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]"
                  title="Search (⌘K)"
                >
                  <SearchIcon className="h-5 w-5" />
                </button>
              )}

              {/* Theme toggle */}
              {canToggle && (
                <button
                  onClick={() => {
                    haptic.impact('light');
                    toggleTheme();
                    setMobileMenuOpen(false);
                  }}
                  className="touch-target flex items-center justify-center rounded-none border border-dark-300 bg-dark-850 p-2 text-dark-200 shadow-[2px_2px_0_0_#000] transition-all duration-100 hover:bg-accent-500 hover:text-dark-950 active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]"
                  title={isDark ? t('theme.light') || 'Light mode' : t('theme.dark') || 'Dark mode'}
                >
                  {isDark ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                </button>
              )}

              <div onClick={() => setMobileMenuOpen(false)}>
                <TicketNotificationBell isAdmin={isAdminActive()} />
              </div>
              <div onClick={() => setMobileMenuOpen(false)}>
                <LanguageSwitcher />
              </div>

              {/* Mobile menu button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.impact('light');
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className={cn(
                  'touch-target flex items-center justify-center rounded-none border p-2.5 shadow-[2px_2px_0_0_#000] transition-all duration-100 active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]',
                  mobileMenuOpen
                    ? 'border-accent-500 bg-accent-500 text-dark-950'
                    : 'border-dark-300 bg-dark-850 text-dark-200 hover:bg-dark-700 hover:text-dark-50',
                )}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <CloseIcon className="h-5 w-5" />
                ) : (
                  <MenuIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 animate-fade-in lg:hidden"
          style={{ top: headerHeight }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dark-950/80"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu content */}
          <div
            className="mobile-menu-content absolute inset-x-0 bottom-0 top-0 overflow-y-auto overscroll-contain border-t-2 border-dark-300 bg-dark-900 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="mx-auto max-w-6xl px-4 py-4">
              {/* User info */}
              <div className="mb-4 flex items-center justify-between border-b-2 border-dark-700 pb-4">
                <div className="flex items-center gap-3">
                  {userPhotoUrl ? (
                    <img
                      src={userPhotoUrl}
                      alt="Avatar"
                      className="h-10 w-10 rounded-none border border-dark-500 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-none border border-dark-500 bg-dark-800',
                      userPhotoUrl ? 'hidden' : '',
                    )}
                  >
                    <UserIcon className="h-5 w-5 text-dark-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold uppercase tracking-wider text-dark-50">
                      {displayName(user)}
                    </div>
                    <div className="truncate font-mono text-xs text-dark-400">
                      @{user?.username || `ID: ${user?.telegram_id}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nav items */}
              <nav className="space-y-0.5">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 border-l-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-100',
                      isActive(item.path)
                        ? 'border-accent-500 bg-accent-500/10 text-accent-500'
                        : 'border-transparent text-dark-300 hover:border-dark-500 hover:bg-dark-800 hover:text-dark-50',
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                ))}

                {isAdmin && (
                  <>
                    <div className="my-3 border-t-2 border-dark-700" />
                    <div className="px-4 py-1 font-mono text-xs font-bold uppercase tracking-widest text-dark-500">
                      {t('admin.nav.title')}
                    </div>
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 border-l-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-100',
                        isAdminActive()
                          ? 'border-warning-500 bg-warning-500/10 text-warning-400'
                          : 'border-transparent text-warning-500/70 hover:border-warning-500/50 hover:bg-dark-800',
                      )}
                    >
                      <CogIcon className="h-5 w-5 shrink-0" />
                      {t('admin.nav.title')}
                    </Link>
                  </>
                )}

                <div className="my-3 border-t-2 border-dark-700" />

                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 border-l-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-100',
                    isActive('/profile')
                      ? 'border-accent-500 bg-accent-500/10 text-accent-500'
                      : 'border-transparent text-dark-300 hover:border-dark-500 hover:bg-dark-800 hover:text-dark-50',
                  )}
                >
                  <UserIcon className="h-5 w-5 shrink-0" />
                  {t('nav.profile')}
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-3 text-sm font-bold uppercase tracking-wider text-error-400 transition-all duration-100 hover:border-error-500 hover:bg-dark-800"
                >
                  <LogoutIcon className="h-5 w-5 shrink-0" />
                  {t('nav.logout')}
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
