import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Sparkles, 
  Users, 
  Package,
  Calculator,
  Stethoscope,
  X,
  Flower2,
  Receipt,
  BarChart3,
  LogOut,
  ShieldCheck,
  UserCheck,
  UserCog
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabType = 
  | 'dashboard' 
  | 'appointments' 
  | 'services' 
  | 'clients' 
  | 'inventory' 
  | 'expenses'
  | 'staff-management' 
  | 'staff-reports'
  | 'analytics'
  | 'users';

interface SidebarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  setIsOpen,
}) => {
  const { user, logout, hasAccessToTab, isAdmin } = useAuth();

  const allNavItems = [
    {
      id: 'dashboard' as TabType,
      label: 'الرئيسية',
      icon: LayoutDashboard,
    },
    {
      id: 'appointments' as TabType,
      label: 'الحجوزات',
      icon: Calendar,
      badge: '4',
    },
    {
      id: 'services' as TabType,
      label: 'الخدمات',
      icon: Sparkles,
      badge: '15',
    },
    {
      id: 'clients' as TabType,
      label: 'العملاء',
      icon: Users,
    },
    {
      id: 'inventory' as TabType,
      label: 'المخزون',
      icon: Package,
    },
    {
      id: 'expenses' as TabType,
      label: 'المصروفات',
      icon: Receipt,
    },
    {
      id: 'staff-management' as TabType,
      label: 'إدارة المتخصصين',
      icon: Stethoscope,
    },
    {
      id: 'staff-reports' as TabType,
      label: 'حسابات المتخصصين',
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
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-64 bg-white border-l border-stone-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Flower2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-stone-800 tracking-tight">
                أوريا كلينك
              </h1>
              <p className="text-xs text-stone-400 font-medium">
                عيادة تخصصية وسبا
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50/80 text-emerald-800 font-bold border border-emerald-100/80 shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile & Role Info */}
        {user && (
          <div className="p-3 mx-3 mb-2 rounded-2xl bg-stone-50/90 border border-stone-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#0f3b2c] text-amber-300 font-black text-xs flex items-center justify-center shrink-0 border border-[#d4af37]/40 shadow-2xs">
                {isAdmin ? 'A' : 'R'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-800 truncate" title={user.name}>
                  {user.name}
                </p>
                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                  isAdmin
                    ? 'bg-emerald-100 text-[#0f3b2c] border border-emerald-200'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}>
                  {isAdmin ? 'المدير العام' : 'موظف استقبال'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              title="تسجيل الخروج من النظام"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Minimal Footer */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-stone-50/60 border border-stone-100 text-xs text-stone-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-medium text-stone-600">قاعدة البيانات متصلة</span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">PostgreSQL</span>
        </div>
      </aside>
    </>
  );
};
