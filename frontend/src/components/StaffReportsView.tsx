import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  FileText, 
  RotateCcw, 
  Search, 
  Printer, 
  ChevronRight, 
  Eye, 
  Percent, 
  Building2, 
  Sparkles,
  X,
  CreditCard,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';
import { StaffReportItem, StaffReportAppointment } from '../types';
import { Pagination } from './ui/Pagination';
import { usePagination } from '../hooks/usePagination';

export const StaffReportsView: React.FC = () => {
  const [reports, setReports] = useState<StaffReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Date Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activePreset, setActivePreset] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Search & Contract Type Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [contractFilter, setContractFilter] = useState<'all' | 'percentage' | 'fixed'>('all');

  // Drilldown Modal
  const [selectedStaffForDetails, setSelectedStaffForDetails] = useState<StaffReportItem | null>(null);

  // Fetch report data from API
  const fetchReportData = async (start = startDate, end = endDate) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      const url = `/api/reports/staff${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('فشل جلب تقرير حسابات المتخصصين');

      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('API error, loading fallback mock if available:', err);
      setError('تعذر تحميل البيانات من السيرفر، يرجى إعادة المحاولة.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(startDate, endDate);
  }, []);

  // Quick Date Preset Handlers
  const handlePresetChange = (preset: 'all' | 'today' | 'week' | 'month') => {
    setActivePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      fetchReportData('', '');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
      fetchReportData(todayStr, todayStr);
    } else if (preset === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      const weekStr = startOfWeek.toISOString().split('T')[0];
      setStartDate(weekStr);
      setEndDate(todayStr);
      fetchReportData(weekStr, todayStr);
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStr = startOfMonth.toISOString().split('T')[0];
      setStartDate(monthStr);
      setEndDate(todayStr);
      fetchReportData(monthStr, todayStr);
    }
  };

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePreset('all');
    fetchReportData(startDate, endDate);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered staff list
  const filteredReports = reports.filter((item) => {
    const matchesSearch = item.name.includes(searchTerm) || item.specialty.includes(searchTerm);
    const matchesContract = 
      contractFilter === 'all'
        ? true
        : contractFilter === 'percentage'
        ? item.commissionType === 'نسبة' || item.commissionType.includes('%')
        : item.commissionType === 'ثابت' || item.commissionType.includes('إيجار');

    return matchesSearch && matchesContract;
  });

  // Luxury Pagination Controller
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData: paginatedReports,
    resetPage,
  } = usePagination(filteredReports, { initialPageSize: 10 });

  useEffect(() => {
    resetPage();
  }, [searchTerm, contractFilter, startDate, endDate]);

  // Aggregate Metrics
  const totalCenterRevenue = reports.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalStaffPayouts = reports.reduce((sum, item) => sum + item.staffDue, 0);
  const totalNetProfit = reports.reduce((sum, item) => sum + item.centerProfit, 0);
  const totalCompletedSessions = reports.reduce((sum, item) => sum + item.sessionsCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">حسابات وعمولات المتخصصين</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            تقارير الأرباح، توزيع الإيرادات، وحساب نسب وإيجارات الأطباء والأخصائيين
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReportData(startDate, endDate)}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="تحديث البيانات"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] font-bold text-xs shadow-md shadow-emerald-950/15 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>طباعة التقرير (Print)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-white via-[#fcfaf6] to-[#f8f5ee] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 p-5 rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">إجمالي إيرادات الجلسات</p>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white mt-1">
              {totalCenterRevenue.toLocaleString()} <span className="text-xs font-normal text-stone-500">ج.م</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">الفواتير المسددة والمكتملة</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0f3b2c]/10 text-[#0f3b2c] dark:bg-emerald-500/10 dark:text-emerald-400 border border-[#0f3b2c]/15 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Staff Payouts */}
        <div className="bg-gradient-to-br from-white via-[#fcfaf6] to-[#f8f5ee] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 p-5 rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">مستحقات الأخصائيين</p>
            <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
              {totalStaffPayouts.toLocaleString()} <span className="text-xs font-normal text-stone-500">ج.م</span>
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-0.5">عمولات النسب + 100% دخل جلسات الإيجار</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        {/* Center Net Profit */}
        <div className="bg-gradient-to-br from-white via-[#fcfaf6] to-[#f8f5ee] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 p-5 rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">صافي ربح المركز</p>
            <h3 className="text-2xl font-black text-[#0f3b2c] dark:text-emerald-400 mt-1">
              {totalNetProfit.toLocaleString()} <span className="text-xs font-normal text-stone-500">ج.م</span>
            </h3>
            <p className="text-xs text-[#0f3b2c]/80 dark:text-emerald-500/80 font-medium mt-0.5">أرباح النسب + الإيجار الثابت للأطباء</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0f3b2c]/10 text-[#0f3b2c] dark:bg-emerald-500/10 dark:text-emerald-400 border border-[#0f3b2c]/15 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Sessions */}
        <div className="bg-gradient-to-br from-white via-[#fcfaf6] to-[#f8f5ee] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 p-5 rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">الجلسات المكتملة</p>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white mt-1">{totalCompletedSessions}</h3>
            <p className="text-xs text-stone-400 mt-0.5">جلسة تم دفع فواتيرها</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Date Filter & Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-stone-500 ml-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              الفترة:
            </span>
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activePreset === 'all' && !startDate && !endDate
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60'
              }`}
            >
              كل الفترات
            </button>
            <button
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activePreset === 'today'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => handlePresetChange('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activePreset === 'week'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => handlePresetChange('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activePreset === 'month'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60'
              }`}
            >
              هذا الشهر
            </button>
          </div>

          {/* Custom Date Range Picker */}
          <form onSubmit={handleApplyCustomDates} className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200/80 text-xs text-stone-600">
              <span className="text-[11px] text-stone-400">من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-medium focus:outline-hidden text-stone-800"
              />
            </div>

            <div className="flex items-center gap-1 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200/80 text-xs text-stone-600">
              <span className="text-[11px] text-stone-400">إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs font-medium focus:outline-hidden text-stone-800"
              />
            </div>

            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              تطبيق الفلتر
            </button>
          </form>
        </div>

        {/* Sub-Filters: Search and Contract Type Filter */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث باسم الأخصائي أو التخصص..."
              className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border border-stone-200/80 bg-stone-50/50 focus:bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 placeholder-stone-400"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] text-stone-400">نوع التعاقد:</span>
            <button
              onClick={() => setContractFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                contractFilter === 'all' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setContractFilter('percentage')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                contractFilter === 'percentage' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              نسبة مئوية (%)
            </button>
            <button
              onClick={() => setContractFilter('fixed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                contractFilter === 'fixed' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              إيجار / ثابت
            </button>
          </div>
        </div>
      </div>

      {/* Main Reports Table */}
      <div className="bg-white/85 dark:bg-stone-900/85 backdrop-blur-xl rounded-3xl border border-stone-200/90 dark:border-white/10 shadow-[0_15px_40px_-12px_rgba(15,59,44,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="sticky top-0 z-10 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/90 dark:border-stone-800 shadow-2xs">
              <tr className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                <th className="py-3.5 px-6">اسم الأخصائي (Specialist Name)</th>
                <th className="py-3.5 px-6">نوع التعاقد (Contract Type)</th>
                <th className="py-3.5 px-6">عدد الجلسات</th>
                <th className="py-3.5 px-6">إجمالي إيرادات الجلسات (Total Revenue)</th>
                <th className="py-3.5 px-6">المستحق للأخصائي (Staff Due)</th>
                <th className="py-3.5 px-6">صافي ربح المركز (Net Profit)</th>
                <th className="py-3.5 px-6 text-left">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 text-emerald-700 animate-spin" />
                    <p className="font-medium text-stone-600">جاري احتساب عمولات وتقارير المتخصصين...</p>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <UserCheck className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                    <p className="font-medium text-stone-600">لا توجد بيانات مسجلة في هذه الفترة</p>
                    <p className="text-xs mt-1">تأكد من اختيار نطاق زمني يحتوي على جلسات مكتملة وفواتير مسددة.</p>
                  </td>
                </tr>
              ) : (
                paginatedReports.map((st) => {
                  const isPercentage = st.commissionType === 'نسبة' || st.commissionType.includes('%');
                  return (
                    <tr key={st.id} className="hover:bg-stone-50/50 transition-colors">
                      {/* اسم الأخصائي */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-stone-800">{st.name}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{st.specialty}</div>
                      </td>

                      {/* نوع التعاقد */}
                      <td className="py-4 px-6">
                        {isPercentage ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                            <Percent className="w-3 h-3 text-emerald-600" />
                            <span>نسبة مئوية ({st.commissionValue}%)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            <span>إيجار ثابت ({st.commissionValue} ج.م)</span>
                          </div>
                        )}
                      </td>

                      {/* عدد الجلسات */}
                      <td className="py-4 px-6">
                        <span className="font-bold text-stone-700">{st.sessionsCount}</span>
                        <span className="text-xs text-stone-400 mr-1">جلسة</span>
                      </td>

                      {/* إجمالي إيرادات الجلسات */}
                      <td className="py-4 px-6 font-bold text-stone-800">
                        {st.totalRevenue.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-stone-500">ج.م</span>
                      </td>

                      {/* المستحق للأخصائي */}
                      <td className="py-4 px-6 font-extrabold text-amber-700">
                        <div>
                          {st.staffDue.toLocaleString()}{' '}
                          <span className="text-xs font-normal text-stone-500">ج.م</span>
                        </div>
                        {!isPercentage ? (
                          <span className="text-[10px] text-stone-400 font-normal block mt-0.5">
                            (100% من دخل الجلسات)
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-normal block mt-0.5">
                            (نسبة {st.commissionValue}% من الجلسات)
                          </span>
                        )}
                      </td>

                      {/* صافي ربح المركز */}
                      <td className="py-4 px-6 font-extrabold text-emerald-800">
                        <div>
                          {st.centerProfit.toLocaleString()}{' '}
                          <span className="text-xs font-normal text-stone-500">ج.م</span>
                        </div>
                        {!isPercentage ? (
                          <span className="text-[10px] text-blue-600 font-normal block mt-0.5">
                            (قيمة الإيجار الثابت بالكامل)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-normal block mt-0.5">
                            (حصة المركز: {100 - (st.commissionValue || 0)}%)
                          </span>
                        )}
                      </td>

                      {/* زر عرض التفاصيل */}
                      <td className="py-4 px-6 text-left">
                        <button
                          onClick={() => setSelectedStaffForDetails(st)}
                          disabled={st.sessionsCount === 0}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="عرض قائمة الجلسات والفواتير التفصيلية"
                        >
                          <Eye className="w-3.5 h-3.5 text-stone-500" />
                          <span>عرض الفواتير</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredReports.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          itemLabel="تقرير أخصائي"
        />
      </div>

      {/* MODAL: تفاصيل جلسات وفواتير الأخصائي المحددة */}
      {selectedStaffForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0f3b2c]/25 backdrop-blur-md">
          <div 
            className="w-full max-w-3xl bg-gradient-to-b from-[#fdfbf7] via-[#fcfaf5] to-[#f7f4ed] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl shadow-[0_25px_70px_-15px_rgba(15,59,44,0.22)] border border-stone-200/90 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between bg-white/60 dark:bg-stone-900/60 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0f3b2c]/10 dark:bg-emerald-500/10 flex items-center justify-center border border-[#0f3b2c]/15 text-[#0f3b2c] dark:text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5 text-[#0f3b2c] dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 dark:text-stone-100 text-sm">
                    كشف حساب الجلسات: {selectedStaffForDetails.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    التخصص: {selectedStaffForDetails.specialty} • نوع التعاقد:{' '}
                    {selectedStaffForDetails.commissionType === 'نسبة'
                      ? `نسبة مئوية (${selectedStaffForDetails.commissionValue}%)`
                      : `إيجار ثابت (${selectedStaffForDetails.commissionValue} ج.م - الطبيب يستحق 100% من الجلسات والمركز يستحق قيمة الإيجار)`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaffForDetails(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar in Modal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-white/40 dark:bg-stone-900/40 border-b border-stone-200/70 dark:border-stone-800 text-center">
              <div className="bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-2xl border border-stone-200/70 dark:border-stone-700 shadow-xs">
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">إجمالي الإيراد الكلي</span>
                <strong className="text-sm font-extrabold text-stone-900 dark:text-stone-100">{selectedStaffForDetails.totalRevenue} ج.م</strong>
              </div>
              <div className="bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-2xl border border-stone-200/70 dark:border-stone-700 shadow-xs">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-medium">الأساسي الخاضع للعمولة</span>
                <strong className="text-sm font-extrabold text-blue-800 dark:text-blue-300">{selectedStaffForDetails.commissionableBase ?? selectedStaffForDetails.totalRevenue} ج.م</strong>
              </div>
              <div className="bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-2xl border border-stone-200/70 dark:border-stone-700 shadow-xs">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-medium">
                  {selectedStaffForDetails.commissionType === 'نسبة' ? 'المستحق للأخصائي' : 'المستحق للأخصائي (100% الجلسات)'}
                </span>
                <strong className="text-sm font-extrabold text-amber-800 dark:text-amber-300">{selectedStaffForDetails.staffDue} ج.م</strong>
              </div>
              <div className="bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-2xl border border-stone-200/70 dark:border-stone-700 shadow-xs">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium">
                  {selectedStaffForDetails.commissionType === 'نسبة' ? 'صافي ربح المركز' : 'صافي ربح المركز (الإيجار الثابت)'}
                </span>
                <strong className="text-sm font-extrabold text-[#0f3b2c] dark:text-emerald-400">{selectedStaffForDetails.centerProfit} ج.م</strong>
              </div>
            </div>

            {/* Invoices List */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  قائمة الفواتير المكتملة المسددة ({selectedStaffForDetails.appointments.length} جلسة):
                </span>
                <span className="text-[11px] text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 font-medium">
                  * تُحسب العمولة على سعر الجلسة الأساسي فقط
                </span>
              </div>

              {selectedStaffForDetails.appointments.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs">
                  لا توجد فواتير مكتملة في هذه الفترة.
                </div>
              ) : (
                <div className="rounded-2xl border border-stone-200/80 dark:border-stone-700/80 overflow-hidden text-xs bg-white/70 dark:bg-stone-900/60 shadow-xs">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-stone-100/60 dark:bg-stone-800/60 border-b border-stone-200/70 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-[11px]">
                        <th className="py-2.5 px-3">رقم الفاتورة</th>
                        <th className="py-2.5 px-3">التاريخ</th>
                        <th className="py-2.5 px-3">العميل</th>
                        <th className="py-2.5 px-3">الخدمة</th>
                        <th className="py-2.5 px-3">سعر الجلسة (الأساسي)</th>
                        <th className="py-2.5 px-3">مستهلكات</th>
                        <th className="py-2.5 px-3">الخصم الممنوح</th>
                        <th className="py-2.5 px-3">الصافي المحصل</th>
                        <th className="py-2.5 px-3">عمولة الطبيب (محفوظة)</th>
                        <th className="py-2.5 px-3">طريقة الدفع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {selectedStaffForDetails.appointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-stone-800 dark:text-stone-200">{apt.invoiceNumber}</td>
                          <td className="py-2.5 px-3 text-stone-500 dark:text-stone-400">{apt.date}</td>
                          <td className="py-2.5 px-3 font-medium text-stone-800 dark:text-stone-200">{apt.clientName}</td>
                          <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">{apt.serviceName}</td>
                          <td className="py-2.5 px-3 font-bold text-stone-700 dark:text-stone-300">{apt.basePrice ?? apt.finalPrice} ج.م</td>
                          <td className="py-2.5 px-3 text-stone-500">{apt.consumablesPrice ? `+${apt.consumablesPrice} ج.م` : '—'}</td>
                          <td className="py-2.5 px-3 font-semibold text-rose-600">
                            {apt.discountApplied ? `-${apt.discountApplied} ج.م` : '0 ج.م'}
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-stone-900 dark:text-stone-100">{apt.invoiceTotal} ج.م</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-800 dark:text-emerald-400">
                            {apt.doctorCommission != null ? `${apt.doctorCommission} ج.م` : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px] font-medium">
                              {apt.paymentMethod}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-end bg-white/40 dark:bg-stone-900/40 backdrop-blur-xs">
              <button
                onClick={() => setSelectedStaffForDetails(null)}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] shadow-md shadow-emerald-950/10 transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
