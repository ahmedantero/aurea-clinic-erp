import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Sidebar, TabType } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { SpeedDial } from './ui/SpeedDial';
import { Appointment } from '../types';

interface LayoutProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  headerTitle: string;
  headerSubtitle?: string;
  appointmentsCount: number;
  servicesCount: number;
  appointments: Appointment[];
  onOpenNewAppointment: () => void;
  onOpenCheckout?: (apt: Appointment) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onTabChange,
  headerTitle,
  headerSubtitle = '',
  appointmentsCount,
  servicesCount,
  appointments,
  onOpenNewAppointment,
  onOpenCheckout,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div
      dir="rtl"
      className="relative min-h-screen bg-transparent print:bg-white text-stone-900 dark:text-stone-100 flex font-sans overflow-x-hidden selection:bg-[#0f3b2c] selection:text-[#f3e5ab]"
    >
      {/* 1. Animated Luxury Moving Mesh Gradient Background */}
      <div className="animated-luxury-mesh print:hidden">
        <div className="orb-emerald" />
        <div className="orb-gold" />
        <div className="orb-peach" />
      </div>

      {/* 2. Glassmorphic Sidebar (RTL Right-Docked) */}
      <aside className="print:hidden z-40">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={onTabChange}
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          appointmentsCount={appointmentsCount}
          servicesCount={servicesCount}
        />
      </aside>

      {/* Floating Expand Tab when Sidebar is Collapsed on Desktop */}
      {isSidebarCollapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden lg:flex fixed top-24 right-0 z-50 items-center gap-1.5 px-3 py-2 rounded-l-2xl bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] border-y border-l border-[#d4af37]/50 shadow-xl shadow-emerald-950/25 cursor-pointer transition-all hover:-translate-x-1 group animate-fadeIn"
          title="إظهار القائمة الجانبية (توسيع)"
        >
          <ChevronLeft className="w-4 h-4 text-[#d4af37] group-hover:scale-125 transition-transform" />
          <span className="text-xs font-bold whitespace-nowrap">القائمة الجانبية</span>
        </button>
      )}

      {/* 3. Main Scrollable Container */}
      <div className={`relative z-10 flex-1 ${isSidebarCollapsed ? 'lg:pr-0' : 'lg:pr-72'} transition-[padding] duration-300 print:pr-0 print:m-0 print:h-auto print:overflow-visible flex flex-col min-w-0`}>
        {/* Glassmorphic Sticky Header */}
        <div className="print:hidden">
          <Header
            title={headerTitle}
            subtitle={headerSubtitle}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
          />
        </div>

        {/* Dynamic Route Content with Fast Hardware-Accelerated Fade-In */}
        <main className="relative z-10 flex-1 p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 print:h-auto print:overflow-visible max-w-7xl print:max-w-none w-full mx-auto">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* 5. Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => onTabChange(tab)}
        onOpenNewAppointment={onOpenNewAppointment}
        appointments={appointments}
        onOpenCheckout={onOpenCheckout}
      />

      {/* 6. Spring-Loaded Speed Dial (Floating Quick Actions) */}
      <SpeedDial
        onOpenNewAppointment={onOpenNewAppointment}
        onNavigate={(tab) => onTabChange(tab as TabType)}
      />
    </div>
  );
};
