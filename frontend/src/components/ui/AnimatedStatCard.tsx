import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

export interface AnimatedStatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose';
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  badge?: string;
  onClick?: () => void;
  className?: string;
}

const colorStyles = {
  emerald: {
    iconBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    glow: 'rgba(16, 185, 129, 0.2)',
    borderHover: 'hover:border-emerald-500/50',
    badge: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
    textGradient: 'from-emerald-700 to-teal-800 dark:from-emerald-300 dark:to-teal-200',
  },
  amber: {
    iconBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
    glow: 'rgba(245, 158, 11, 0.22)',
    borderHover: 'hover:border-amber-500/50',
    badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
    textGradient: 'from-amber-600 to-orange-700 dark:from-amber-300 dark:to-orange-200',
  },
  blue: {
    iconBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20',
    glow: 'rgba(14, 165, 233, 0.2)',
    borderHover: 'hover:border-sky-500/50',
    badge: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30',
    textGradient: 'from-sky-700 to-blue-800 dark:from-sky-300 dark:to-blue-200',
  },
  purple: {
    iconBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20',
    glow: 'rgba(168, 85, 247, 0.2)',
    borderHover: 'hover:border-purple-500/50',
    badge: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30',
    textGradient: 'from-purple-700 to-indigo-800 dark:from-purple-300 dark:to-indigo-200',
  },
  rose: {
    iconBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20',
    glow: 'rgba(244, 63, 94, 0.2)',
    borderHover: 'hover:border-rose-500/50',
    badge: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30',
    textGradient: 'from-rose-700 to-pink-800 dark:from-rose-300 dark:to-pink-200',
  },
};

export const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  accentColor = 'emerald',
  trend,
  subtitle,
  badge,
  onClick,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse tracking normalized to center [-0.5, 0.5]
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for 3D physics
  const springConfig = { damping: 20, stiffness: 240, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // 3D rotations based on cursor
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-7, 7]);

  // Dynamic light glare overlay coordinates
  const glareX = useTransform(smoothMouseX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(smoothMouseY, [-0.5, 0.5], ['0%', '100%']);
  const glareOpacity = useTransform(smoothMouseX, (x) => Math.min(Math.abs(x) * 1.6, 0.65));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const theme = colorStyles[accentColor];

  return (
    <div
      style={{ perspective: 1200 }}
      className={`relative select-none ${className}`}
      onClick={onClick}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{
          scale: 1.025,
          boxShadow: `0 24px 48px -12px ${theme.glow}, 0 8px 24px -4px rgba(15, 59, 44, 0.08)`,
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-white/35 dark:bg-stone-900/50 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(15,59,44,0.08)] transition-colors duration-200 cursor-pointer ${theme.borderHover}`}
      >
        {/* Dynamic 3D Glare Reflection */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300"
          style={{
            opacity: glareOpacity,
            background: useTransform(
              [glareX, glareY],
              ([x, y]) =>
                `radial-gradient(circle 240px at ${x} ${y}, rgba(255, 255, 255, 0.5), transparent 80%)`
            ),
          }}
        />

        {/* Floating Content with depth */}
        <div
          style={{ transform: 'translateZ(30px)' }}
          className="relative z-10 flex flex-col justify-between h-full space-y-3"
        >
          {/* Top Row: Icon + Title + Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 shadow-xs ${theme.iconBg}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-600 dark:text-stone-300 block">
                  {title}
                </span>
                {subtitle && (
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>

            {badge && (
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${theme.badge}`}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Center Value: Animated Number */}
          <div className="pt-1">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight flex items-baseline gap-1">
              <AnimatedNumber
                value={value}
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
                className="font-extrabold tracking-tight"
              />
            </div>
          </div>

          {/* Bottom Trend / Footer */}
          {trend && (
            <div className="flex items-center gap-1.5 text-xs font-semibold pt-1 border-t border-emerald-950/5 dark:border-white/5">
              <span
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                  trend.isPositive
                    ? 'text-emerald-700 bg-emerald-500/15 dark:text-emerald-300'
                    : 'text-rose-700 bg-rose-500/15 dark:text-rose-300'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              {trend.label && (
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
