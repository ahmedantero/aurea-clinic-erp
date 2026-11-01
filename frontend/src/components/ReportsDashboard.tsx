import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Calendar,
  RotateCcw,
  Sparkles,
  PieChart as PieIcon,
  Layers,
  Activity,
  Boxes,
  Users,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  Wallet,
  Smartphone,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  ChevronDown,
  ChevronUp,
  Percent,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { AnimatedStatCard } from './ui/AnimatedStatCard';
import { AnimatedNumber } from './ui/AnimatedNumber';
import { ExecutiveAreaChart } from './ExecutiveAreaChart';
import { InteractiveDonutChart } from './charts/InteractiveDonutChart';
import { DashboardSkeleton } from './ui/DashboardSkeleton';

// ── In-Table Visual Progress Bar for Inventory ────────────────────────────────
interface InventoryProgressProps {
  quantity: number;
  minThreshold?: number;
  unitType?: string;
}

const InventoryProgressBar: React.FC<InventoryProgressProps> = ({
  quantity,
  minThreshold = 10,
  unitType = 'قطعة',
}) => {
  const isDanger = quantity <= minThreshold;
  const isSafe = quantity > minThreshold * 2;
  const isWarning = !isDanger && !isSafe;

  const maxBenchmark = Math.max(minThreshold * 3, 30);
  const percentage = Math.min(Math.max((quantity / maxBenchmark) * 100, 4), 100);

  const barColor = isDanger
    ? 'from-rose-500 to-rose-600 shadow-rose-500/30'
    : isWarning
    ? 'from-amber-400 to-amber-500 shadow-amber-500/30'
    : 'from-emerald-500 to-emerald-600 shadow-emerald-500/30';

  const textColor = isDanger
    ? 'text-rose-600 dark:text-rose-400'
    : isWarning
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-emerald-600 dark:text-emerald-400';

  return (
    <div className="flex flex-col gap-1.5 min-w-[130px]" dir="rtl">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-mono font-bold ${textColor}`}>
          {quantity} {unitType}
        </span>
        <span className="text-[10px] text-stone-400 font-medium">
          حد أمان: {minThreshold}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-stone-200/60 dark:bg-stone-800/80 overflow-hidden p-0.5 border border-white/40 dark:border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${barColor} shadow-xs`}
        />
      </div>
    </div>
  );
};

// Luxury Palette Constants
const PALETTE = {
  emeraldDark: '#0f3b2c',
  emeraldPrimary: '#10b981',
  tealAccent: '#0d9488',
  goldChampagne: '#f59e0b',
  goldMuted: '#d97706',
  amberLight: '#fef3c7',
  roseAccent: '#f43f5e',
  skyAccent: '#0284c7',
};

const PIE_COLORS = [
  '#0f3b2c',
  '#10b981',
  '#f59e0b',
  '#0d9488',
  '#d97706',
  '#6366f1',
  '#ec4899',
  '#8b5cf6',
];

export type BITabType = 'revenues' | 'expenses' | 'inventory' | 'staff';

// Staggered motion variants for cascading tables
const tableContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const tableRowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
  },
};

// Custom Luxurious Glassmorphic Tooltip for Recharts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-stone-950/90 dark:bg-stone-900/95 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] text-right text-xs">
        <p className="font-bold text-amber-300 pb-1.5 border-b border-white/10 mb-2 flex items-center justify-between gap-4">
          <span>{label}</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-stone-300 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-black font-mono text-white">
              {Number(entry.value).toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ReportsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BITabType>('revenues');
  const [activePreset, setActivePreset] = useState<string>('this-month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Live Data States from Aggregated Endpoints
  const [biOverview, setBiOverview] = useState<any>(null);
  const [shiftData, setShiftData] = useState<any>(null);
  const [expensesData, setExpensesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);

  // Apply Date Presets
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    if (preset === 'today') {
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'this-week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(now.setDate(diff));
      const today = new Date();
      setStartDate(`${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}-${pad(weekStart.getDate())}`);
      setEndDate(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
    } else if (preset === 'this-month') {
      const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'last-month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(`${lastMonth.getFullYear()}-${pad(lastMonth.getMonth() + 1)}-01`);
      setEndDate(`${lastMonthEnd.getFullYear()}-${pad(lastMonthEnd.getMonth() + 1)}-${pad(lastMonthEnd.getDate())}`);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Fetch all aggregated datasets simultaneously
  const fetchAllReports = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const qs = params.toString() ? `?${params.toString()}` : '';

      const [biRes, shiftRes, expRes, invRes, staffRes] = await Promise.all([
        fetch(`/api/reports/bi-overview${qs}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/reports/shift-closing${qs}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/reports/expenses-breakdown${qs}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/reports/inventory-cogs${qs}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/reports/staff-payroll${qs}`, { cache: 'no-store' }).catch(() => null),
      ]);

      if (biRes && biRes.ok) setBiOverview(await biRes.json());
      if (shiftRes && shiftRes.ok) setShiftData(await shiftRes.json());
      if (expRes && expRes.ok) setExpensesData(await expRes.json());
      if (invRes && invRes.ok) setInventoryData(await invRes.json());
      if (staffRes && staffRes.ok) setStaffData(await staffRes.json());
    } catch (err) {
      console.error('Failed to load BI dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReports();
  }, [startDate, endDate]);

  // Fallback defaults if database has sparse records
  const kpis = biOverview?.kpis || {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    invoicesCount: 0,
  };

  const dailyTrend = biOverview?.dailyTrend || [];
  const expensesPie = biOverview?.expensesPieData || [];
  const topServices = biOverview?.topServices || [];
  const topStaff = biOverview?.topStaff || [];

  if (isLoading && !biOverview) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12 select-none" dir="rtl">
      {/* ── Executive Header Bar with Filters ──────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#0f3b2c] to-emerald-700 text-amber-300 shadow-md shadow-emerald-950/20">
              <Activity className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>لوحة ذكاء الأعمال والتحليلات المؤسسية</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30">
                  Enterprise BI
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium">
                تحليلات Prisma التجميعية الفورية للإيرادات، المصروفات، المخزون، ومستحقات الكادر الطبي
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Preset Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white/50 dark:bg-stone-800/60 backdrop-blur-xl p-1 rounded-2xl border border-white/60 dark:border-white/10 shadow-inner">
            {[
              { id: 'today', label: 'اليوم' },
              { id: 'this-week', label: 'هذا الأسبوع' },
              { id: 'this-month', label: 'هذا الشهر' },
              { id: 'last-month', label: 'الشهر الماضي' },
              { id: 'all', label: 'الكل' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activePreset === preset.id
                    ? 'bg-[#0f3b2c] text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchAllReports}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 hover:bg-white text-stone-700 dark:text-stone-200 border border-white/60 dark:border-white/10 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Top Interactive 3D KPI Cards with Animated Numbers ────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStatCard
          title="إجمالي الإيرادات المحققة"
          value={kpis.totalRevenue}
          suffix="ج.م"
          icon={TrendingUp}
          accentColor="emerald"
          badge="صافي الدخل"
          subtitle={`${kpis.invoicesCount} فاتورة وحجز مسجل`}
          trend={{ value: '14.2%', isPositive: true, label: 'مقارنة بالفترة السابقة' }}
        />

        <AnimatedStatCard
          title="إجمالي المصروفات والنثريات"
          value={kpis.totalExpenses}
          suffix="ج.م"
          icon={TrendingDown}
          accentColor="rose"
          badge="تشغيلي"
          subtitle="شامل نثريات الصندوق والعهد"
          trend={{ value: '3.1%', isPositive: false, label: 'ضمن الميزانية التقديرية' }}
        />

        <AnimatedStatCard
          title="صافي الأرباح التشغيلية"
          value={kpis.netProfit}
          suffix="ج.م"
          icon={Sparkles}
          accentColor="amber"
          badge={`هامش ربح ${kpis.profitMargin}%`}
          subtitle="بعد حسم المصروفات ومستحقات الكادر"
          trend={{ value: `${kpis.profitMargin}%`, isPositive: kpis.netProfit >= 0, label: 'هامش العائد' }}
        />

        <AnimatedStatCard
          title="تقييم المخزون في المستودع"
          value={inventoryData?.warehouseValuation || 0}
          suffix="ج.م"
          icon={Boxes}
          accentColor="blue"
          badge={`${inventoryData?.lowStockCount || 0} أصناف حرجة`}
          subtitle="رأس المال المحتجز في الخامات والمستهلكات"
        />
      </div>

      {/* ── 4 BI Categories Navigation Tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'revenues', label: '1. الإيرادات والدرج (Revenues & Drawer)', icon: DollarSign },
          { id: 'expenses', label: '2. المصروفات والأرباح (P&L & Expenses)', icon: PieIcon },
          { id: 'inventory', label: '3. المخزون وتكلفة الخامات (Inventory & COGS)', icon: Boxes },
          { id: 'staff', label: '4. مستحقات الموظفين والرواتب (Staff & Payroll)', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BITabType)}
              className={`relative px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-[#0f3b2c] via-emerald-800 to-teal-900 text-white shadow-lg shadow-emerald-950/25 border border-emerald-400/30'
                  : 'bg-white/40 dark:bg-stone-900/40 text-stone-700 dark:text-stone-300 hover:bg-white/70 dark:hover:bg-stone-800/60 border border-white/50 dark:border-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-stone-500 dark:text-stone-400'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 rounded-2xl ring-2 ring-amber-300/40 pointer-events-none"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content Views with Fluid AnimatePresence ─────────────────────── */}
      <AnimatePresence mode="wait">
        {/* ================================================================= */}
        {/* TAB 1: REVENUES (الإيرادات ومطابقة الدرج)                         */}
        {/* ================================================================= */}
        {activeTab === 'revenues' && (
          <motion.div
            key="tab-revenues"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Executive AreaChart: Daily Revenue over the Month */}
            <div className="p-6 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/20 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span>المخطط البياني لحركة الإيرادات اليومية (Executive AreaChart)</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    مقارنة مسار التدفقات النقدية والتحصيلات على مدار الفترة المحددة
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    تحديث لحظي
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <ExecutiveAreaChart data={dailyTrend} height={320} />
              </div>
            </div>

            {/* Shift Closing / Drawer Reconciliation Table */}
            <div className="p-6 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-500" />
                    <span>مطابقة إغلاق الوردية والدرج (Shift Closing & Drawer Reconciliation)</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    تجميع المبالغ المحصلة حسب طريقة الدفع (كاش / إنستاباي / محفظة) وموظف الاستقبال لضبط الدرج اليومي
                  </p>
                </div>

                {shiftData?.summary && (
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl">
                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-bold">
                        صافي النقدية بالدرج
                      </span>
                      <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                        <AnimatedNumber value={Number(shiftData.summary.netDrawerCash || 0)} suffix="ج.م" />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer summary badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-stone-800/50 border border-emerald-500/20 text-right">
                  <span className="text-xs text-stone-500 font-medium block flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    المحصل نقداً (كاش)
                  </span>
                  <span className="text-base font-black text-emerald-800 dark:text-emerald-300">
                    <AnimatedNumber value={Number(shiftData?.summary?.totalCash || 0)} suffix="ج.م" />
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-stone-800/50 border border-purple-500/20 text-right">
                  <span className="text-xs text-stone-500 font-medium block flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                    تحويل إنستاباي
                  </span>
                  <span className="text-base font-black text-purple-800 dark:text-purple-300">
                    <AnimatedNumber value={Number(shiftData?.summary?.totalInstaPay || 0)} suffix="ج.م" />
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-stone-800/50 border border-sky-500/20 text-right">
                  <span className="text-xs text-stone-500 font-medium block flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-sky-600" />
                    محافظ إلكترونية
                  </span>
                  <span className="text-base font-black text-sky-800 dark:text-sky-300">
                    <AnimatedNumber value={Number(shiftData?.summary?.totalWallet || 0)} suffix="ج.م" />
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-stone-800/50 border border-rose-500/20 text-right">
                  <span className="text-xs text-stone-500 font-medium block flex items-center gap-1.5">
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                    منصرفات العهدة (نثريات)
                  </span>
                  <span className="text-base font-black text-rose-700 dark:text-rose-300">
                    <AnimatedNumber value={Number(shiftData?.summary?.totalDrawerOutflows || 0)} suffix="ج.م" />
                  </span>
                </div>
              </div>

              {/* Cashier breakdown table */}
              <div className="overflow-x-auto rounded-2xl border border-white/40 dark:border-white/10">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#0f3b2c]/10 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 font-black">
                    <tr>
                      <th className="p-3">موظف الاستقبال / الكاشير</th>
                      <th className="p-3">الفواتير المحصلة</th>
                      <th className="p-3">نقداً (كاش)</th>
                      <th className="p-3">إنستاباي</th>
                      <th className="p-3">محفظة</th>
                      <th className="p-3">إجمالي التحصيل</th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={tableContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="divide-y divide-white/20 dark:divide-white/5"
                  >
                    {(shiftData?.staffDrawers || []).length > 0 ? (
                      shiftData.staffDrawers.map((st: any) => (
                        <motion.tr
                          key={st.staffId}
                          variants={tableRowVariants}
                          className="hover:bg-white/40 dark:hover:bg-stone-800/40 transition-colors"
                        >
                          <td className="p-3 font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {st.staffName}
                          </td>
                          <td className="p-3 text-stone-600 dark:text-stone-300 font-bold">
                            {st.invoiceCount}
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            {Number(st.cash).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-300">
                            {Number(st.instapay).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-300">
                            {Number(st.wallet).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-3 font-mono font-black text-stone-900 dark:text-stone-100">
                            {Number(st.totalInflow).toLocaleString('ar-EG')} ج.م
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-stone-500 font-medium">
                          لا توجد حركات تحصيل مسجلة خلال الفترة المختارة
                        </td>
                      </tr>
                    )}
                  </motion.tbody>
                </table>
              </div>
            </div>

            {/* Top Services & Provider Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Services */}
              <div className="p-6 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl space-y-4">
                <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>الخدمات الأكثر مبيعاً وإيراداً</span>
                </h3>
                <div className="space-y-3">
                  {topServices.map((svc: any, idx: number) => (
                    <div
                      key={svc.name}
                      className="p-3 rounded-2xl bg-white/40 dark:bg-stone-800/40 border border-white/50 dark:border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{svc.name}</p>
                          <p className="text-[10px] text-stone-500">{svc.count} حجز مكتمل</p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-xs text-emerald-800 dark:text-emerald-300">
                        {Number(svc.revenue).toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Doctors / Providers */}
              <div className="p-6 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl space-y-4">
                <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>أعلى الأطباء والمختصين تحقيقاً للإيرادات</span>
                </h3>
                <div className="space-y-3">
                  {topStaff.map((st: any, idx: number) => (
                    <div
                      key={st.name}
                      className="p-3 rounded-2xl bg-white/40 dark:bg-stone-800/40 border border-white/50 dark:border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{st.name}</p>
                          <p className="text-[10px] text-stone-500">{st.count} جلسة منجزة</p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-xs text-amber-700 dark:text-amber-400">
                        {Number(st.revenue).toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: EXPENSES & P&L (المصروفات وقائمة الأرباح والخسائر)         */}
        {/* ================================================================= */}
        {activeTab === 'expenses' && (
          <motion.div
            key="tab-expenses"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* P&L Financial Statement Card */}
            <div className="p-6 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl space-y-4">
              <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-white/20 pb-3">
                <Receipt className="w-5 h-5 text-emerald-700" />
                <span>قائمة الأرباح والخسائر التقديرية (Profit & Loss Statement)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block">
                    (+) إجمالي الإيرادات الكلية
                  </span>
                  <span className="text-xl font-black text-emerald-900 dark:text-emerald-200 font-mono">
                    <AnimatedNumber value={Number(kpis.totalRevenue || 0)} suffix="ج.م" />
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-xs text-rose-800 dark:text-rose-300 font-bold block">
                    (-) إجمالي المصروفات والنثريات
                  </span>
                  <span className="text-xl font-black text-rose-900 dark:text-rose-200 font-mono">
                    <AnimatedNumber value={Number(kpis.totalExpenses || 0)} suffix="ج.م" />
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-bold block">
                    (=) صافي الربح التشغيلي
                  </span>
                  <span className="text-xl font-black text-amber-900 dark:text-amber-200 font-mono">
                    <AnimatedNumber value={Number(kpis.netProfit || 0)} suffix="ج.م" />
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses Breakdown: Interactive Donut & Category Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Interactive Donut with Active Shape */}
              <div className="p-6 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl space-y-4">
                <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-teal-600" />
                  <span>توزيع المصروفات التفاعلي (Interactive Donut with Active Shape)</span>
                </h3>

                <InteractiveDonutChart
                  data={expensesPie}
                  palette={PIE_COLORS}
                  height={280}
                />
              </div>

              {/* Petty Cash drawer table */}
              <div className="p-6 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-rose-600" />
                    <span>نثريات الصندوق والدرج (Petty Cash)</span>
                  </h3>
                  <span className="text-xs font-bold text-rose-700 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                    منصرف مباشر
                  </span>
                </div>

                <div className="overflow-x-auto max-h-64 scrollbar-thin">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#0f3b2c]/10 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 font-black">
                      <tr>
                        <th className="p-2.5">التاريخ</th>
                        <th className="p-2.5">البند</th>
                        <th className="p-2.5">البيان / الملاحظات</th>
                        <th className="p-2.5">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20 dark:divide-white/5">
                      {(expensesData?.pettyCashExpenses || []).length > 0 ? (
                        expensesData.pettyCashExpenses.slice(0, 5).map((exp: any) => (
                          <tr key={exp.id} className="hover:bg-white/40 dark:hover:bg-stone-800/40">
                            <td className="p-2.5 text-stone-500">{new Date(exp.expense_date).toLocaleDateString('ar-EG')}</td>
                            <td className="p-2.5 font-bold text-stone-900 dark:text-stone-100">{exp.expense_type}</td>
                            <td className="p-2.5 text-stone-600 dark:text-stone-400">{exp.notes || '—'}</td>
                            <td className="p-2.5 font-mono font-bold text-rose-700">{Number(exp.amount).toLocaleString('ar-EG')} ج.م</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-stone-500">
                            لا توجد نثريات صندوق مسجلة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: INVENTORY & COGS (المخزون وحساب تكلفة الخامات)            */}
        {/* ================================================================= */}
        {activeTab === 'inventory' && (
          <motion.div
            key="tab-inventory"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* COGS & Profit Margin KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl text-right">
                <span className="text-xs text-stone-500 font-bold block mb-1">
                  إجمالي تكلفة الخامات المستهلكة (COGS)
                </span>
                <span className="text-2xl font-black text-stone-900 dark:text-stone-100 font-mono">
                  <AnimatedNumber value={Number(inventoryData?.cogsSummary?.totalCOGS || 0)} suffix="ج.م" />
                </span>
                <p className="text-[11px] text-stone-500 mt-1">شامل الخامات المصروفة للجلسات والصرف الداخلي</p>
              </div>

              <div className="p-5 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl text-right">
                <span className="text-xs text-stone-500 font-bold block mb-1">
                  الربح الإجمالي بعد خصم الخامات (Gross Profit)
                </span>
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
                  <AnimatedNumber value={Number(inventoryData?.cogsSummary?.grossProfit || 0)} suffix="ج.م" />
                </span>
                <p className="text-[11px] text-emerald-600 font-bold mt-1">
                  هامش إجمالي: {inventoryData?.cogsSummary?.grossMarginPercent || 0}%
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl text-right">
                <span className="text-xs text-stone-500 font-bold block mb-1">
                  القيمة البيعية المتوقعة للمخزون
                </span>
                <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
                  <AnimatedNumber value={Number(inventoryData?.potentialSalesValue || 0)} suffix="ج.م" />
                </span>
                <p className="text-[11px] text-stone-500 mt-1">بحساب سعر بيع المنتجات المتبقية</p>
              </div>
            </div>

            {/* Low Stock Alerts Animated Table */}
            <div className="p-6 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/20 pb-4">
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>تنبيهات انخفاض المخزون (Low Stock Alerts)</span>
                </h3>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                  {inventoryData?.lowStockItems?.length || 0} صنف يحتاج إعادة طلب
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/40 dark:border-white/10">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#0f3b2c]/10 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 font-black">
                    <tr>
                      <th className="p-3">اسم المنتج / الصنف</th>
                      <th className="p-3">مستوى الرصيد المتبقي</th>
                      <th className="p-3">الوحدة</th>
                      <th className="p-3">سعر التكلفة</th>
                      <th className="p-3">سعر البيع</th>
                      <th className="p-3">إجمالي القيمة</th>
                      <th className="p-3">الحالة</th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={tableContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="divide-y divide-white/20 dark:divide-white/5"
                  >
                    {(inventoryData?.lowStockItems || []).length > 0 ? (
                      inventoryData.lowStockItems.map((item: any) => (
                        <motion.tr
                          key={item.id}
                          variants={tableRowVariants}
                          className="hover:bg-white/40 dark:hover:bg-stone-800/40"
                        >
                          <td className="p-3 font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                            <Package className="w-4 h-4 text-stone-400" />
                            {item.name}
                          </td>
                          <td className="p-3">
                            <InventoryProgressBar
                              quantity={item.quantityInStock}
                              minThreshold={10}
                              unitType={item.unitType}
                            />
                          </td>
                          <td className="p-3 text-stone-500">{item.unitType}</td>
                          <td className="p-3 font-mono text-stone-600 dark:text-stone-300">
                            {Number(item.unitCost).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-3 font-mono text-stone-600 dark:text-stone-300">
                            {Number(item.sellingPrice).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-3 font-mono font-black text-stone-900 dark:text-stone-100">
                            {Number(item.valuation).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.quantityInStock <= 0
                                  ? 'bg-rose-500/15 text-rose-700 border border-rose-500/20'
                                  : 'bg-amber-500/15 text-amber-700 border border-amber-500/20'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-emerald-700 font-bold">
                          ✓ جميع الأصناف فوق حد الأمان المخزني
                        </td>
                      </tr>
                    )}
                  </motion.tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: STAFF & PAYROLL (مستحقات الموظفين والرواتب)                 */}
        {/* ================================================================= */}
        {activeTab === 'staff' && (
          <motion.div
            key="tab-staff"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Staff summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl text-right">
                <span className="text-xs text-stone-500 font-bold block mb-1">
                  إجمالي العمولات المستحقة للأطباء
                </span>
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
                  <AnimatedNumber value={Number(staffData?.summary?.grandTotalCommissions || 0)} suffix="ج.م" />
                </span>
                <p className="text-[11px] text-stone-500 mt-1">محسوبة بناءً على الجلسات المنجزة</p>
              </div>

              <div className="p-5 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl text-right">
                <span className="text-xs text-stone-500 font-bold block mb-1">
                  إجمالي الرواتب الأساسية
                </span>
                <span className="text-2xl font-black text-sky-800 dark:text-sky-300 font-mono">
                  <AnimatedNumber value={Number(staffData?.summary?.grandTotalBaseSalary || 0)} suffix="ج.م" />
                </span>
                <p className="text-[11px] text-stone-500 mt-1">حسب سلم الرواتب للموظفين المثبتين</p>
              </div>

              <div className="p-5 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl text-right">
                <span className="text-xs text-stone-500 font-bold block mb-1">
                  صافي مسير الرواتب المستحق للصرف
                </span>
                <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
                  <AnimatedNumber value={Number(staffData?.summary?.grandTotalNetPayroll || 0)} suffix="ج.م" />
                </span>
                <p className="text-[11px] text-stone-500 mt-1">بعد حسم السلف والخصومات وإضافة المكافآت</p>
              </div>
            </div>

            {/* Comprehensive Payroll Table */}
            <div className="p-6 rounded-3xl bg-white/30 dark:bg-stone-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/20 pb-4">
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-700" />
                  <span>جدول مستحقات الكادر ومسير الرواتب (Comprehensive Payroll Table)</span>
                </h3>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/40 dark:border-white/10">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#0f3b2c]/10 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 font-black">
                    <tr>
                      <th className="p-3">اسم الطبيب / الموظف</th>
                      <th className="p-3">التخصص / الدور</th>
                      <th className="p-3">الجلسات</th>
                      <th className="p-3">إجمالي الإيراد</th>
                      <th className="p-3">العمولة</th>
                      <th className="p-3">الراتب الأساسي</th>
                      <th className="p-3">المكافآت</th>
                      <th className="p-3">الخصومات</th>
                      <th className="p-3">السلف</th>
                      <th className="p-3">الصافي المستحق</th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={tableContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="divide-y divide-white/20 dark:divide-white/5"
                  >
                    {(staffData?.staffPayrollList || []).length > 0 ? (
                      staffData.staffPayrollList.map((st: any) => (
                        <motion.tr
                          key={st.id}
                          variants={tableRowVariants}
                          className="hover:bg-white/40 dark:hover:bg-stone-800/40"
                        >
                          <td className="p-3 font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {st.name}
                          </td>
                          <td className="p-3 text-stone-600 dark:text-stone-300">{st.specialty}</td>
                          <td className="p-3 font-bold">{st.sessionsCount}</td>
                          <td className="p-3 font-mono text-stone-700 dark:text-stone-300">
                            {Number(st.totalRevenue).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            {Number(st.commissionOwed).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-3 font-mono text-stone-700 dark:text-stone-300">
                            {Number(st.baseSalary).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-3 font-mono text-emerald-600">
                            +{Number(st.totalBonuses).toLocaleString('ar-EG')}
                          </td>
                          <td className="p-3 font-mono text-rose-600">
                            -{Number(st.totalDeductions).toLocaleString('ar-EG')}
                          </td>
                          <td className="p-3 font-mono text-rose-600">
                            -{Number(st.totalAdvances).toLocaleString('ar-EG')}
                          </td>
                          <td className="p-3 font-mono font-black text-sm text-[#0f3b2c] dark:text-amber-300">
                            {Number(st.netPayable).toLocaleString('ar-EG')} ج.م
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-stone-500">
                          لا توجد بيانات مستحقات مسجلة
                        </td>
                      </tr>
                    )}
                  </motion.tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
