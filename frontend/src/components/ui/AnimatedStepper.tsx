import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AnimatedStepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  direction?: number;
  children: React.ReactNode;
  className?: string;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    filter: 'blur(4px)',
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      x: { type: 'spring' as const, stiffness: 340, damping: 28 },
      opacity: { duration: 0.25 },
      filter: { duration: 0.2 },
      scale: { duration: 0.25 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
    filter: 'blur(4px)',
    scale: 0.98,
    transition: {
      x: { type: 'spring' as const, stiffness: 340, damping: 28 },
      opacity: { duration: 0.2 },
      filter: { duration: 0.15 },
      scale: { duration: 0.2 },
    },
  }),
};

export const AnimatedStepper: React.FC<AnimatedStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  direction = 1,
  children,
  className = '',
}) => {
  const progressPercent =
    steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 100;

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {/* ── Stepper Navigation Bar ────────────────────────────────────────── */}
      <div className="relative mb-5 px-3">
        {/* Connecting Progress Track Line */}
        <div className="absolute top-5 right-8 left-8 h-1 bg-stone-200/70 dark:bg-stone-800 rounded-full overflow-hidden -z-0">
          <motion.div
            className="h-full bg-gradient-to-l from-emerald-600 via-emerald-700 to-[#0f3b2c] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          />
        </div>

        {/* Step Circles & Labels */}
        <div className="relative z-10 flex justify-between items-start">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isUpcoming = idx > currentStep;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (onStepClick && (isCompleted || isCurrent)) {
                    onStepClick(idx);
                  }
                }}
                className={`flex flex-col items-center group ${
                  isCompleted || isCurrent ? 'cursor-pointer' : 'cursor-default opacity-90'
                }`}
              >
                {/* Step Circle Pill */}
                <motion.div
                  whileHover={isCompleted || isCurrent ? { scale: 1.08 } : {}}
                  whileTap={isCompleted || isCurrent ? { scale: 0.96 } : {}}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-extrabold text-xs transition-all duration-200 ${
                    isCompleted
                      ? 'bg-[#0f3b2c] text-emerald-300 shadow-md shadow-emerald-950/20'
                      : isCurrent
                      ? 'bg-gradient-to-br from-[#0f3b2c] to-[#164e3b] text-amber-300 ring-4 ring-emerald-500/25 shadow-lg shadow-emerald-950/30'
                      : 'bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 ring-1 ring-stone-200/80 dark:ring-stone-700/80 shadow-2xs'
                  }`}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </motion.div>
                  ) : Icon ? (
                    <Icon className="w-4.5 h-4.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </motion.div>

                {/* Step Text Label */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs block transition-colors ${
                      isCurrent
                        ? 'text-[#0f3b2c] dark:text-emerald-300 font-black'
                        : isCompleted
                        ? 'text-emerald-800 dark:text-emerald-400 font-bold'
                        : 'text-stone-400 dark:text-stone-500 font-medium'
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.subtitle && (
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 hidden sm:block mt-0.5 font-medium">
                      {step.subtitle}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Animated Step Content with Directional Sliding ───────────────── */}
      <div className="relative overflow-hidden flex-1 min-h-0">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
