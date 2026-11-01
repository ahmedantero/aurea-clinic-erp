import React, { ReactNode } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral' | 'gold';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/70',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/70',
    info: 'bg-sky-50 text-sky-800 border-sky-200/70',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/70',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200/70',
    gold: 'bg-amber-50/80 text-amber-900 border-[#d4af37]/40',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border shadow-2xs transition-colors ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
