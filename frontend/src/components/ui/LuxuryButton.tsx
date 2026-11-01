import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface LuxuryButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'gold' | 'glass' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-[#f5e4ab] border border-amber-300/30 shadow-md shadow-emerald-950/20 hover:border-amber-300/60',
  gold:
    'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-stone-950 font-black border border-amber-200 shadow-md shadow-amber-500/20 hover:shadow-amber-500/35',
  glass:
    'bg-white/60 dark:bg-stone-850/60 backdrop-blur-xl text-stone-800 dark:text-stone-100 border border-white/60 dark:border-stone-700 shadow-sm hover:bg-white/80 dark:hover:bg-stone-800',
  danger:
    'bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/40 shadow-md shadow-rose-950/20',
  ghost:
    'bg-transparent hover:bg-stone-100/70 dark:hover:bg-stone-800/60 text-stone-600 dark:text-stone-300 border border-transparent',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2.5 text-xs sm:text-sm rounded-2xl gap-2',
  lg: 'px-6 py-3.5 text-sm sm:text-base rounded-2xl gap-2.5 font-bold',
};

export const LuxuryButton: React.FC<LuxuryButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <motion.button
      whileHover={disabled || isLoading ? undefined : { scale: 1.02 }}
      whileTap={disabled || isLoading ? undefined : { scale: 0.97 }}
      transition={{
        type: 'spring',
        stiffness: 450,
        damping: 24,
      }}
      disabled={disabled || isLoading}
      className={`relative group inline-flex items-center justify-center font-bold tracking-tight select-none cursor-pointer transition-colors overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {/* Subtle expanding radial glow overlay on hover */}
      <span className="absolute inset-0 w-full h-full bg-radial from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Shimmer light bar sweeping across button */}
      <span className="absolute -inset-full top-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 translate-x-[-150%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none" />

      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0 transition-transform group-hover:scale-110">{icon}</span>
      )}

      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </motion.button>
  );
};
