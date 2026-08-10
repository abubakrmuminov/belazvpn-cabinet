import { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { newsApi } from '../../api/news';
import { useHapticFeedback } from '../../platform/hooks/useHaptic';
import { cn } from '../../lib/utils';
import { ArrowIcon, NewsIcon } from '@/components/icons';
import type { NewsListItem } from '../../types/news';

// --- Security: hex color validation to prevent CSS injection ---
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
function safeColor(color: string | null | undefined, fallback = '#888888'): string {
  if (!color || !HEX_COLOR_RE.test(color)) return fallback;
  return color;
}

// --- Animation variants ---
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const fadeSlideUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: EASE_OUT,
    },
  }),
};

// --- Sub-components ---

interface CategoryBadgeProps {
  category: string;
  color: string;
  className?: string;
}

const CategoryBadge = memo(function CategoryBadge({
  category,
  color,
  className,
}: CategoryBadgeProps) {
  const c = safeColor(color);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-none px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest border',
        className,
      )}
      style={{
        color: c,
        background: `${c}10`,
        borderColor: `${c}50`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-none"
        style={{
          background: c,
        }}
      />
      {category}
    </span>
  );
});

interface TagBadgeProps {
  text: string;
  color: string;
}

const TagBadge = memo(function TagBadge({ text, color }: TagBadgeProps) {
  const c = safeColor(color);
  return (
    <span
      className="inline-block rounded-none px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider border"
      style={{
        color: c,
        borderColor: `${c}33`,
        background: `${c}11`,
      }}
    >
      {text}
    </span>
  );
});

interface FilterTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

const FilterTabs = memo(function FilterTabs({ categories, active, onChange }: FilterTabsProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();

  return (
    <div className="flex flex-wrap gap-2.5" role="tablist" aria-label={t('news.title')}>
      {/* "All" tab — empty string means no filter */}
      <button
        role="tab"
        aria-selected={active === ''}
        onClick={() => {
          haptic.selectionChanged();
          onChange('');
        }}
        className={cn(
          'min-h-[38px] rounded-none px-4 py-2 font-mono text-[10px] font-black uppercase tracking-widest transition-all duration-100',
          active === ''
            ? 'border-2 border-black bg-accent-500 text-dark-950 shadow-[2px_2px_0_0_#000]'
            : 'border border-dark-300 bg-dark-900 text-dark-400 hover:bg-dark-850 shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#000]',
        )}
      >
        {t('news.filterAll')}
      </button>
      {categories.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              haptic.selectionChanged();
              onChange(cat);
            }}
            className={cn(
              'min-h-[38px] rounded-none px-4 py-2 font-mono text-[10px] font-black uppercase tracking-widest transition-all duration-100',
              isActive
                ? 'border-2 border-black bg-accent-500 text-dark-950 shadow-[2px_2px_0_0_#000]'
                : 'border border-dark-300 bg-dark-900 text-dark-400 hover:bg-dark-850 shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#000]',
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
});

interface FeaturedCardProps {
  item: NewsListItem;
  onClick: () => void;
}

const FeaturedCard = memo(function FeaturedCard({ item, onClick }: FeaturedCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <motion.article
      custom={0}
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group col-span-full cursor-pointer border-2 border-accent-500 bg-dark-900 shadow-[4px_4px_0_0_#000] transition-all duration-100 hover:border-accent-400 hover:shadow-[6px_6px_0_0_#000] focus-visible:outline-none"
      onClick={onClick}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-accent-500" />

      <div className="flex min-h-[200px] flex-col justify-between p-6 sm:p-8">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <CategoryBadge category={item.category} color={item.category_color} />
            {item.tag && <TagBadge text={item.tag} color={item.category_color} />}
            <span className="ml-auto font-mono text-[10px] font-bold uppercase tracking-widest text-dark-500">
              {item.read_time_minutes} {t('news.readTime')}
            </span>
          </div>

          <h2 className="mb-3 max-w-[700px] break-words font-mono text-xl font-black uppercase leading-tight tracking-tight text-dark-50 group-hover:text-white sm:text-2xl">
            {item.title}
          </h2>

          {item.excerpt && (
            <p className="max-w-[600px] font-mono text-xs leading-relaxed text-dark-400 uppercase tracking-wide">
              {item.excerpt}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-dark-300 pt-4">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-dark-600">
            {item.published_at ? new Date(item.published_at).toLocaleDateString(i18n.language) : ''}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-black uppercase tracking-widest text-accent-400 transition-all duration-100 group-hover:gap-2.5">
            {t('news.readMore')}
            <ArrowIcon />
          </span>
        </div>
      </div>
    </motion.article>
  );
});

interface NewsCardProps {
  item: NewsListItem;
  index: number;
  onClick: () => void;
}

const NewsCard = memo(function NewsCard({ item, index, onClick }: NewsCardProps) {
  const { t, i18n } = useTranslation();
  const color = safeColor(item.category_color);

  return (
    <motion.article
      custom={index + 1}
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-pointer border border-dark-300 bg-dark-900 shadow-[3px_3px_0_0_#000] transition-all duration-100 hover:border-accent-500/60 hover:shadow-[5px_5px_0_0_#000] focus-visible:outline-none"
      onClick={onClick}
    >
      {/* Colored left border accent */}
      <div className="flex h-full min-h-[200px] flex-col justify-between">
        <div className="flex flex-1">
          <div
            className="w-1 flex-shrink-0"
            style={{ background: color }}
          />
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 font-mono text-[9px] font-black uppercase tracking-widest"
                style={{ color }}
              >
                <span
                  className="h-[5px] w-[5px] rounded-none"
                  style={{ background: color }}
                />
                {item.category}
              </span>
              {item.tag && <TagBadge text={item.tag} color={color} />}
            </div>

            <h3 className="mb-2 break-words font-mono text-sm font-black uppercase leading-snug tracking-tight text-dark-100 group-hover:text-white">
              {item.title}
            </h3>

            {item.excerpt && (
              <p className="font-mono text-[11px] leading-relaxed text-dark-400 uppercase tracking-wide">{item.excerpt}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-dark-300 px-5 py-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-dark-600">
            {item.published_at ? new Date(item.published_at).toLocaleDateString(i18n.language) : ''}
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-dark-500">
            {item.read_time_minutes} {t('news.readTime')}
          </span>
        </div>
      </div>
    </motion.article>
  );
});

// Thin wrapper that binds the per-item click handler without creating a new
// anonymous lambda in the parent's JSX on every render, which would defeat
// the memo on NewsCard.
interface NewsCardWrapperProps {
  item: NewsListItem;
  index: number;
  onCardClick: (slug: string) => void;
}

const NewsCardWrapper = memo(function NewsCardWrapper({
  item,
  index,
  onCardClick,
}: NewsCardWrapperProps) {
  const handleClick = useCallback(() => onCardClick(item.slug), [item.slug, onCardClick]);
  return <NewsCard item={item} index={index} onClick={handleClick} />;
});

// --- Main Component ---

const NEWS_LIMIT = 6;

export default function NewsSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const [filter, setFilter] = useState<string>('');
  const [limit, setLimit] = useState(NEWS_LIMIT);

  const categoryParam = filter || undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['news', 'list', categoryParam, limit],
    queryFn: () => newsApi.getNews({ category: categoryParam, limit, offset: 0 }),
    // staleTime: serve cached data for 2 min before background re-fetch.
    // gcTime: keep in cache for 10 min so navigating away and back is instant.
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const categories = data?.categories ?? [];

  // Memoized so FeaturedCard/NewsCard receive stable object references when
  // parent state unrelated to the list changes (e.g. load-more button state).
  const { featured, regular } = useMemo(
    () => ({
      featured: items.find((n) => n.is_featured),
      regular: items.filter((n) => !n.is_featured),
    }),
    [items],
  );

  const handleCardClick = useCallback(
    (slug: string) => {
      haptic.buttonPress();
      navigate(`/news/${slug}`);
    },
    [haptic, navigate],
  );

  const handleLoadMore = useCallback(() => {
    haptic.buttonPress();
    setLimit((prev) => prev + NEWS_LIMIT);
  }, [haptic]);

  const handleFilterChange = useCallback((category: string) => {
    setFilter(category);
    setLimit(NEWS_LIMIT);
  }, []);

  // Stable reference for the featured card — avoids re-rendering FeaturedCard
  // when `featured` is a new object reference but contains the same slug.
  const featuredSlug = featured?.slug;
  const handleFeaturedClick = useCallback(() => {
    if (featuredSlug) handleCardClick(featuredSlug);
  }, [featuredSlug, handleCardClick]);

  // Don't render until we know there are news items.
  // This prevents the skeleton from briefly flashing when there are no articles.
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="relative border border-dark-300 bg-dark-950 shadow-[4px_4px_0_0_#000]">
      {/* Top hazard bar */}
      <div className="h-1 w-full bg-accent-500" />

      <div className="px-5 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <motion.div
          variants={fadeSlideUp}
          custom={0}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-3 border-b border-dark-300 pb-4">
            <div className="flex h-8 w-8 items-center justify-center border border-accent-500 bg-accent-500/10">
              <NewsIcon className="h-[16px] w-[16px] text-accent-400" />
            </div>
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-dark-200">
              {t('news.title')}
            </span>
          </div>

          {categories.length > 0 && (
            <FilterTabs categories={categories} active={filter} onChange={handleFilterChange} />
          )}
        </motion.div>

        {/* Grid */}
        {items.length > 0 && (
          <div className="space-y-4">
            {featured && <FeaturedCard item={featured} onClick={handleFeaturedClick} />}
            {regular.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
                {regular.map((item, i) => (
                  <NewsCardWrapper
                    key={item.id}
                    item={item}
                    index={i}
                    onCardClick={handleCardClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Load more */}
        {!isLoading && items.length < total && (
          <motion.div
            variants={fadeSlideUp}
            custom={6}
            initial="hidden"
            animate="visible"
            className="mt-10 text-center"
          >
            <button
              onClick={handleLoadMore}
              className="min-h-[44px] rounded-none border border-dark-300 bg-dark-900 px-8 py-3 font-mono text-[11px] font-black uppercase tracking-widest text-dark-400 shadow-[2px_2px_0_0_#000] transition-all hover:border-accent-500/50 hover:text-accent-400 active:translate-y-[1px] active:shadow-[1px_1px_0_0_#000]"
            >
              {t('news.loadMore')}
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
