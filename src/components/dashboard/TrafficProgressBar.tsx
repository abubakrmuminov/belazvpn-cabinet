import { useTranslation } from 'react-i18next';
import { useTrafficZone } from '../../hooks/useTrafficZone';
import { formatTraffic } from '../../utils/formatTraffic';

interface TrafficProgressBarProps {
  usedGb: number;
  limitGb: number;
  percent: number;
  isUnlimited: boolean;
  compact?: boolean;
}

const THRESHOLDS = [50, 75, 90];

export default function TrafficProgressBar({
  usedGb: _usedGb,
  limitGb,
  percent,
  isUnlimited,
  compact = false,
}: TrafficProgressBarProps) {
  const { t } = useTranslation();
  const zone = useTrafficZone(percent);

  // Bar styling parameters
  const clampedPercent = Math.min(percent, 100);
  const barHeight = compact ? 8 : 14;

  if (isUnlimited) {
    return (
      <div role="progressbar" aria-label={t('dashboard.unlimited')}>
        {/* Unlimited flowing bar */}
        <div
          className="relative overflow-hidden border border-dark-600 bg-dark-950"
          style={{
            height: barHeight,
          }}
        >
          <div
            className="absolute inset-0 animate-unlimited-flow"
            style={{
              background: `linear-gradient(90deg, rgba(${zone.mainVarRaw}, 0.2), ${zone.mainVar}, rgba(${zone.mainVarRaw}, 0.2))`,
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clampedPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${t('subscription.traffic')}: ${clampedPercent.toFixed(1)}%`}
    >
      {/* Track */}
      <div
        className="relative overflow-hidden border border-dark-600 bg-dark-950"
        style={{
          height: barHeight,
        }}
      >
        {/* Fill bar */}
        <div
          className="absolute bottom-0 left-0 top-0 w-full origin-left transition-transform duration-700 ease-out border-r border-black"
          style={{
            transform: `scaleX(${clampedPercent / 100})`,
            backgroundColor: zone.mainVar,
          }}
        />

        {/* Threshold markers */}
        {THRESHOLDS.map((threshold) => (
          <div
            key={threshold}
            className="absolute bottom-0 top-0 w-[2px] bg-black/60"
            style={{
              left: `${threshold}%`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Scale labels */}
      {!compact && limitGb > 0 && (
        <div
          className="mt-1.5 flex justify-between px-0.5 font-mono text-[9px] font-bold text-dark-500 uppercase"
          aria-hidden="true"
        >
          {[0, 25, 50, 75, 100].map((v) => (
            <span key={v}>{formatTraffic((limitGb * v) / 100)}</span>
          ))}
        </div>
      )}
    </div>
  );
}
