import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  RotateCcw, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  FileText,
  Sparkles,
  Lock,
  Layers,
  Wallet
} from 'lucide-react';
import { RevenueItem } from '../types';

interface RevenuesViewProps {
  revenues?: RevenueItem[];
  onRefreshRevenues: () => void;
  onAddRevenue: (newRevenue: RevenueItem) => void;
  onDeleteRevenue: (id: string) => void;
}

const COMMON_REVENUE_CATEGORIES = [
  'حجوزات وباقات',
  'مبيعات منتجات ومستحضرات',
  'استشارات طبية',
  'دورات وورش تدريبية',
  'إيرادات تأجير عيادات',
  'عروض ورعايات خاصة',
  'أخرى',
];

export const RevenuesView: React.FC<RevenuesViewProps> = ({
  revenues = [],
  onRefreshRevenues,
  onAddRevenue,
  onDeleteRevenue,
}) => {
  const safeRevenues = useMemo(() => (Array.isArray(revenues) ? revenues : []), [revenues]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('الكل');
  const [sourceFilter, setSourceFilter] = useState<'الكل' | 'APPOINTMENT' | 'MANUAL'>('الكل');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modal State for Manual Entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState(COMMON_REVENUE_CATEGORIES[1]); // default to sales/consultations for manual
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory(COMMON_REVENUE_CATEGORIES[1]);
    setFormCustomCategory('');
    setFormAmount('');
    setFormDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Manual Revenue
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    const finalCategory = formCategory === 'أخرى' && formCustomCategory.trim()
      ? formCustomCategory.trim()
      : formCategory;

    if (!finalCategory) {
      setFormError('يرجى تحديد تصنيف الإيراد');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      date: formDate,
      category: finalCategory,
      amount: parsedAmount,
      description: formDescription.trim() || null,
    };

    try {
      const res = await fetch('/api/revenues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل إضافة الإيراد');
      }

      const created = await res.json();
      onAddRevenue(created);
      setIsModalOpen(false);
    } catch (err: any) {
      console.warn('API error during revenue save:', err);
      setFormError(err.message || 'حدث خطأ أثناء حفظ الإيراد');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Revenue (Only Manual allowed)
  const handleDeleteRevenue = async (item: RevenueItem) => {
    if (item.source === 'APPOINTMENT') {
      alert('لا يمكن حذف إيراد تم توليده تلقائياً من حجز موعد. لإلغاء هذا الإيراد، قم بإلغاء الحجز نفسه من جدول الحجوزات.');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف إيراد "${item.category}" بمبلغ ${item.amount} ج.م؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/revenues/${item.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'فشل حذف الإيراد');
        return;
      }

      onDeleteRevenue(item.id);
    } catch (err: any) {
      console.warn('Error deleting revenue:', err);
      alert('تعذر حذف الإيراد، يرجى المحاولة لاحقاً');
    }
  };

  // Filter Logic
  const filteredRevenues = useMemo(() => {
    return safeRevenues.filter((item) => {
      if (!item) return false;
      const term = (searchTerm || '').toLowerCase().trim();
      const matchesSearch = 
        !term ||
        (item.category && item.category.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.appointment?.clientName && item.appointment.clientName.toLowerCase().includes(term));

      const matchesCategory = 
        selectedCategoryFilter === 'الكل' || item.category === selectedCategoryFilter;

      const matchesSource = 
        sourceFilter === 'الكل' || item.source === sourceFilter;

      const matchesStartDate = 
        !startDateFilter || (item.date && item.date >= startDateFilter);

      const matchesEndDate = 
        !endDateFilter || (item.date && item.date <= endDateFilter);

      return matchesSearch && matchesCategory && matchesSource && matchesStartDate && matchesEndDate;
    });
  }, [safeRevenues, searchTerm, selectedCategoryFilter, sourceFilter, startDateFilter, endDateFilter]);

  // KPI Calculations
  const totalRevenuesAmount = useMemo(() => {
    return filteredRevenues.reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);
  }, [filteredRevenues]);

  const autoRevenuesAmount = useMemo(() => {
    return filteredRevenues
      .filter((r) => r?.source === 'APPOINTMENT')
      .reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);
  }, [filteredRevenues]);

  const manualRevenuesAmount = useMemo(() => {
    return filteredRevenues
      .filter((r) => r?.source === 'MANUAL')
      .reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);
  }, [filteredRevenues]);

  // Dynamic Categories from Data
  const dynamicCategories = useMemo(() => {
    return Array.from(new Set(safeRevenues.map((r) => r?.category).filter(Boolean)));
  }, [safeRevenues]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-700" />
            <span>سجل الإيرادات والمداخيل المالية</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            متابعة شاملة لجميع المداخيل المالية الناتجة تلقائياً عن الحجوزات والباقات بالإضافة إلى القيود اليدوية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshRevenues}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors shadow-2xs cursor-pointer"
            title="تحديث البيانات"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة إيراد يدوي</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenues */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 rounded-2xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">إجمالي الإيرادات المسجلة</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950 font-mono">
              {totalRevenuesAmount.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-700">ج.م</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">
            شامل القيود التلقائية للحجوزات والإيرادات اليدوية
          </p>
        </div>

        {/* Automated Appointments Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs relative overflow-hidden bg-purple-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">إيرادات الحجوزات والباقات</span>
            <div className="w-9 h-9 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-700">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-950 font-mono">
              {autoRevenuesAmount.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-purple-700">ج.م</span>
          </div>
          <p className="text-[11px] text-purple-600/80 mt-1 font-medium">
            {filteredRevenues.filter(r => r.source === 'APPOINTMENT').length} حجز مؤكد ومفوتر تلقائياً
          </p>
        </div>

        {/* Manual Revenues */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">الإيرادات اليدوية والمبيعات</span>
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-800 font-mono">
              {manualRevenuesAmount.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-stone-500">ج.م</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1 font-medium">
            {filteredRevenues.filter(r => r.source === 'MANUAL').length} قيد يدوي مسجل
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="بحث في البيان أو اسم العميل أو التصنيف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-stone-50/70 border border-stone-200 focus:bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 placeholder-stone-400 transition-colors"
            />
          </div>

          {/* Source Filter (All / Auto / Manual) */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSourceFilter('الكل')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sourceFilter === 'الكل'
                  ? 'bg-white text-stone-800 shadow-2xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSourceFilter('APPOINTMENT')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                sourceFilter === 'APPOINTMENT'
                  ? 'bg-white text-purple-800 shadow-2xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>حجوزات وباقات</span>
            </button>
            <button
              onClick={() => setSourceFilter('MANUAL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                sourceFilter === 'MANUAL'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>إيراد يدوي</span>
            </button>
          </div>

          {/* Date Range Pickers */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <span>من:</span>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 text-xs focus:bg-white focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <span>إلى:</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 text-xs focus:bg-white focus:outline-hidden"
              />
            </div>
            {(startDateFilter || endDateFilter) && (
              <button
                onClick={() => {
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 cursor-pointer"
              >
                إلغاء التصفية
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-stone-100 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter('الكل')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryFilter === 'الكل'
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            جميع التصنيفات ({safeRevenues.length})
          </button>
          {Array.from(new Set([...COMMON_REVENUE_CATEGORIES.slice(0, 5), ...dynamicCategories])).map((cat) => {
            const count = safeRevenues.filter((r) => r?.category === cat).length;
            if (count === 0 && !COMMON_REVENUE_CATEGORIES.slice(0, 3).includes(cat)) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? 'bg-emerald-700 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Revenues Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-stone-50/70 border-b border-stone-200/80 text-xs font-semibold text-stone-600">
                <th className="py-3.5 px-6">التاريخ (Date)</th>
                <th className="py-3.5 px-6">التصنيف (Category)</th>
                <th className="py-3.5 px-6">البيان والتفاصيل (Description)</th>
                <th className="py-3.5 px-6">المبلغ (Amount)</th>
                <th className="py-3.5 px-6">المصدر (Source)</th>
                <th className="py-3.5 px-6 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredRevenues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <TrendingUp className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                    <p className="font-medium text-stone-600">لا توجد إيرادات مسجلة</p>
                    <p className="text-xs mt-1">
                      يتم تسجيل الإيرادات تلقائياً عند حجز المواعيد والباقات أو يدوياً عبر زر "إضافة إيراد يدوي".
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRevenues.map((item) => {
                  const isAuto = item.source === 'APPOINTMENT';
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                      {/* Date */}
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs text-stone-700 flex items-center gap-1.5" dir="ltr">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {item.date || '—'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200/60">
                          <Tag className="w-3 h-3 text-stone-400" />
                          {item.category}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-4 px-6">
                        <span className="text-stone-800 font-medium block">
                          {item.description || <span className="text-stone-400 text-xs italic">بدون بيان</span>}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6 font-bold text-emerald-700">
                        <span className="text-base font-extrabold">{(Number(item?.amount) || 0).toLocaleString()}</span>{' '}
                        <span className="text-xs font-normal text-stone-500">ج.م</span>
                      </td>

                      {/* Source Badge */}
                      <td className="py-4 px-6">
                        {isAuto ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            <span>حجز تلقائي</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            <Wallet className="w-3 h-3 text-emerald-600" />
                            <span>قيد يدوي</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAuto ? (
                            <span 
                              className="p-1.5 rounded-lg bg-stone-100 text-stone-400 cursor-not-allowed inline-flex items-center" 
                              title="إيراد مرتبط بحجز موعد — يتم تعديله أو إلغاؤه من خلال إدارة الحجز"
                            >
                              <Lock className="w-4 h-4 text-stone-400" />
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteRevenue(item)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="حذف الإيراد اليدوي"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Revenue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div 
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-800">إضافة إيراد يدوي جديد</h3>
                  <p className="text-[11px] text-stone-400">تسجيل مدخول مالي غير مرتبط بحجز موعد</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-right">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  المبلغ (ج.م) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 font-mono font-bold"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  تاريخ الإيراد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  تصنيف الإيراد <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800"
                >
                  {COMMON_REVENUE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Category if 'أخرى' */}
              {formCategory === 'أخرى' && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    اكتب اسم التصنيف المخصص <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثل: بيع أدوات، دورة تدريبية..."
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  البيان والتفاصيل (Description)
                </label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات تفصيلية أو رقم إيصال يدوي..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الإيراد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
