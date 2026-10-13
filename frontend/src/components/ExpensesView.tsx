import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  TrendingDown, 
  PieChart, 
  Tag, 
  FileText 
} from 'lucide-react';
import { ExpenseItem } from '../types';

interface ExpensesViewProps {
  expenses: ExpenseItem[];
  onRefreshExpenses: () => void;
  onAddExpense: (newExpense: ExpenseItem) => void;
  onUpdateExpense: (updatedExpense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
}

const COMMON_CATEGORIES = [
  'إيجار',
  'كهرباء ومرافق',
  'رواتب ومكافآت',
  'مستلزمات',
  'صيانة',
  'نثريات وضيافة',
  'تسويق وإعلانات',
  'أخرى',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onRefreshExpenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('الكل');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState(COMMON_CATEGORIES[0]);
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingExpenseId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory(COMMON_CATEGORIES[0]);
    setFormCustomCategory('');
    setFormAmount('');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: ExpenseItem) => {
    setEditingExpenseId(item.id);
    setFormDate(item.expenseDate);
    if (COMMON_CATEGORIES.includes(item.expenseType)) {
      setFormCategory(item.expenseType);
      setFormCustomCategory('');
    } else {
      setFormCategory('أخرى');
      setFormCustomCategory(item.expenseType);
    }
    setFormAmount(item.amount.toString());
    setFormNotes(item.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Add / Edit
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
      setFormError('يرجى تحديد بند المصروف');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      expenseDate: formDate,
      expenseType: finalCategory,
      amount: parsedAmount,
      notes: formNotes.trim() || null,
    };

    try {
      if (editingExpenseId) {
        // UPDATE
        const res = await fetch(`/api/expenses/${editingExpenseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل تحديث بيانات المصروف');
        }

        const updated = await res.json();
        onUpdateExpense(updated);
      } else {
        // CREATE
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل إضافة المصروف');
        }

        const created = await res.json();
        onAddExpense(created);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.warn('API error during expense save:', err);
      setFormError(err.message || 'حدث خطأ أثناء حفظ المصروف');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (item: ExpenseItem) => {
    if (!confirm(`هل أنت متأكد من حذف مصروف "${item.expenseType}" بمبلغ ${item.amount} ج.م؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${item.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'فشل حذف المصروف');
        return;
      }

      onDeleteExpense(item.id);
    } catch (err: any) {
      console.warn('Error deleting expense:', err);
      alert('تعذر حذف المصروف، يرجى المحاولة لاحقاً');
    }
  };

  // Filter Logic
  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch = 
      item.expenseType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = 
      selectedCategoryFilter === 'الكل' || item.expenseType === selectedCategoryFilter;

    const matchesStartDate = 
      !startDateFilter || item.expenseDate >= startDateFilter;

    const matchesEndDate = 
      !endDateFilter || item.expenseDate <= endDateFilter;

    return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
  });

  // KPI Calculations
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalEntriesCount = filteredExpenses.length;
  const avgExpense = totalEntriesCount > 0 ? Math.round(totalExpensesAmount / totalEntriesCount) : 0;

  // Find top spending category
  const categoryTotals: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    categoryTotals[e.expenseType] = (categoryTotals[e.expenseType] || 0) + e.amount;
  });
  const topCategory = Object.keys(categoryTotals).reduce((max, cat) => {
    return (categoryTotals[cat] > (categoryTotals[max] || 0)) ? cat : max;
  }, Object.keys(categoryTotals)[0] || 'لا يوجد');

  // Categories present in data
  const dynamicCategories = Array.from(new Set(expenses.map((e) => e.expenseType)));

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">إدارة المصروفات والنفقات</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            تسجيل ومتابعة التكاليف التشغيلية، الإيجار، المرافق، والمستلزمات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshExpenses}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="تحديث البيانات من السيرفر"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مصروف جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">إجمالي المصروفات</p>
            <h3 className="text-2xl font-bold text-rose-700 mt-1">
              {totalExpensesAmount.toLocaleString()} <span className="text-xs font-normal text-stone-500">ج.م</span>
            </h3>
            <p className="text-xs text-rose-600 font-medium mt-0.5">النفقات للفترة المحددة</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">عدد بنود الصرف</p>
            <h3 className="text-2xl font-bold text-stone-800 mt-1">{totalEntriesCount}</h3>
            <p className="text-xs text-stone-400 mt-0.5">سجل دفع ومصروف</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">أعلى بند استهلاكاً</p>
            <h3 className="text-xl font-bold text-stone-800 mt-1 truncate max-w-[140px]">{topCategory}</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {categoryTotals[topCategory] ? `${categoryTotals[topCategory].toLocaleString()} ج.م` : 'لا يوجد'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <PieChart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">متوسط قيمة البند</p>
            <h3 className="text-2xl font-bold text-stone-800 mt-1">
              {avgExpense.toLocaleString()} <span className="text-xs font-normal text-stone-500">ج.م</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">متوسط المصروف الواحد</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search, Categories, and Date Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="بحث في البيان أو بند المصروف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-stone-50/70 border border-stone-200 focus:bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 placeholder-stone-400 transition-colors"
            />
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
            جميع البنود ({expenses.length})
          </button>
          {Array.from(new Set([...COMMON_CATEGORIES.slice(0, 6), ...dynamicCategories])).map((cat) => {
            const count = expenses.filter((e) => e.expenseType === cat).length;
            if (count === 0 && !COMMON_CATEGORIES.slice(0, 5).includes(cat)) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? 'bg-rose-700 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-stone-50/70 border-b border-stone-200/80 text-xs font-semibold text-stone-600">
                <th className="py-3.5 px-6">التاريخ (Date)</th>
                <th className="py-3.5 px-6">بند المصروف (Category)</th>
                <th className="py-3.5 px-6">البيان والتفاصيل (Description)</th>
                <th className="py-3.5 px-6">المبلغ (Amount)</th>
                <th className="py-3.5 px-6 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                    <p className="font-medium text-stone-600">لا توجد مصروفات مسجلة</p>
                    <p className="text-xs mt-1">اضغط على زر "تسجيل مصروف جديد" لإضافة نفقات المركز.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                    {/* Date */}
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-stone-700 flex items-center gap-1.5" dir="ltr">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {item.expenseDate}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200/60">
                        <Tag className="w-3 h-3 text-stone-400" />
                        {item.expenseType}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-6">
                      <span className="text-stone-800 font-medium block">
                        {item.notes || <span className="text-stone-400 text-xs italic">بدون بيان</span>}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 font-bold text-rose-700">
                      <span className="text-base font-extrabold">{item.amount.toLocaleString()}</span>{' '}
                      <span className="text-xs font-normal text-stone-500">ج.م</span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          title="تعديل المصروف"
                        >
                          <Edit3 className="w-4 h-4 text-stone-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(item)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="حذف المصروف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-base">
                    {editingExpenseId ? 'تعديل بيانات المصروف' : 'تسجيل مصروف جديد'}
                  </h3>
                  <p className="text-xs text-stone-400">إدراج التكاليف ضمن سجلات وحسابات المركز</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-right">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  تاريخ الصرف (Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-medium"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  بند المصروف (Category) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-medium"
                >
                  {COMMON_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Category if "أخرى" */}
              {formCategory === 'أخرى' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    حدد اسم البند المخصص <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رسوم تجديد رخصة، اشتراك إنترنت..."
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800"
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  المبلغ المنصرف (ج.م) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="any"
                  required
                  placeholder="مثال: 500"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-bold"
                />
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  البيان والتفاصيل (Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="اكتب تفاصيل أو سبب الصرف، رقم الفاتورة أو المستلم..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'جاري الحفظ...'
                    : editingExpenseId
                    ? 'حفظ التعديلات'
                    : 'تسجيل المصروف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
