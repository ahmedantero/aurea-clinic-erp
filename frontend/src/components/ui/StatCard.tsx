import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
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
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20',
    glow: 'rgba(16, 185, 129, 0.15)',
    borderHover: 'hover:border-emerald-500/40',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20',
    glow: 'rgba(245, 158, 11, 0.18)',
    borderHover: 'hover:border-amber-500/40',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  },
  blue: {
    iconBg: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border-sky-500/20',
    glow: 'rgba(14, 165, 233, 0.15)',
    borderHover: 'hover:border-sky-500/40',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  },
  purple: {
    iconBg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20',
    glow: 'rgba(168, 85, 247, 0.15)',
    borderHover: 'hover:border-purple-500/40',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  },
  rose: {
    iconBg: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500/20',
    glow: 'rgba(244, 63, 94, 0.15)',
    borderHover: 'hover:border-rose-500/40',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  accentColor = 'emerald',
  trend,
  subtitle,
  badge,
  onClick,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values tracking mouse position within the card normalized [-0.5, 0.5]
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for magnetic rotation physics
  const springConfig = { damping: 22, stiffness: 260, mass: 0.6 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // 3D Rotations (Subtle and tactile: tilt up to 9 degrees)
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-8, 8]);

  // Glare / Dynamic Shine coordinates
  const glareX = useTransform(smoothMouseX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(smoothMouseY, [-0.5, 0.5], ['0%', '100%']);
  const glareOpacity = useTransform(
    smoothMouseX,
    (latestX) => Math.min(Math.abs(latestX) * 1.5, 0.6)
  );

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
      style={{ perspective: 1000 }}
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
          boxShadow: `0 20px 40px -15px ${theme.glow}, 0 8px 16px -6px rgba(0, 0, 0, 0.05)`,
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-white/70 dark:bg-stone-900/60 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] transition-colors duration-200 cursor-pointer ${theme.borderHover}`}
      >
        {/* Dynamic 3D Glare / Light Reflection Overlay */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300"
          style={{
            opacity: glareOpacity,
            background: useTransform(
              [glareX, glareY],
              ([x, y]) =>
                `radial-gradient(circle 220px at ${x} ${y}, rgba(255, 255, 255, 0.45), transparent 80%)`
            ),
          }}
        />

        {/* Floating Content with Z-Depth */}
        <div style={{ transform: 'translateZ(30px)' }} className="relative z-10 flex flex-col justify-between h-full space-y-3">
          {/* Header Row: Icon + Title + Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 shadow-xs ${theme.iconBg}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
                  {title}
                </span>
                {subtitle && (
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 block">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>

            {badge && (
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${theme.badge}`}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Value + Trend Row */}
          <div className="flex items-end justify-between pt-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight tabular-nums font-sans">
              {value}
            </div>

            {trend && (
              <div
                className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${
                  trend.isPositive
                    ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-rose-700 bg-rose-500/10 dark:text-rose-400'
                }`}
              >
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{trend.value}</span>
                {trend.label && (
                  <span className="text-[10px] font-normal opacity-80 mr-1">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ambient Corner Accent Glow */}
        <div
          className="pointer-events-none absolute -bottom-6 -left-6 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity"
          style={{ backgroundColor: theme.glow }}
        />
      </motion.div>
    </div>
  );
};
