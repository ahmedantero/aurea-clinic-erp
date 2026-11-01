import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CalendarPlus, UserPlus, Receipt, ArrowDownToLine, Sparkles } from 'lucide-react';

export interface SpeedDialAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color?: string;
  badge?: string;
}

interface SpeedDialProps {
  actions?: SpeedDialAction[];
  onOpenNewAppointment?: () => void;
  onNavigate?: (tab: string) => void;
}

export const SpeedDial: React.FC<SpeedDialProps> = ({
  actions,
  onOpenNewAppointment,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Default quick actions if none provided
  const defaultActions: SpeedDialAction[] = [
    {
      id: 'new-apt',
      label: 'تسجيل حجز جديد',
      icon: CalendarPlus,
      color: 'from-emerald-600 to-teal-700 text-white',
      badge: 'سريع',
      onClick: () => {
        setIsOpen(false);
        if (onOpenNewAppointment) onOpenNewAppointment();
      },
    },
    {
      id: 'new-client',
      label: 'إضافة ملف عميل',
      icon: UserPlus,
      color: 'from-amber-500 to-amber-600 text-stone-900',
      onClick: () => {
        setIsOpen(false);
        if (onNavigate) onNavigate('clients');
      },
    },
    {
      id: 'new-expense',
      label: 'تسجيل مصروف جديد',
      icon: Receipt,
      color: 'from-rose-600 to-rose-700 text-white',
      onClick: () => {
        setIsOpen(false);
        if (onNavigate) onNavigate('expenses');
      },
    },
    {
      id: 'dispatch',
      label: 'إذن صرف مستهلكات',
      icon: ArrowDownToLine,
      color: 'from-sky-600 to-indigo-700 text-white',
      onClick: () => {
        setIsOpen(false);
        if (onNavigate) onNavigate('dispatches');
      },
    },
  ];

  const items = actions || defaultActions;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start select-none print:hidden">
      {/* Background Dimmed Overlay when Open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-stone-950/25 backdrop-blur-[2px] z-40"
          />
        )}
      </AnimatePresence>

      {/* Floating Sub-action buttons vertical stack */}
      <div className="relative z-50 flex flex-col items-start gap-3 mb-3">
        <AnimatePresence>
          {isOpen &&
            items.map((action, index) => {
              const ActionIcon = action.icon;
              const delay = (items.length - 1 - index) * 0.04;

              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 25, scale: 0.4 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.5 }}
                  transition={{
                    type: 'spring',
                    stiffness: 450,
                    damping: 24,
                    delay,
                  }}
                  className="flex items-center gap-3 group cursor-pointer"
                  onClick={action.onClick}
                >
                  {/* Action Icon Button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.12, rotate: 4 }}
                    whileTap={{ scale: 0.92 }}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-black/15 bg-gradient-to-tr ${
                      action.color || 'from-emerald-600 to-teal-700 text-white'
                    } border border-white/30 cursor-pointer`}
                  >
                    <ActionIcon className="w-5 h-5" />
                  </motion.button>

                  {/* Label / Tooltip Pill */}
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      delay: delay + 0.03,
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-white/50 dark:border-stone-800 text-stone-800 dark:text-stone-100 text-xs font-bold shadow-md shadow-black/10 flex items-center gap-2 group-hover:bg-white dark:group-hover:bg-stone-800 transition-colors"
                  >
                    <span>{action.label}</span>
                    {action.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold">
                        {action.badge}
                      </span>
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Main Trigger Floating Button (FAB) */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="relative z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0f3b2c] via-emerald-800 to-emerald-950 text-white flex items-center justify-center shadow-2xl shadow-emerald-900/40 border border-emerald-400/40 hover:border-amber-300/60 transition-colors cursor-pointer group"
        title={isOpen ? 'إغلاق الإجراءات السريعة' : 'إجراءات سريعة (Speed Dial)'}
        aria-label="Speed Dial"
      >
        {/* Subtle Outer Pulsing Ring */}
        {!isOpen && (
          <span className="absolute -inset-1 rounded-2xl bg-emerald-500/25 animate-ping -z-10 opacity-75" />
        )}

        {/* Dynamic Rotation Icon (Plus transforms smoothly to X) */}
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className="flex items-center justify-center"
        >
          <Plus className="w-6 h-6 stroke-[2.5] text-amber-200 group-hover:text-amber-100 transition-colors" />
        </motion.div>
      </motion.button>
    </div>
  );
};
