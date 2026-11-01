import React, { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    stiffness: 80,
    damping: 24,
    restDelta: 0.001,
  });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsubscribe = springVal.on('change', (latest) => {
      if (ref.current) {
        const formatted = Number(latest).toLocaleString('ar-EG', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        ref.current.textContent = `${prefix}${formatted}${suffix ? ` ${suffix}` : ''}`;
      }
    });

    return () => unsubscribe();
  }, [springVal, decimals, prefix, suffix]);

  return (
    <span 
      ref={ref} 
      className={`tabular-nums font-mono ${className}`}
    >
      {prefix}{value.toLocaleString('ar-EG', { minimumFractionDigits: decimals })}{suffix ? ` ${suffix}` : ''}
    </span>
  );
};
