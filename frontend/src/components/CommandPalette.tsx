import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Plus, 
  Receipt, 
  Users, 
  Package, 
  Sparkles, 
  Briefcase, 
  BarChart3, 
  Moon, 
  Sun, 
  X, 
  ArrowRight,
  TrendingUp,
  Stethoscope,
  Command,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabType } from './Sidebar';
import { Appointment } from '../types';
import { useTheme } from '../context/ThemeContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabType) => void;
  onOpenNewAppointment: () => void;
  appointments?: Appointment[];
  onOpenCheckout?: (apt: Appointment) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewAppointment,
  appointments = [],
  onOpenCheckout,
}) => {
  const [query, setQuery] = useState('');
  const { isDark, toggleTheme } = useTheme();

  // Listen to Global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    {
      id: 'new-appointment',
      title: 'إضافة حجز جديد',
      subtitle: 'حجز موعد كشف أو جلسة سبا فورية',
      icon: Plus,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      action: () => {
        onOpenNewAppointment();
        onClose();
      },
    },
    {
      id: 'toggle-theme',
      title: isDark ? 'التبديل إلى الوضع الفاتح (Light Mode)' : 'التبديل إلى الوضع الليلي (Dark Mode)',
      subtitle: isDark ? 'مظهر نهاري مشرق' : 'مظهر داكن فاخر لحماية العين',
      icon: isDark ? Sun : Moon,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      action: () => {
        toggleTheme();
        onClose();
      },
    },
  ];

  const navigationItems: { id: TabType; title: string; subtitle: string; icon: any }[] = [
    { id: 'dashboard', title: 'الرئيسية (Dashboard)', subtitle: 'مؤشرات الأداء والإحصائيات العامة', icon: BarChart3 },
    { id: 'appointments', title: 'جدول الحجوزات', subtitle: 'إدارة مواعيد الكشوفات وجلسات السبا', icon: Calendar },
    { id: 'services', title: 'الخدمات والباقات', subtitle: 'قائمة الأسعار وباقات الجلسات المعتمدة', icon: Sparkles },
    { id: 'clients', title: 'سجل العملاء', subtitle: 'ملفات وبيانات المرضى والعملاء', icon: Users },
    { id: 'inventory', title: 'مخزن المستلزمات', subtitle: 'متابعة الأرصدة والكميات والتكلفة', icon: Package },
    { id: 'dispatches', title: 'صرف المستهلكات', subtitle: 'أذونات الصرف والاستهلاك الداخلي', icon: Package },
    { id: 'revenues', title: 'الإيرادات المالية', subtitle: 'سجل المقبوضات والتحصيلات', icon: TrendingUp },
    { id: 'expenses', title: 'سجل المصروفات', subtitle: 'نفقات التشغيل والإيجارات والمرافق', icon: Receipt },
    { id: 'hr', title: 'الموارد البشرية والرواتب', subtitle: 'مسيرات الرواتب والسلف والمكافآت', icon: Briefcase },
    { id: 'staff-management', title: 'فريق العمل والمعالجون', subtitle: 'بيانات الأطباء والمختصين', icon: Stethoscope },
    { id: 'staff-reports', title: 'حسابات المتخصصين', subtitle: 'تقارير العمولات والإنجاز', icon: UserCheck },
    { id: 'analytics', title: 'التقارير المالية والتحليلات', subtitle: 'الأرباح والخسائر وحركة الصندوق', icon: BarChart3 },
  ];

  const q = query.trim().toLowerCase();

  const filteredActions = quickActions.filter(
    (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
  );

  const filteredNav = navigationItems.filter(
    (n) => n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q)
  );

  const filteredAppointments = q.length >= 2 
    ? appointments.filter(
        (apt) =>
          (apt.clientName || '').toLowerCase().includes(q) ||
          (apt.clientPhone || '').toLowerCase().includes(q) ||
          (apt.serviceName || '').toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  return (
    <AnimatePresence>
      <div 
        dir="rtl"
        className="fixed inset-0 z-[10000] flex items-start justify-center pt-[10vh] sm:pt-[15vh] p-4 bg-[#0f3b2c]/30 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-gradient-to-b from-[#fdfbf7] via-[#fcfaf5] to-[#f7f4ed] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl shadow-[0_25px_70px_-15px_rgba(15,59,44,0.25)] border border-stone-200/90 dark:border-white/10 overflow-hidden flex flex-col max-h-[75vh]"
        >
          {/* Search Header */}
          <div className="relative flex items-center px-5 py-4 border-b border-stone-200/70 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md">
            <Search className="w-5 h-5 text-stone-400 dark:text-stone-500 shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب أمراً أو ابحث عن صفحة أو حجز بالاسم أو الهاتف... (Ctrl + K)"
              className="w-full pr-3.5 pl-10 text-sm sm:text-base bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden font-medium"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-lg text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200/60 dark:border-stone-700">
                ESC للإغلاق
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Results Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
            {/* Quick Actions */}
            {filteredActions.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[11px] font-bold text-stone-400 dark:text-stone-500 tracking-wider">
                  إجراءات فورية
                </p>
                <div className="space-y-1 mt-1">
                  {filteredActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-50/70 dark:hover:bg-stone-800/80 transition-all text-right group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#0f3b2c] dark:group-hover:text-emerald-400">
                              {item.title}
                            </p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-[#0f3b2c] dark:group-hover:text-emerald-400 transform rotate-180 transition-transform group-hover:-translate-x-1" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Appointments Search Hits */}
            {filteredAppointments.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[11px] font-bold text-stone-400 dark:text-stone-500 tracking-wider">
                  حجوزات مطابقة للبحث
                </p>
                <div className="space-y-1 mt-1">
                  {filteredAppointments.map((apt) => (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => {
                        onNavigate('appointments');
                        if (onOpenCheckout) onOpenCheckout(apt);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-50/60 dark:bg-stone-800/40 hover:bg-emerald-50 dark:hover:bg-stone-800 transition-all text-right group cursor-pointer border border-stone-200/50 dark:border-stone-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0f3b2c]/10 dark:bg-emerald-500/20 text-[#0f3b2c] dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                            {apt.clientName} <span className="text-xs font-normal text-stone-500">({apt.serviceName})</span>
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400 font-mono" dir="ltr">
                            {apt.appointmentDate} • {apt.time || ''} • {apt.finalPrice} ج.م
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-600">
                        عرض وتفاصيل
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Pages */}
            {filteredNav.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[11px] font-bold text-stone-400 dark:text-stone-500 tracking-wider">
                  التنقل السريع بين الأقسام
                </p>
                <div className="space-y-1 mt-1">
                  {filteredNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-all text-right group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0 group-hover:bg-[#0f3b2c] group-hover:text-[#f5e4ab] transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#0f3b2c] dark:group-hover:text-emerald-400">
                              {item.title}
                            </p>
                            <p className="text-xs text-stone-400 dark:text-stone-500">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-stone-400 dark:text-stone-500 font-mono group-hover:text-stone-700 dark:group-hover:text-stone-300">
                          انتقال ↵
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredActions.length === 0 && filteredNav.length === 0 && filteredAppointments.length === 0 && (
              <div className="py-12 text-center text-stone-400">
                <Search className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 mb-2 stroke-1" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">لا توجد نتائج مطابقة</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">جرّب كتابة كلمة بحث أخرى للوصول إلى طلبك.</p>
              </div>
            )}
          </div>

          {/* Footer Shortcuts Hints */}
          <div className="px-5 py-3 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-[10px]">↵</kbd>
                <span>للتنفيذ</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-[10px]">ESC</kbd>
                <span>للإلغاء</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#0f3b2c] dark:text-emerald-400 font-bold">
              <Command className="w-3.5 h-3.5" />
              <span>أوريا كلينك سحابي</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
