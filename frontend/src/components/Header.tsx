import React from 'react';
import { Menu, CalendarDays, LogOut, Search, Sun, Moon, Sparkles, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle: string;
  onOpenMobileMenu: () => void;
  onOpenCommandPalette?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onOpenCommandPalette,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const arabicDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="h-20 bg-white/85 dark:bg-stone-900/85 backdrop-blur-2xl border-b border-stone-200/80 dark:border-stone-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_25px_-4px_rgba(15,59,44,0.04)] transition-all">
      <div className="flex items-center gap-3.5">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2.5 -mr-2 rounded-2xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 lg:hidden cursor-pointer transition-colors border border-stone-200/70 dark:border-stone-700 shadow-2xs"
          title="فتح القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2.5 rounded-2xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-all border border-stone-200/80 dark:border-stone-700 shadow-2xs items-center justify-center group"
            title={isSidebarCollapsed ? "إظهار القائمة الجانبية (توسيع الشاشة)" : "سحب / طي القائمة الجانبية"}
          >
            {isSidebarCollapsed ? (
              <PanelRightOpen className="w-5 h-5 text-[#0f3b2c] dark:text-[#d4af37] group-hover:scale-110 transition-transform" />
            ) : (
              <PanelRightClose className="w-5 h-5 text-stone-600 dark:text-stone-300 group-hover:scale-110 transition-transform" />
            )}
          </button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight font-sans">
              {title}
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Command Palette Trigger (Cmd+K) */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/70 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 hover:text-[#0f3b2c] dark:hover:text-white border border-stone-200/80 dark:border-stone-700 text-xs font-semibold shadow-xs backdrop-blur-md transition-all cursor-pointer hover:border-[#0f3b2c]/30 hover:shadow-sm"
            title="فتح لوحة الأوامر السريعة (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#0f3b2c]" />
            <span className="text-xs">بحث أو أمر سريع...</span>
            <kbd className="px-1.5 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-700 text-[10px] font-mono border border-stone-200/80 dark:border-stone-600 text-stone-500 dark:text-stone-300">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white/70 dark:bg-stone-800/70 text-stone-600 dark:text-amber-300 hover:text-stone-900 dark:hover:text-amber-200 border border-stone-200/80 dark:border-stone-700 shadow-2xs transition-all cursor-pointer hover:bg-stone-100/80"
          title={isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
        >
          {isDark ? <Sun className="w-4 h-4 animate-spin-slow text-amber-300" /> : <Moon className="w-4 h-4 text-stone-600" />}
        </button>

        {/* Date Display Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/70 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 font-semibold shadow-2xs backdrop-blur-md">
          <CalendarDays className="w-4 h-4 text-[#0f3b2c] dark:text-emerald-400" strokeWidth={2} />
          <span>{arabicDate}</span>
        </div>

        {/* User Status Bar */}
        {user && (
          <div className="flex items-center gap-2.5 pr-2 sm:pr-3 border-r border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#0f3b2c] to-[#164e3b] text-[#fbf8ee] font-black text-xs flex items-center justify-center border border-[#d4af37]/35 shadow-xs">
                {isAdmin ? 'A' : 'R'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">{user.name}</p>
                <span className={`text-[10px] font-bold ${isAdmin ? 'text-[#0f3b2c] dark:text-emerald-400' : 'text-amber-800 dark:text-amber-400'}`}>
                  {isAdmin ? 'المدير العام' : 'موظف استقبال'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
              title="تسجيل الخروج من النظام"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
