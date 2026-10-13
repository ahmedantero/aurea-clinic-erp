import React from 'react';
import { Menu, CalendarDays, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle: string;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const arabicDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="h-20 bg-white/80 backdrop-blur-xs border-b border-stone-200/80 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -mr-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-stone-800 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-stone-400 font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200/60 text-xs text-stone-600 font-medium">
          <CalendarDays className="w-4 h-4 text-emerald-700" />
          <span>{arabicDate}</span>
        </div>

        {user && (
          <div className="flex items-center gap-2 pr-2 border-r border-stone-200/70">
            <div className="flex items-center gap-2 text-right">
              <div className="w-8 h-8 rounded-xl bg-[#0f3b2c] text-amber-300 font-bold text-xs flex items-center justify-center border border-[#d4af37]/40 shadow-2xs">
                {isAdmin ? 'A' : 'R'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-stone-800 leading-tight">{user.name}</p>
                <span className={`text-[10px] font-bold ${isAdmin ? 'text-emerald-700' : 'text-amber-800'}`}>
                  {isAdmin ? 'المدير العام' : 'موظف استقبال'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="تسجيل الخروج من النظام"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
