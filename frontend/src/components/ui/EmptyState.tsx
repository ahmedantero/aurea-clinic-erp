import React, { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  children,
}) => {
  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
      <div className="relative mb-4">
        {/* Subtle decorative glow */}
        <div className="absolute inset-0 bg-emerald-100/60 rounded-full blur-xl transform scale-150"></div>
        <div className="relative w-16 h-16 rounded-2xl bg-stone-100/80 border border-stone-200/80 flex items-center justify-center text-stone-400 shadow-xs">
          <Icon className="w-8 h-8 text-stone-500" strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-base font-bold text-stone-800 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-stone-500 mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0f3b2c] hover:bg-[#164e3b] rounded-xl shadow-xs transition-all cursor-pointer border border-[#d4af37]/30"
        >
          {actionText}
        </button>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
