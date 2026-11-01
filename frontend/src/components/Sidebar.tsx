import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Sparkles, 
  Users, 
  Package,
  PackageMinus,
  Calculator,
  Stethoscope,
  X,
  Flower2,
  Receipt,
  TrendingUp,
  BarChart3,
  LogOut,
  ShieldCheck,
  UserCheck,
  UserCog,
  Briefcase,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export type TabType = 
  | 'dashboard' 
  | 'appointments' 
  | 'services' 
  | 'clients' 
  | 'inventory' 
  | 'dispatches'
  | 'revenues'
  | 'expenses'
  | 'hr'
  | 'staff-management' 
  | 'staff-reports'
  | 'analytics'
  | 'users';

interface SidebarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  appointmentsCount?: number;
  servicesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  setIsOpen,
  isCollapsed = false,
  onToggleCollapse,
  appointmentsCount,
  servicesCount: propServicesCount,
}) => {
  const { user, logout, hasAccessToTab, isAdmin } = useAuth();
  const [localServicesCount, setLocalServicesCount] = useState<number | undefined>(propServicesCount);

  useEffect(() => {
    if (propServicesCount !== undefined) {
      setLocalServicesCount(propServicesCount);
    }
  }, [propServicesCount]);

  useEffect(() => {
    if (propServicesCount === undefined) {
      fetch('/api/services', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) {
            setLocalServicesCount(data.length);
          }
        })
        .catch(() => {});
    }
  }, [propServicesCount]);

  const effectiveServicesCount = propServicesCount !== undefined ? propServicesCount : localServicesCount;

  const allNavItems = [
    {
      id: 'dashboard' as TabType,
      label: 'الرئيسية',
      icon: LayoutDashboard,
    },
    {
      id: 'appointments' as TabType,
      label: 'جدول الحجوزات',
      icon: Calendar,
      badge: appointmentsCount !== undefined ? appointmentsCount.toString() : undefined,
    },
    {
      id: 'services' as TabType,
      label: 'الخدمات والباقات',
      icon: Sparkles,
      badge: effectiveServicesCount !== undefined ? effectiveServicesCount.toString() : undefined,
    },
    {
      id: 'clients' as TabType,
      label: 'سجل العملاء',
      icon: Users,
    },
    {
      id: 'inventory' as TabType,
      label: 'مخزن المستلزمات',
      icon: Package,
    },
    {
      id: 'dispatches' as TabType,
      label: 'صرف المستهلكات',
      icon: PackageMinus,
    },
    {
      id: 'revenues' as TabType,
      label: 'الإيرادات المالية',
      icon: TrendingUp,
    },
    {
      id: 'expenses' as TabType,
      label: 'سجل المصروفات',
      icon: Receipt,
    },
    {
      id: 'hr' as TabType,
      label: 'الموارد البشرية والرواتب',
      icon: Briefcase,
    },
    {
      id: 'staff-management' as TabType,
      label: 'فريق العمل والمعالجون',
      icon: Stethoscope,
    },
    {
      id: 'staff-reports' as TabType,
      label: 'عمولات المتخصصين',
      icon: Calculator,
    },
    {
      id: 'analytics' as TabType,
      label: 'التقارير والتحليلات',
      icon: BarChart3,
    },
    {
      id: 'users' as TabType,
      label: 'إدارة المستخدمين',
      icon: UserCog,
      adminOnly: true,
    },
  ];

  // RBAC: Hide restricted links for Receptionist, only Admin can see 'users'
  const visibleNavItems = allNavItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return hasAccessToTab(item.id);
  });

  return (
    <>
      {/* Mobile / Tablet Backdrop with Fade */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Glassmorphic Sidebar (Hardware-Accelerated) */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 bg-white/80 dark:bg-stone-900/85 backdrop-blur-xl border-l border-stone-200/80 dark:border-stone-800/80 flex flex-col shadow-2xl shadow-stone-900/5 dark:shadow-black/40 transition-transform duration-300 ease-in-out transform-gpu ${
          isOpen ? 'translate-x-0' : isCollapsed ? 'translate-x-full' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Desktop Collapse Arrow Button (attached to left border in RTL) */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute top-6 -left-3.5 z-50 w-7 h-7 rounded-full bg-white dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 shadow-md text-stone-600 dark:text-stone-300 hover:text-[#0f3b2c] dark:hover:text-[#d4af37] hover:scale-110 items-center justify-center cursor-pointer transition-all hover:bg-stone-50 group"
            title="سحب وإخفاء القائمة الجانبية"
          >
            <ChevronRight className="w-4 h-4 text-[#0f3b2c] dark:text-[#d4af37] group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Header / Luxury Clinic Branding */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 bg-gradient-to-b from-white/90 via-[#fcfaf5]/80 to-transparent dark:from-stone-900/90 dark:via-stone-900/80 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0f3b2c] to-[#164e3b] text-[#fbf8ee] flex items-center justify-center border border-[#d4af37]/45 shadow-md shadow-[#0f3b2c]/15">
              <Flower2 className="w-5 h-5 text-[#d4af37]" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-lg text-stone-900 dark:text-stone-100 tracking-tight font-sans">
                  أوريا كلينك
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              </div>
              <p className="text-[10px] text-[#0f3b2c] dark:text-emerald-400 font-bold tracking-wide">
                عيادة تخصصية وسبا راقٍ
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 lg:hidden cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List with Micro-Interactions */}
        <div className="flex-1 px-3.5 py-5 space-y-1 overflow-y-auto custom-scrollbar">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm transition-all duration-200 cursor-pointer relative ${
                  isActive
                    ? 'bg-gradient-to-l from-[#0f3b2c] to-[#164e3b] text-white font-bold shadow-md shadow-[#0f3b2c]/20 border border-[#d4af37]/30'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon 
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#f5e4ab]' : 'text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200'
                    }`} 
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums shrink-0 ${
                      isActive
                        ? 'bg-[#d4af37] text-stone-950 shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* User Profile Card */}
        {user && (
          <div className="p-3.5 mx-3.5 mb-2 rounded-2xl bg-white/70 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 shadow-xs flex items-center justify-between gap-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#0f3b2c] text-[#f5e4ab] font-black text-sm flex items-center justify-center shrink-0 border border-[#d4af37]/50 shadow-xs">
                {isAdmin ? 'A' : 'R'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate" title={user.name}>
                  {user.name}
                </p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                  isAdmin
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-[#0f3b2c] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
                }`}>
                  {isAdmin ? 'المدير العام' : 'موظف استقبال'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
              title="تسجيل الخروج من النظام"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        )}

        {/* Status Indicator Footer */}
        <div className="p-3 mx-3.5 mb-3 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-semibold text-stone-700 dark:text-stone-300">قاعدة البيانات متصلة</span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono font-medium">PostgreSQL</span>
        </div>
      </aside>
    </>
  );
};
