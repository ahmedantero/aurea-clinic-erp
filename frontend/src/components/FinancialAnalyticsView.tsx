import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Receipt, 
  Calendar, 
  RotateCcw, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  ShieldCheck, 
  Sparkles, 
  Scale, 
  FileText,
  CheckCircle2,
  Stethoscope,
  Building2,
  CalendarDays,
  Package,
  AlertTriangle,
  Award,
  Layers,
  Activity,
  Boxes,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { 
  FinancialAnalytics, 
  ExpenseCategoryStat, 
  DailyFinancialStat, 
  StaffBreakdownItem,
  TopServiceStat,
  TopCategoryStat,
  InventoryAnalytics,
  InventoryReportItem
} from '../types';

export type ReportTab = 'financial' | 'staff' | 'services' | 'inventory';

export const FinancialAnalyticsView: React.FC = () => {
  // Tab navigation state: 'financial' | 'staff' | 'services' | 'inventory'
  const [currentReportTab, setCurrentReportTab] = useState<ReportTab>('financial');

  // Preset filter state: 'all' | 'today' | 'this-week' | 'this-month' | 'last-month' | 'custom'
  const [activePreset, setActivePreset] = useState<string>('this-month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<FinancialAnalytics | null>(null);

  // Set date ranges according to presets
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

  // Fetch report data from API
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/reports/financial?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.warn('Failed to fetch financial analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyPreset('this-month');
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const totalRevenue = data?.totalRevenue || 0;
  const totalStaffDue = data?.totalStaffDue || 0;
  const totalExpenses = data?.totalExpenses || 0;
  const netProfit = data?.netProfit || 0;
  const invoicesCount = data?.invoicesCount || 0;

  // Profit Margin
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const isProfitable = netProfit >= 0;

  // Revenue Allocation Percentages
  const staffSharePercent = totalRevenue > 0 ? Math.min(100, Math.round((totalStaffDue / totalRevenue) * 100)) : 0;
  const expensesSharePercent = totalRevenue > 0 ? Math.min(100, Math.round((totalExpenses / totalRevenue) * 100)) : 0;
  const centerMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const expensesByCategory: ExpenseCategoryStat[] = data?.expensesByCategory || [];
  const staffBreakdown: StaffBreakdownItem[] = data?.staffBreakdown || [];
  const dailyTrend: DailyFinancialStat[] = data?.dailyTrend || [];
  const topServices: TopServiceStat[] = data?.topServices || [];
  const topCategories: TopCategoryStat[] = data?.topCategories || [];
  const inventoryAnalytics: InventoryAnalytics = data?.inventoryAnalytics || {
    totalItems: 0,
    totalValuation: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    items: [],
  };

  const arabicDateNow = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Dynamic titles and subtitles for print layout
  const getReportTabTitle = () => {
    switch (currentReportTab) {
      case 'financial':
        return 'التقرير المالي المفصل وقائمة الأرباح والخسائر — Aurea Clinic';
      case 'staff':
        return 'تقرير أداء وإنتاجية الكادر الطبي والمتخصصين — Aurea Clinic';
      case 'services':
        return 'تقرير مبيعات الخدمات والمنتجات الأكثر طلباً — Aurea Clinic';
      case 'inventory':
        return 'تقرير تقييم المخزون المتاح وتنبيهات النواقص — Aurea Clinic';
    }
  };

  const getReportTabSubtitle = () => {
    switch (currentReportTab) {
      case 'financial':
        return 'أوريا كلينيك وسبا — الميزانية الشاملة، الإيرادات، عمولات المتخصصين، وصافي الأرباح (P&L)';
      case 'staff':
        return 'أوريا كلينيك وسبا — بيان إنتاجية الأطباء، الجلسات المنفذة، العمولات، وصافي ربح المركز';
      case 'services':
        return 'أوريا كلينيك وسبا — تحليل الخدمات الأكثر طلباً وحجزاً، ومبيعات التصنيفات الطبية';
      case 'inventory':
        return 'أوريا كلينيك وسبا — حصر وتقييم مستلزمات المخزن، تنبيهات إعادة الطلب، ومؤشرات التوفر';
    }
  };

  return (
    <div className="space-y-6 print:space-y-4 print:text-stone-900" dir="rtl">
      {/* ======================================================== */}
      {/* 1. PREMIUM PRINT HEADER (Letterhead with Cover Banner & Superimposed Logo) */}
      {/* ======================================================== */}
      <div className="hidden print:block mb-8">
        {/* Banner with cover.jpg and superimposed logo.jpg */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#d4af37]/60 shadow-none">
          <img
            src="/cover.jpg"
            alt="Aurea Banner"
            className="w-full h-36 object-cover object-center block"
          />
          {/* Subtle gradient overlay to enhance typography and luxury feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-emerald-950/20 to-transparent pointer-events-none" />

          {/* Superimposed Logo in the center with elegant white background & gold border */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-2 bg-white rounded-2xl shadow-md border-2 border-[#d4af37]">
              <img
                src="/logo.jpg"
                alt="Aurea Logo"
                className="h-20 w-20 object-contain rounded-xl block"
              />
            </div>
          </div>
        </div>

        {/* Official Dynamic Title and Date below the banner */}
        <div className="text-center mt-4 pb-4 border-b-2 border-stone-300">
          <h1 className="text-2xl font-black text-[#0f3b2c] tracking-tight">
            {getReportTabTitle()}
          </h1>
          <p className="text-xs text-[#0f3b2c] font-semibold mt-1">
            {getReportTabSubtitle()}
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-[#0f3b2c] font-medium mt-2">
            <span>تاريخ التقرير: <strong className="text-stone-900">{arabicDateNow}</strong></span>
            <span>•</span>
            <span>
              الفترة: <strong className="text-stone-900">{startDate || 'كافة السجلات'}</strong> إلى <strong className="text-stone-900">{endDate || 'اليوم'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ON-SCREEN PAGE HEADER (Hidden on print) */}
      {/* ======================================================== */}
      <div className="print:hidden bg-gradient-to-l from-white via-white to-[#faf8f5] p-6 rounded-3xl border border-[#d4af37]/30 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-center gap-4">
          {/* Prominent Clinic Logo */}
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-[#d4af37] via-amber-200 to-emerald-900 shadow-md">
              <img
                src="/logo.jpg"
                alt="Aurea Logo"
                className="w-full h-full object-cover rounded-xl bg-white"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center border border-white text-[10px]">
              <Sparkles className="w-3 h-3 text-amber-300" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f3b2c] tracking-tight">
                مركز التقارير والتحليلات
              </h1>
              <span className="text-[11px] font-bold bg-[#faf6ea] text-[#91711e] px-3 py-0.5 rounded-full border border-[#d4af37]/40 shadow-xs">
                Aurea Enterprise Reports
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              أوريا كلينيك وسبا — الميزانية الشاملة، أداء المتخصصين، مبيعات الخدمات، وإدارة المخزون
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f3b2c] hover:bg-[#144c39] text-[#fbf8ee] font-bold text-xs shadow-md shadow-emerald-950/10 border border-[#d4af37]/40 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            title="طباعة التقرير الرسمي للتبويب النشط (Ctrl+P)"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>طباعة التقرير المعتمد</span>
          </button>

          <button
            onClick={fetchReportData}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="تحديث البيانات"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. GLOBAL DATE FILTERS CARD (Hidden on print) */}
      {/* ======================================================== */}
      <div className="print:hidden bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'today', label: 'اليوم' },
            { id: 'this-week', label: 'هذا الأسبوع' },
            { id: 'this-month', label: 'هذا الشهر' },
            { id: 'last-month', label: 'الشهر السابق' },
            { id: 'all', label: 'كافة الفترات' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activePreset === preset.id
                  ? 'bg-[#0f3b2c] text-[#fbf8ee] shadow-sm border border-[#d4af37]/50'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Range Picker */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span>من:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setActivePreset('custom');
                setStartDate(e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 text-xs focus:bg-white focus:outline-hidden"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span>إلى:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setActivePreset('custom');
                setEndDate(e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 text-xs focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. LUXURY TAB NAVIGATION (Deep Green & Gold Theme) */}
      {/* ======================================================== */}
      <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'financial',
            name: 'التقرير المالي (P&L)',
            desc: 'الأرباح، المصروفات، والمستحقات',
            icon: Scale,
            badge: `${totalRevenue.toLocaleString()} ج.م`,
          },
          {
            id: 'staff',
            name: 'أداء المتخصصين (Staff)',
            desc: 'إنتاجية وعمولات الأطباء',
            icon: Users,
            badge: `${staffBreakdown.length} متخصص`,
          },
          {
            id: 'services',
            name: 'الخدمات والمبيعات (Sales)',
            desc: 'الأكثر طلباً وتصنيفاً',
            icon: Sparkles,
            badge: `${topServices.length} خدمة`,
          },
          {
            id: 'inventory',
            name: 'المخزون والتنبيهات (Stock)',
            desc: 'قيمة البضاعة والنواقص',
            icon: Package,
            badge: inventoryAnalytics.lowStockCount > 0 ? `${inventoryAnalytics.lowStockCount} ناقص` : 'مكتمل وآمن',
            isWarning: inventoryAnalytics.lowStockCount > 0,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentReportTab(tab.id as ReportTab)}
              className={`p-4 rounded-2xl text-right transition-all cursor-pointer relative border flex flex-col justify-between ${
                isActive
                  ? 'bg-[#0f3b2c] text-[#fbf8ee] border-[#d4af37] shadow-md shadow-emerald-950/20 ring-1 ring-[#d4af37]'
                  : 'bg-white text-stone-700 hover:bg-stone-50/80 border-stone-200/90 shadow-2xs hover:border-[#d4af37]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isActive
                      ? 'bg-white/10 text-amber-300 border border-[#d4af37]/40'
                      : 'bg-[#0f3b2c]/5 text-[#0f3b2c] border border-[#0f3b2c]/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isActive
                      ? 'bg-[#d4af37]/20 text-amber-200 border-[#d4af37]/40'
                      : tab.isWarning
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {tab.badge}
                </span>
              </div>
              <div>
                <h3 className={`text-sm font-extrabold ${isActive ? 'text-[#fbf8ee]' : 'text-[#0f3b2c]'}`}>
                  {tab.name}
                </h3>
                <p className={`text-[11px] mt-0.5 font-medium ${isActive ? 'text-emerald-100/70' : 'text-stone-400'}`}>
                  {tab.desc}
                </p>
              </div>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#d4af37] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: التقرير المالي الشامل (FINANCIAL P&L STATEMENT) */}
      {/* ========================================================================= */}
      {currentReportTab === 'financial' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
            {/* Card 1: Total Revenue */}
            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs hover:border-[#d4af37] transition-all flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">إجمالي الإيرادات (Total Revenue)</span>
                <div className="w-8 h-8 rounded-xl bg-[#0f3b2c]/10 text-[#0f3b2c] print:border print:border-emerald-800 print:text-emerald-900 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0f3b2c] print:text-emerald-900 tracking-tight">
                  {totalRevenue.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-stone-500 print:text-stone-800">ج.م</span>
                </h3>
                <p className="text-xs text-[#0f3b2c] print:text-emerald-900 font-semibold mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#d4af37] print:text-emerald-800" />
                  <span>{invoicesCount} فاتورة مسددة</span>
                </p>
              </div>
            </div>

            {/* Card 2: Staff Due */}
            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs hover:border-[#d4af37] transition-all flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">مستحقات المتخصصين (Staff Due)</span>
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-800 print:border print:border-violet-300 print:text-violet-900 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0f3b2c] print:text-emerald-900 tracking-tight">
                  {totalStaffDue.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-stone-500 print:text-stone-800">ج.م</span>
                </h3>
                <p className="text-xs text-stone-500 print:text-emerald-900 font-semibold mt-1">
                  يمثل <strong className="text-violet-700 print:text-emerald-950">{staffSharePercent}%</strong> من إجمالي دخل الجلسات
                </p>
              </div>
            </div>

            {/* Card 3: Total Expenses */}
            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs hover:border-[#d4af37] transition-all flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">إجمالي المصروفات (Expenses)</span>
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 print:border print:border-rose-300 print:text-rose-900 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0f3b2c] print:text-emerald-900 tracking-tight">
                  {totalExpenses.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-stone-500 print:text-stone-800">ج.م</span>
                </h3>
                <p className="text-xs text-rose-700 print:text-emerald-900 font-semibold mt-1 flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5 print:text-rose-800" />
                  <span>تكاليف تشغيلية ونثريات</span>
                </p>
              </div>
            </div>

            {/* Card 4: Net Profit */}
            <div className={`p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 shadow-xs transition-all flex flex-col justify-between print:bg-white print:border print:border-[#d4af37] print:shadow-none print:break-inside-avoid ${
              isProfitable
                ? 'bg-[#f4f8f5] border-[#d4af37]'
                : 'bg-[#fff8f5] border-amber-300'
            }`}>
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-[#0f3b2c] print:text-emerald-900">صافي الربح النهائي (Net Profit)</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border print:border-[#d4af37] print:bg-[#0f3b2c] print:text-amber-300 ${
                  isProfitable 
                    ? 'bg-[#0f3b2c] text-amber-300' 
                    : 'bg-amber-600 text-white'
                }`}>
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className={`text-2xl sm:text-3xl font-black tracking-tight print:text-emerald-900 ${
                  isProfitable ? 'text-[#0f3b2c]' : 'text-amber-800'
                }`}>
                  {netProfit.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-stone-600 print:text-stone-800">ج.م</span>
                </h3>
                <p className="text-xs font-bold mt-1 text-[#0f3b2c] print:text-emerald-900 flex items-center gap-1">
                  <span>هامش الربحية:</span>
                  <span className="font-extrabold text-[#d4af37] bg-[#0f3b2c] print:text-emerald-950 print:bg-amber-100 print:border print:border-[#d4af37] px-2 py-0.5 rounded-md text-[11px]">
                    {profitMargin}%
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* P&L Waterfall Bar (Screen Only) */}
          <div className="print:hidden bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span className="text-[#0f3b2c]">
                معادلة صافي الدخل: الإيرادات ({totalRevenue.toLocaleString()} ج.م) - عمولات الأطباء ({totalStaffDue.toLocaleString()} ج.م) - المصروفات ({totalExpenses.toLocaleString()} ج.م)
              </span>
              <span className="font-mono text-emerald-800">{netProfit.toLocaleString()} ج.م</span>
            </div>

            <div className="h-4 w-full rounded-full bg-stone-100 overflow-hidden flex shadow-inner">
              {totalRevenue > 0 && (
                <>
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, staffSharePercent))}%` }}
                    className="bg-violet-600 h-full"
                    title={`عمولات المتخصصين: ${totalStaffDue} ج.م (${staffSharePercent}%)`}
                  />
                  <div
                    style={{ width: `${Math.min(100 - staffSharePercent, Math.max(0, expensesSharePercent))}%` }}
                    className="bg-rose-500 h-full"
                    title={`المصروفات: ${totalExpenses} ج.م (${expensesSharePercent}%)`}
                  />
                  {isProfitable && (
                    <div
                      style={{ width: `${Math.max(0, 100 - staffSharePercent - expensesSharePercent)}%` }}
                      className="bg-[#0f3b2c] h-full"
                      title={`صافي الربح: ${netProfit} ج.م (${centerMarginPercent}%)`}
                    />
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500 flex-wrap gap-2 pt-1 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                <span>عمولات الأطباء: {totalStaffDue.toLocaleString()} ج.م ({staffSharePercent}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>المصروفات: {totalExpenses.toLocaleString()} ج.م ({expensesSharePercent}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0f3b2c]" />
                <span>صافي أرباح المركز: {netProfit.toLocaleString()} ج.م ({centerMarginPercent}%)</span>
              </div>
            </div>
          </div>

          {/* TABLE 1: كشف عمولات وحسابات الكادر الطبي */}
          <div className="bg-white rounded-2xl border-2 border-[#d4af37]/30 print:border print:border-gray-300 print:shadow-none overflow-hidden print:overflow-visible print:break-inside-avoid">
            <div className="p-4 bg-[#faf8f4] print:bg-stone-50 border-b border-[#d4af37]/30 print:border-b print:border-gray-300 flex items-center justify-between print:py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0f3b2c] text-amber-300 print:bg-emerald-900 print:text-amber-200 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-extrabold text-[#0f3b2c] print:text-emerald-950">
                  كشف حسابات وحصص المتخصصين والأطباء (Staff Commissions Statement)
                </h2>
              </div>
              <span className="text-xs font-semibold text-stone-400 print:text-stone-700">
                {staffBreakdown.length} متخصص مسجل
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-right border-collapse print:border-collapse print:border print:border-gray-300 print:break-inside-avoid">
                <thead>
                  <tr className="bg-[#0f3b2c] text-[#fbf8ee] text-xs font-extrabold border-b border-[#d4af37]/50 print:bg-[#0f3b2c] print:text-white print:border-b print:border-gray-300">
                    <th className="py-3 px-4 text-[#d4af37] print:text-amber-200 print:border print:border-gray-300">اسم الأخصائي (Staff Name)</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">التخصص (Specialty)</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">نوع ونسبة التعاقد (Contract)</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">عدد الجلسات</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">إجمالي إيراد الجلسات</th>
                    <th className="py-3 px-4 text-amber-200 print:text-amber-200 print:border print:border-gray-300">مستحق الطبيب (Staff Due)</th>
                    <th className="py-3 px-4 text-emerald-200 print:text-emerald-200 print:border print:border-gray-300">دخل المركز (Center Profit)</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-stone-100 print:divide-y print:divide-gray-300 font-medium print:text-black">
                  {staffBreakdown.length === 0 ? (
                    <tr className="print:break-inside-avoid">
                      <td colSpan={7} className="py-8 text-center text-stone-400 print:text-stone-700 print:border print:border-gray-300">
                        لا توجد بيانات جلسات للأطباء في هذه الفترة.
                      </td>
                    </tr>
                  ) : (
                    staffBreakdown.map((st, idx) => (
                      <tr
                        key={st.id}
                        className={`${
                          idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8f4]/60'
                        } print:bg-white hover:bg-emerald-50/50 transition-colors print:break-inside-avoid`}
                      >
                        <td className="py-3 px-4 font-bold text-stone-800 print:text-black print:py-2 print:border print:border-gray-300">{st.name}</td>
                        <td className="py-3 px-4 text-stone-500 print:text-stone-800 print:py-2 print:border print:border-gray-300">{st.specialty}</td>
                        <td className="py-3 px-4 print:py-2 print:border print:border-gray-300">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 print:text-black text-[11px] font-semibold border border-stone-200 print:border-gray-300">
                            {st.commissionType} ({st.commissionValue}{st.commissionType === 'نسبة' ? '%' : ' ج.م'})
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-stone-700 print:text-black print:py-2 print:border print:border-gray-300">{st.sessionsCount}</td>
                        <td className="py-3 px-4 font-bold text-stone-800 print:text-black print:py-2 print:border print:border-gray-300">{st.totalRevenue.toLocaleString()} ج.م</td>
                        <td className="py-3 px-4 font-extrabold text-violet-800 print:text-emerald-900 print:py-2 print:border print:border-gray-300">
                          {st.staffDue.toLocaleString()} ج.م
                        </td>
                        <td className="py-3 px-4 font-extrabold text-[#0f3b2c] print:text-emerald-950 print:py-2 print:border print:border-gray-300">
                          {st.centerProfit.toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: كشف بنود وتوزيع المصروفات التشغيلية */}
          <div className="bg-white rounded-2xl border-2 border-[#d4af37]/30 print:border print:border-gray-300 print:shadow-none overflow-hidden print:overflow-visible print:break-inside-avoid">
            <div className="p-4 bg-[#faf8f4] print:bg-stone-50 border-b border-[#d4af37]/30 print:border-b print:border-gray-300 flex items-center justify-between print:py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0f3b2c] text-amber-300 print:bg-emerald-900 print:text-amber-200 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-extrabold text-[#0f3b2c] print:text-emerald-950">
                  كشف توزيع المصروفات والنفقات التشغيلية (Expenses Breakdown)
                </h2>
              </div>
              <span className="text-xs font-semibold text-stone-400 print:text-stone-700">
                إجمالي المصروفات: {totalExpenses.toLocaleString()} ج.م
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-right border-collapse print:border-collapse print:border print:border-gray-300 print:break-inside-avoid">
                <thead>
                  <tr className="bg-[#0f3b2c] text-[#fbf8ee] text-xs font-extrabold border-b border-[#d4af37]/50 print:bg-[#0f3b2c] print:text-white print:border-b print:border-gray-300">
                    <th className="py-3 px-4 text-[#d4af37] print:text-amber-200 print:border print:border-gray-300">بند المصروف (Expense Category)</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">المبلغ المنصرف (Amount)</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">النسبة من إجمالي النفقات</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">النسبة من إجمالي الإيرادات</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">مؤشر العبء المالي</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-stone-100 print:divide-y print:divide-gray-300 font-medium print:text-black">
                  {expensesByCategory.length === 0 ? (
                    <tr className="print:break-inside-avoid">
                      <td colSpan={5} className="py-8 text-center text-stone-400 print:text-stone-700 print:border print:border-gray-300">
                        لا توجد مصروفات مسجلة في هذه الفترة.
                      </td>
                    </tr>
                  ) : (
                    expensesByCategory.map((exp, idx) => {
                      const revPercent = totalRevenue > 0 ? Math.round((exp.amount / totalRevenue) * 100) : 0;
                      return (
                        <tr
                          key={exp.category}
                          className={`${
                            idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8f4]/60'
                          } print:bg-white hover:bg-emerald-50/50 transition-colors print:break-inside-avoid`}
                        >
                          <td className="py-3 px-4 font-bold text-stone-800 print:text-black print:py-2 print:border print:border-gray-300">{exp.category}</td>
                          <td className="py-3 px-4 font-black text-rose-700 print:text-rose-900 print:py-2 print:border print:border-gray-300">
                            {exp.amount.toLocaleString()} ج.م
                          </td>
                          <td className="py-3 px-4 print:py-2 print:border print:border-gray-300">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-700 print:text-black">{exp.percentage}%</span>
                              <div className="w-16 h-1.5 rounded-full bg-stone-100 overflow-hidden print:hidden">
                                <div
                                  style={{ width: `${exp.percentage}%` }}
                                  className="h-full bg-rose-500 rounded-full"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-stone-600 print:text-stone-800 print:py-2 print:border print:border-gray-300">
                            {revPercent}% من الدخل
                          </td>
                          <td className="py-3 px-4 print:py-2 print:border print:border-gray-300">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600 print:text-black print:border print:border-gray-300">
                              تشغيلي دوري
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 3: التدفق والنشاط المالي الدوري */}
          {dailyTrend.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-[#d4af37]/30 print:border print:border-gray-300 print:shadow-none overflow-hidden print:overflow-visible print:break-inside-avoid">
              <div className="p-4 bg-[#faf8f4] print:bg-stone-50 border-b border-[#d4af37]/30 print:border-b print:border-gray-300 flex items-center justify-between print:py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0f3b2c] text-amber-300 print:bg-emerald-900 print:text-amber-200 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-extrabold text-[#0f3b2c] print:text-emerald-950">
                    بيان التدفق المالي وحركة الأيام (Daily Financial Activity)
                  </h2>
                </div>
                <span className="text-xs font-semibold text-stone-400 print:text-stone-700">
                  {dailyTrend.length} يوم بحركات مالية
                </span>
              </div>

              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-right border-collapse print:border-collapse print:border print:border-gray-300 print:break-inside-avoid">
                  <thead>
                    <tr className="bg-[#0f3b2c] text-[#fbf8ee] text-xs font-extrabold border-b border-[#d4af37]/50 print:bg-[#0f3b2c] print:text-white print:border-b print:border-gray-300">
                      <th className="py-3 px-4 text-[#d4af37] print:text-amber-200 print:border print:border-gray-300">التاريخ</th>
                      <th className="py-3 px-4 print:text-white print:border print:border-gray-300">اليوم</th>
                      <th className="py-3 px-4 text-emerald-200 print:text-emerald-200 print:border print:border-gray-300">إجمالي الإيراد</th>
                      <th className="py-3 px-4 text-violet-200 print:text-violet-200 print:border print:border-gray-300">عمولات الأطباء</th>
                      <th className="py-3 px-4 text-rose-200 print:text-rose-200 print:border print:border-gray-300">المصروفات</th>
                      <th className="py-3 px-4 text-amber-200 print:text-amber-200 print:border print:border-gray-300">صافي ربح اليوم</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-stone-100 print:divide-y print:divide-gray-300 font-medium print:text-black">
                    {dailyTrend.map((day, idx) => (
                      <tr
                        key={day.date}
                        className={`${
                          idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8f4]/60'
                        } print:bg-white hover:bg-emerald-50/50 transition-colors print:break-inside-avoid`}
                      >
                        <td className="py-3 px-4 font-mono text-stone-700 print:text-black print:py-2 print:border print:border-gray-300" dir="ltr">{day.date}</td>
                        <td className="py-3 px-4 font-bold text-stone-800 print:text-black print:py-2 print:border print:border-gray-300">{day.dayName}</td>
                        <td className="py-3 px-4 font-bold text-[#0f3b2c] print:text-emerald-950 print:py-2 print:border print:border-gray-300">{day.revenue.toLocaleString()} ج.م</td>
                        <td className="py-3 px-4 text-violet-800 print:text-emerald-900 print:py-2 print:border print:border-gray-300">{day.staffDue.toLocaleString()} ج.م</td>
                        <td className="py-3 px-4 text-rose-700 print:text-rose-900 print:py-2 print:border print:border-gray-300">{day.expenses.toLocaleString()} ج.م</td>
                        <td className={`py-3 px-4 font-black print:py-2 print:border print:border-gray-300 ${
                          day.netProfit >= 0 ? 'text-[#0f3b2c] print:text-emerald-950' : 'text-amber-800 print:text-rose-900'
                        }`}>
                          {day.netProfit.toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: أداء المتخصصين (STAFF PERFORMANCE REPORT) */}
      {/* ========================================================================= */}
      {currentReportTab === 'staff' && (
        <div className="space-y-6">
          {/* Staff KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">الكادر الطبي النشط</span>
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center border border-violet-200">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0f3b2c] print:text-emerald-900 tracking-tight">
                  {staffBreakdown.length} <span className="text-xs font-normal text-stone-500">متخصص</span>
                </h3>
                <p className="text-xs text-stone-500 print:text-emerald-900 font-semibold mt-1">
                  أطباء واستشاريين معتمدين
                </p>
              </div>
            </div>

            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">إجمالي دخل الجلسات</span>
                <div className="w-8 h-8 rounded-xl bg-[#0f3b2c]/10 text-[#0f3b2c] flex items-center justify-center border border-[#0f3b2c]/20">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0f3b2c] print:text-emerald-900 tracking-tight">
                  {staffBreakdown.reduce((s, x) => s + x.totalRevenue, 0).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-stone-500">ج.م</span>
                </h3>
                <p className="text-xs text-[#0f3b2c] print:text-emerald-900 font-semibold mt-1">
                  من الجلسات المكتملة
                </p>
              </div>
            </div>

            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">مستحقات الأطباء</span>
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center border border-violet-200">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-violet-800 print:text-emerald-900 tracking-tight">
                  {totalStaffDue.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-stone-500">ج.م</span>
                </h3>
                <p className="text-xs text-stone-500 print:text-emerald-900 font-semibold mt-1">
                  إجمالي حصص ونسب الأطباء
                </p>
              </div>
            </div>

            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">صافي دخل المركز من الأطباء</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0f3b2c] print:text-emerald-900 tracking-tight">
                  {staffBreakdown.reduce((s, x) => s + x.centerProfit, 0).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-stone-500">ج.م</span>
                </h3>
                <p className="text-xs text-emerald-800 print:text-emerald-900 font-semibold mt-1">
                  حصص المركز + مبالغ الإيجار
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Performance Table with Progress Bars */}
          <div className="bg-white rounded-2xl border-2 border-[#d4af37]/30 print:border print:border-gray-300 print:shadow-none overflow-hidden print:overflow-visible print:break-inside-avoid">
            <div className="p-4 bg-[#faf8f4] print:bg-stone-50 border-b border-[#d4af37]/30 print:border-b print:border-gray-300 flex items-center justify-between print:py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0f3b2c] text-amber-300 print:bg-emerald-900 print:text-amber-200 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-extrabold text-[#0f3b2c] print:text-emerald-950">
                  كشف تقييم وإنتاجية الكادر الطبي مع مؤشرات الأداء (Specialist Productivity & Performance)
                </h2>
              </div>
              <span className="text-xs font-semibold text-stone-400 print:text-stone-700">
                مرتب حسب أعلى إيراد محقق
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-right border-collapse print:border-collapse print:border print:border-gray-300 print:break-inside-avoid">
                <thead>
                  <tr className="bg-[#0f3b2c] text-[#fbf8ee] text-xs font-extrabold border-b border-[#d4af37]/50 print:bg-[#0f3b2c] print:text-white print:border-b print:border-gray-300">
                    <th className="py-3 px-4 text-[#d4af37] print:text-amber-200 print:border print:border-gray-300">اسم الأخصائي</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">التخصص</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">نوع ونسبة التعاقد</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">الجلسات</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">إجمالي الإيراد المحقق</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">مؤشر المساهمة في دخل المركز</th>
                    <th className="py-3 px-4 text-violet-200 print:text-violet-200 print:border print:border-gray-300">مستحق الطبيب</th>
                    <th className="py-3 px-4 text-emerald-200 print:text-emerald-200 print:border print:border-gray-300">ربح المركز</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-stone-100 print:divide-y print:divide-gray-300 font-medium print:text-black">
                  {staffBreakdown.length === 0 ? (
                    <tr className="print:break-inside-avoid">
                      <td colSpan={8} className="py-8 text-center text-stone-400 print:text-stone-700 print:border print:border-gray-300">
                        لا توجد بيانات للأطباء في هذه الفترة.
                      </td>
                    </tr>
                  ) : (
                    [...staffBreakdown]
                      .sort((a, b) => b.totalRevenue - a.totalRevenue)
                      .map((st, idx) => {
                        const contributionPercent = totalRevenue > 0 ? Math.round((st.totalRevenue / totalRevenue) * 100) : 0;
                        return (
                          <tr
                            key={st.id}
                            className={`${
                              idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8f4]/60'
                            } print:bg-white hover:bg-emerald-50/50 transition-colors print:break-inside-avoid`}
                          >
                            <td className="py-3 px-4 font-bold text-stone-800 print:text-black print:py-2 print:border print:border-gray-300">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-stone-100 print:hidden text-stone-600 font-bold text-[10px] flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span>{st.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-stone-500 print:text-stone-800 print:py-2 print:border print:border-gray-300">{st.specialty}</td>
                            <td className="py-3 px-4 print:py-2 print:border print:border-gray-300">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 print:text-black text-[11px] font-semibold border border-stone-200 print:border-gray-300">
                                {st.commissionType} ({st.commissionValue}{st.commissionType === 'نسبة' ? '%' : ' ج.م'})
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-stone-700 print:text-black print:py-2 print:border print:border-gray-300">
                              {st.sessionsCount} جلسة
                            </td>
                            <td className="py-3 px-4 font-bold text-stone-800 print:text-black print:py-2 print:border print:border-gray-300">
                              {st.totalRevenue.toLocaleString()} ج.م
                            </td>
                            <td className="py-3 px-4 print:py-2 print:border print:border-gray-300">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-700 print:text-black w-9">{contributionPercent}%</span>
                                <div className="w-24 h-2 rounded-full bg-stone-100 overflow-hidden print:hidden">
                                  <div
                                    style={{ width: `${Math.min(100, contributionPercent)}%` }}
                                    className="h-full bg-[#0f3b2c] rounded-full"
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-extrabold text-violet-800 print:text-emerald-900 print:py-2 print:border print:border-gray-300">
                              {st.staffDue.toLocaleString()} ج.م
                            </td>
                            <td className="py-3 px-4 font-extrabold text-[#0f3b2c] print:text-emerald-950 print:py-2 print:border print:border-gray-300">
                              {st.centerProfit.toLocaleString()} ج.م
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: الخدمات والمبيعات (TOP SERVICES & SALES REPORT) */}
      {/* ========================================================================= */}
      {currentReportTab === 'services' && (
        <div className="space-y-6">
          {/* Services KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">إجمالي الجلسات المنفذة</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0f3b2c] print:text-emerald-900 tracking-tight">
                  {topServices.reduce((s, x) => s + x.bookingsCount, 0)}{' '}
                  <span className="text-xs font-normal text-stone-500">جلسة</span>
                </h3>
                <p className="text-xs text-[#0f3b2c] font-semibold mt-1">
                  حجوزات مدفوعة ومكتملة
                </p>
              </div>
            </div>

            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">إجمالي إيرادات الخدمات</span>
                <div className="w-8 h-8 rounded-xl bg-[#0f3b2c]/10 text-[#0f3b2c] flex items-center justify-center border border-[#0f3b2c]/20">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0f3b2c] print:text-emerald-900 tracking-tight">
                  {topServices.reduce((s, x) => s + x.totalRevenue, 0).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-stone-500">ج.م</span>
                </h3>
                <p className="text-xs text-stone-500 font-semibold mt-1">
                  عائد مبيعات باقات وجلسات
                </p>
              </div>
            </div>

            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">الخدمة الأكثر طلباً</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#0f3b2c] print:text-emerald-900 truncate tracking-tight" title={topServices[0]?.name}>
                  {topServices[0]?.name || 'لا توجد بيانات'}
                </h3>
                <p className="text-xs text-amber-800 font-semibold mt-1">
                  {topServices[0]?.bookingsCount || 0} مرات حجز
                </p>
              </div>
            </div>

            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">التصنيف الأعلى ربحاً</span>
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center border border-violet-200">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#0f3b2c] print:text-emerald-900 truncate tracking-tight">
                  {topCategories[0]?.category || 'لا توجد بيانات'}
                </h3>
                <p className="text-xs text-violet-700 font-semibold mt-1">
                  {topCategories[0]?.revenue ? `${topCategories[0].revenue.toLocaleString()} ج.م` : '0 ج.م'}
                </p>
              </div>
            </div>
          </div>

          {/* TABLE 1: الخدمات الأكثر طلباً وحجزاً */}
          <div className="bg-white rounded-2xl border-2 border-[#d4af37]/30 print:border print:border-gray-300 print:shadow-none overflow-hidden print:overflow-visible print:break-inside-avoid">
            <div className="p-4 bg-[#faf8f4] print:bg-stone-50 border-b border-[#d4af37]/30 print:border-b print:border-gray-300 flex items-center justify-between print:py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0f3b2c] text-amber-300 print:bg-emerald-900 print:text-amber-200 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-extrabold text-[#0f3b2c] print:text-emerald-950">
                  قائمة الخدمات الأكثر طلباً وتحقيقاً للدخل (Top Booked Services & Revenue)
                </h2>
              </div>
              <span className="text-xs font-semibold text-stone-400 print:text-stone-700">
                {topServices.length} خدمة مسجلة
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-right border-collapse print:border-collapse print:border print:border-gray-300 print:break-inside-avoid">
                <thead>
                  <tr className="bg-[#0f3b2c] text-[#fbf8ee] text-xs font-extrabold border-b border-[#d4af37]/50 print:bg-[#0f3b2c] print:text-white print:border-b print:border-gray-300">
                    <th className="py-3 px-4 text-[#d4af37] print:text-amber-200 print:border print:border-gray-300">الترتيب</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">اسم الخدمة</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">التصنيف الطبي</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">السعر الأساسي</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">عدد الحجوزات</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">إجمالي الدخل</th>
                    <th className="py-3 px-4 text-amber-200 print:text-amber-200 print:border print:border-gray-300">نسبة المساهمة المالية</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-stone-100 print:divide-y print:divide-gray-300 font-medium print:text-black">
                  {topServices.length === 0 ? (
                    <tr className="print:break-inside-avoid">
                      <td colSpan={7} className="py-8 text-center text-stone-400 print:text-stone-700 print:border print:border-gray-300">
                        لا توجد بيانات خدمات منفذة في هذه الفترة.
                      </td>
                    </tr>
                  ) : (
                    topServices.map((srv, idx) => (
                      <tr
                        key={srv.id}
                        className={`${
                          idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8f4]/60'
                        } print:bg-white hover:bg-emerald-50/50 transition-colors print:break-inside-avoid`}
                      >
                        <td className="py-3 px-4 font-bold text-stone-800 print:text-black print:py-2 print:border print:border-gray-300">
                          <span className="w-6 h-6 rounded-lg bg-[#0f3b2c]/10 text-[#0f3b2c] font-black text-xs inline-flex items-center justify-center">
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-stone-800 print:text-black print:py-2 print:border print:border-gray-300">{srv.name}</td>
                        <td className="py-3 px-4 text-stone-500 print:text-stone-800 print:py-2 print:border print:border-gray-300">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-semibold border border-stone-200">
                            {srv.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-700 print:text-black print:py-2 print:border print:border-gray-300">{srv.basePrice} ج.م</td>
                        <td className="py-3 px-4 font-black text-stone-800 print:text-black print:py-2 print:border print:border-gray-300">{srv.bookingsCount} حجز</td>
                        <td className="py-3 px-4 font-black text-[#0f3b2c] print:text-emerald-950 print:py-2 print:border print:border-gray-300">
                          {srv.totalRevenue.toLocaleString()} ج.م
                        </td>
                        <td className="py-3 px-4 print:py-2 print:border print:border-gray-300">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-700 print:text-black w-8">{srv.percentage}%</span>
                            <div className="w-24 h-2 rounded-full bg-stone-100 overflow-hidden print:hidden">
                              <div
                                style={{ width: `${Math.min(100, srv.percentage)}%` }}
                                className="h-full bg-gradient-to-l from-[#d4af37] to-[#0f3b2c] rounded-full"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: توزيع الإيرادات حسب التصنيفات الطبية */}
          {topCategories.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-[#d4af37]/30 print:border print:border-gray-300 print:shadow-none overflow-hidden print:overflow-visible print:break-inside-avoid">
              <div className="p-4 bg-[#faf8f4] print:bg-stone-50 border-b border-[#d4af37]/30 print:border-b print:border-gray-300 flex items-center justify-between print:py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0f3b2c] text-amber-300 print:bg-emerald-900 print:text-amber-200 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-extrabold text-[#0f3b2c] print:text-emerald-950">
                    تحليل وتوزيع المبيعات حسب التصنيفات (Revenue by Medical Category)
                  </h2>
                </div>
                <span className="text-xs font-semibold text-stone-400 print:text-stone-700">
                  {topCategories.length} أقسام وتصنيفات
                </span>
              </div>

              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-right border-collapse print:border-collapse print:border print:border-gray-300 print:break-inside-avoid">
                  <thead>
                    <tr className="bg-[#0f3b2c] text-[#fbf8ee] text-xs font-extrabold border-b border-[#d4af37]/50 print:bg-[#0f3b2c] print:text-white print:border-b print:border-gray-300">
                      <th className="py-3 px-4 text-[#d4af37] print:text-amber-200 print:border print:border-gray-300">التصنيف</th>
                      <th className="py-3 px-4 print:text-white print:border print:border-gray-300">إجمالي الدخل المحقق</th>
                      <th className="py-3 px-4 print:text-white print:border print:border-gray-300">النسبة من إجمالي مبيعات الخدمات</th>
                      <th className="py-3 px-4 print:text-white print:border print:border-gray-300">مؤشر الثقل المالي</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-stone-100 print:divide-y print:divide-gray-300 font-medium print:text-black">
                    {topCategories.map((cat, idx) => (
                      <tr
                        key={cat.category}
                        className={`${
                          idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8f4]/60'
                        } print:bg-white hover:bg-emerald-50/50 transition-colors print:break-inside-avoid`}
                      >
                        <td className="py-3 px-4 font-bold text-stone-800 print:text-black print:py-2 print:border print:border-gray-300">{cat.category}</td>
                        <td className="py-3 px-4 font-black text-[#0f3b2c] print:text-emerald-950 print:py-2 print:border print:border-gray-300">{cat.revenue.toLocaleString()} ج.م</td>
                        <td className="py-3 px-4 print:py-2 print:border print:border-gray-300">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-700 print:text-black w-8">{cat.percentage}%</span>
                            <div className="w-32 h-2 rounded-full bg-stone-100 overflow-hidden print:hidden">
                              <div
                                style={{ width: `${Math.min(100, cat.percentage)}%` }}
                                className="h-full bg-violet-600 rounded-full"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 print:py-2 print:border print:border-gray-300">
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-[#0f3b2c] border border-emerald-200">
                            قطاع تشغيلي أساسي
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: المخزون وتنبيهات النواقص (INVENTORY ALERTS & VALUATION REPORT) */}
      {/* ========================================================================= */}
      {currentReportTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">إجمالي أصناف المخزون</span>
                <div className="w-8 h-8 rounded-xl bg-[#0f3b2c]/10 text-[#0f3b2c] flex items-center justify-center border border-[#0f3b2c]/20">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0f3b2c] print:text-emerald-900 tracking-tight">
                  {inventoryAnalytics.totalItems}{' '}
                  <span className="text-xs font-normal text-stone-500">صنف</span>
                </h3>
                <p className="text-xs text-stone-500 font-semibold mt-1">
                  مستلزمات طبية ومنتجات سبا
                </p>
              </div>
            </div>

            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">القيمة الإجمالية للمخزون</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0f3b2c] print:text-emerald-900 tracking-tight">
                  {inventoryAnalytics.totalValuation.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-stone-500">ج.م</span>
                </h3>
                <p className="text-xs text-[#0f3b2c] font-semibold mt-1">
                  إجمالي قيمة الرصيد المتوفر
                </p>
              </div>
            </div>

            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">تنبيهات انخفاض الرصيد</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-800 print:text-emerald-900 tracking-tight">
                  {inventoryAnalytics.lowStockCount}{' '}
                  <span className="text-xs font-normal text-stone-500">أصناف</span>
                </h3>
                <p className="text-xs text-amber-700 font-semibold mt-1">
                  تحتاج إعادة طلب وتوريد
                </p>
              </div>
            </div>

            <div className="bg-[#faf8f4] print:bg-white print:border print:border-[#d4af37] print:shadow-none p-5 print:p-3.5 rounded-2xl print:rounded-xl border-2 border-[#d4af37]/40 shadow-xs flex flex-col justify-between print:break-inside-avoid">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-bold text-stone-500 print:text-emerald-900">أصناف نفدت بالكامل</span>
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center border border-rose-200">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  inventoryAnalytics.outOfStockCount > 0 ? 'text-rose-700' : 'text-[#0f3b2c]'
                }`}>
                  {inventoryAnalytics.outOfStockCount}{' '}
                  <span className="text-xs font-normal text-stone-500">صنف</span>
                </h3>
                <p className="text-xs text-stone-500 font-semibold mt-1">
                  رصيد المخزن: 0
                </p>
              </div>
            </div>
          </div>

          {/* Stock Health Banner */}
          {inventoryAnalytics.lowStockCount > 0 || inventoryAnalytics.outOfStockCount > 0 ? (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>تنبيه إدارة المخزون:</strong> يوجد {inventoryAnalytics.lowStockCount} أصناف اقتربت من حد الأمان و {inventoryAnalytics.outOfStockCount} أصناف نفدت. يرجى مراجعة الجدول أدناه وإصدار أوامر توريد.
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-900 font-bold shrink-0 text-[11px]">
                مطلوب إجراء
              </span>
            </div>
          ) : (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>حالة المخزون ممتازة:</strong> كافة المستلزمات الطبية والسبا متوفرة بكميات آمنة وكافية للتشغيل.
              </span>
            </div>
          )}

          {/* TABLE: كشف تقييم المخزون المتاح ومؤشرات التوفر */}
          <div className="bg-white rounded-2xl border-2 border-[#d4af37]/30 print:border print:border-gray-300 print:shadow-none overflow-hidden print:overflow-visible print:break-inside-avoid">
            <div className="p-4 bg-[#faf8f4] print:bg-stone-50 border-b border-[#d4af37]/30 print:border-b print:border-gray-300 flex items-center justify-between print:py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0f3b2c] text-amber-300 print:bg-emerald-900 print:text-amber-200 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-extrabold text-[#0f3b2c] print:text-emerald-950">
                  كشف تقييم المستلزمات وحالة الأرصدة (Inventory Valuation & Stock Status)
                </h2>
              </div>
              <span className="text-xs font-semibold text-stone-400 print:text-stone-700">
                إجمالي التقييم: {inventoryAnalytics.totalValuation.toLocaleString()} ج.م
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-right border-collapse print:border-collapse print:border print:border-gray-300 print:break-inside-avoid">
                <thead>
                  <tr className="bg-[#0f3b2c] text-[#fbf8ee] text-xs font-extrabold border-b border-[#d4af37]/50 print:bg-[#0f3b2c] print:text-white print:border-b print:border-gray-300">
                    <th className="py-3 px-4 text-[#d4af37] print:text-amber-200 print:border print:border-gray-300">اسم المنتج / المستلزم</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">وحدة الصرف</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">تكلفة الوحدة</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">الرصيد الفعلي</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">إجمالي القيمة التقديرية</th>
                    <th className="py-3 px-4 print:text-white print:border print:border-gray-300">مؤشر رصيد المستودع</th>
                    <th className="py-3 px-4 text-emerald-200 print:text-emerald-200 print:border print:border-gray-300">حالة التوفر</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-stone-100 print:divide-y print:divide-gray-300 font-medium print:text-black">
                  {inventoryAnalytics.items.length === 0 ? (
                    <tr className="print:break-inside-avoid">
                      <td colSpan={7} className="py-8 text-center text-stone-400 print:text-stone-700 print:border print:border-gray-300">
                        لا توجد عناصر مسجلة في المخزن حالياً.
                      </td>
                    </tr>
                  ) : (
                    inventoryAnalytics.items.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`${
                          idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8f4]/60'
                        } print:bg-white hover:bg-emerald-50/50 transition-colors print:break-inside-avoid`}
                      >
                        <td className="py-3 px-4 font-bold text-stone-800 print:text-black print:py-2 print:border print:border-gray-300">{item.name}</td>
                        <td className="py-3 px-4 text-stone-500 print:text-stone-800 print:py-2 print:border print:border-gray-300">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-semibold border border-stone-200">
                            {item.unitType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-700 print:text-black print:py-2 print:border print:border-gray-300">{item.unitCost} ج.م</td>
                        <td className={`py-3 px-4 font-black print:text-black print:py-2 print:border print:border-gray-300 ${
                          item.quantityInStock <= 0 ? 'text-rose-600' : item.quantityInStock <= 10 ? 'text-amber-600' : 'text-stone-800'
                        }`}>
                          {item.quantityInStock} {item.unitType}
                        </td>
                        <td className="py-3 px-4 font-black text-[#0f3b2c] print:text-emerald-950 print:py-2 print:border print:border-gray-300">
                          {item.valuation.toLocaleString()} ج.م
                        </td>
                        <td className="py-3 px-4 print:py-2 print:border print:border-gray-300">
                          <div className="w-24 h-2 rounded-full bg-stone-100 overflow-hidden print:hidden">
                            <div
                              style={{ width: `${Math.min(100, Math.max(0, item.quantityInStock * 2))}%` }}
                              className={`h-full rounded-full ${
                                item.quantityInStock <= 0 ? 'bg-rose-500' : item.quantityInStock <= 10 ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 print:py-2 print:border print:border-gray-300">
                          {item.status === 'out_of_stock' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              نفد من المخزن
                            </span>
                          ) : item.status === 'low_stock' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              منخفض - يرجى الطلب
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              متوفر بشكل كافي
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. OFFICIAL PRINT FOOTER & SIGNATURE (Only on Ctrl+P print) */}
      {/* ======================================================== */}
      <div className="hidden print:block pt-8 mt-8 border-t-2 border-gray-300 text-xs text-stone-800 print:break-inside-avoid">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-bold text-[#0f3b2c] mb-10">إعداد المحاسب المالي</p>
            <p className="border-t border-gray-300 pt-1 text-[11px] text-stone-600">التوقيع والاعتماد</p>
          </div>
          <div>
            <p className="font-bold text-[#0f3b2c] mb-10">المدير الطبي والتشغيلي</p>
            <p className="border-t border-gray-300 pt-1 text-[11px] text-stone-600">التوقيع والاعتماد</p>
          </div>
          <div>
            <p className="font-bold text-[#0f3b2c] mb-10">خاتم إدارة أوريا كلينيك</p>
            <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-[#0f3b2c]/40 flex items-center justify-center text-[10px] text-[#0f3b2c] font-bold">
              خاتم رسمي معتمد
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-stone-500 mt-6">
          تم إنشاء هذا التقرير تلقائياً عبر نظام Aurea Clinic & Spa Management System • وثيقة إدارية رسمية معتمدة
        </p>
      </div>
    </div>
  );
};
