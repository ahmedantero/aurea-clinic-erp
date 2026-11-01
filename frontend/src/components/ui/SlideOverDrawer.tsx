import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  maxWidth?: string; // e.g. 'max-w-xl', 'max-w-2xl', 'max-w-lg'
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const SlideOverDrawer: React.FC<SlideOverDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  maxWidth = 'max-w-xl',
  footer,
  children,
}) => {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/50 dark:bg-black/60 backdrop-blur-md"
          />

          {/* Drawer Panel Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'spring',
                damping: 32,
                stiffness: 340,
                mass: 0.85,
              }}
              className={`w-screen ${maxWidth} bg-gradient-to-b from-white via-[#fcfaf6] to-[#f9f6f0] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 shadow-2xl shadow-emerald-950/20 border-l border-stone-200/90 dark:border-white/10 flex flex-col h-full`}
            >
              {/* Sticky Frosted Header */}
              <div className="sticky top-0 z-20 px-6 py-4.5 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#0f3b2c] dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40 shadow-xs">
                      {icon}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-sans tracking-tight">
                        {title}
                      </h2>
                      {badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700/60">
                          {badge}
                        </span>
                      )}
                    </div>
                    {subtitle && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  title="إغلاق (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body with Silk Scrollbar */}
              <div className="flex-1 overflow-y-auto p-6 silk-scrollbar space-y-6">
                {children}
              </div>

              {/* Sticky Floating Footer */}
              {footer && (
                <div className="sticky bottom-0 z-20 px-6 py-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-200/80 dark:border-stone-800 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.04)]">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
