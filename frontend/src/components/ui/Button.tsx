import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-base rounded-2xl gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#0f3b2c] text-white hover:bg-[#164e3b] border border-[#d4af37]/30 shadow-xs active:scale-[0.98]',
    secondary:
      'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200/80 shadow-2xs active:scale-[0.98]',
    outline:
      'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200/80 shadow-2xs active:scale-[0.98]',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 border border-rose-700/30 shadow-xs active:scale-[0.98]',
    ghost:
      'bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-transparent',
    gold:
      'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold hover:brightness-105 border border-amber-400 shadow-xs active:scale-[0.98]',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
