/**
 * MetricCard.tsx — Luxury KPI stat display card
 */
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  isLoading?: boolean;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = '#d8a868',
  trend,
  isLoading,
  highlight = false,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4.5 transition-all hover:shadow-lg ${
        highlight
          ? 'bg-gradient-to-br from-[#1e1c24] to-[#28232D] border-[#d8a868]/40 shadow-[#d8a868]/5'
          : 'bg-[#18161B]/95 border-[#28232D] hover:border-[#d8a868]/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[#968a7e]">{title}</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-8 w-24 bg-[#28232D] animate-pulse rounded" />
            ) : (
              <span className="text-2xl font-bold tracking-tight text-white font-sans">{value}</span>
            )}
          </div>
          {subtitle && <p className="text-xs text-[#968a7e] mt-1">{subtitle}</p>}
        </div>

        <div
          className="p-2.5 rounded-lg border border-[#28232D] bg-[#1e1c24]/90 shrink-0"
          style={{ borderColor: `${iconColor}25` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
      </div>

      {trend && (
        <div className="mt-3.5 flex items-center gap-1.5 pt-2.5 border-t border-[#28232D]/60 text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.value}
          </span>
          {trend.label && <span className="text-[#968a7e]">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
