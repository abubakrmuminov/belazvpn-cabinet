/**
 * Theme-aware glass morphism color tokens.
 * Provides consistent colors for the glassmorphic card components
 * that work on both dark and light backgrounds.
 */
export function getGlassColors(isDark: boolean) {
  return {
    // Card container — solid mechanical panels
    cardBg: isDark
      ? 'rgb(var(--color-dark-900))'
      : '#FFFFFF',
    cardBorder: isDark ? 'rgb(var(--color-dark-600))' : '#A4A9AD',

    // Inner sections (cards within cards)
    innerBg: isDark ? 'rgb(var(--color-dark-950))' : '#F5F5F5',
    innerBorder: isDark ? 'rgb(var(--color-dark-700))' : '#D2D4D7',

    // Hover states
    hoverBg: isDark ? 'rgb(var(--color-dark-800))' : '#EBEBEB',
    hoverBorder: isDark ? 'rgb(var(--color-dark-500))' : '#3E4349',

    // Text
    text: isDark ? '#F5F5F5' : '#1F1F1F',
    textSecondary: isDark ? '#A4A9AD' : '#3E4349',
    textMuted: isDark ? '#80858A' : '#5C6166',
    textFaint: isDark ? '#5C6166' : '#80858A',
    textGhost: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',

    // Progress bar track
    trackBg: isDark ? 'rgb(var(--color-dark-950))' : '#EBEBEB',
    trackBorder: isDark ? 'rgb(var(--color-dark-700))' : '#D2D4D7',

    // Code blocks
    codeBg: isDark ? 'rgb(var(--color-dark-950))' : '#FFFFFF',
    codeBorder: isDark ? 'rgb(var(--color-dark-700))' : '#A4A9AD',

    // Glow effects — reduced
    glowAlpha: '0.1',

    // Mechanical drop shadows for solid depth
    shadow: isDark ? '3px 3px 0 0 #000' : '3px 3px 0 0 rgba(0,0,0,0.2)',
  };
}
