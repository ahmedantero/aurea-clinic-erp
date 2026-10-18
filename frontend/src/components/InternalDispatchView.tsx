import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Calendar,
  Receipt,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  TrendingDown,
  DollarSign,
  PackageMinus,
  Sparkles,
} from 'lucide-react';
import { InventoryItemType, InternalDispatchItem } from '../types';

interface InternalDispatchViewProps {
  inventoryItems: InventoryItemType[];
  onRefreshInventory: () => void;
}

export const InternalDispatchView: React.FC<InternalDispatchViewProps> = ({
  inventoryItems,
  onRefreshInventory,
}) => {
  const [dispatches, setDispatches] = useState<InternalDispatchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fetch dispatches history
  const fetchDispatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inventory/dispatches', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDispatches(data);
      }
    } catch (err) {
      console.error('Error fetching internal dispatches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  // Currently selected product
  const selectedProduct = useMemo(() => {
    return inventoryItems.find((p) => p.id === selectedProductId) || null;
  }, [inventoryItems, selectedProductId]);

  const parsedQty = parseFloat(quantity) || 0;
  const estimatedCost = useMemo(() => {
    if (!selectedProduct || parsedQty <= 0) return 0;
    return (selectedProduct.unitCost || 0) * parsedQty;
  }, [selectedProduct, parsedQty]);

  // Handle Submit
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedProductId) {
      setErrorMsg('يرجى اختيار المنتج المراد صرفه');
      return;
    }
    if (parsedQty <= 0) {
      setErrorMsg('الكمية يجب أن تكون أكبر من صفر');
      return;
    }

    if (selectedProduct && parsedQty > selectedProduct.quantityInStock) {
      const confirmExceed = window.confirm(
        `تنبيه: الكمية المطلوبة (${parsedQty}) أكبر من الرصيد المتوفر (${selectedProduct.quantityInStock}). هل ترغب في الاستمرار؟`
      );
      if (!confirmExceed) return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          quantity: parsedQty,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'فشل تسجيل إذن الصرف');
      }

      const result = await res.json();
      setSuccessMsg(
        `تم صرف ${parsedQty} ${selectedProduct?.unitType || 'قطعة'} من "${selectedProduct?.name}" بنجاح وتسجيل مصروف بقيمة ${result.dispatch.totalCost} ج.م`
      );

      // Reset form
      setSelectedProductId('');
      setQuantity('1');
      setNotes('');

      // Refresh both dispatches table and inventory state
      fetchDispatches();
      onRefreshInventory();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء صرف المستهلكات');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalCostAll = useMemo(() => {
    return dispatches.reduce((acc, d) => acc + (d.totalCost || 0), 0);
  }, [dispatches]);

  const filteredDispatches = useMemo(() => {
    if (!searchTerm.trim()) return dispatches;
    const term = searchTerm.toLowerCase();
    return dispatches.filter(
      (d) =>
        d.productName.toLowerCase().includes(term) ||
        (d.notes && d.notes.toLowerCase().includes(term))
    );
  }, [dispatches, searchTerm]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <PackageMinus className="w-6 h-6 text-emerald-700" />
            <span>أذونات صرف المستهلكات (الاستهلاك الداخلي)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            صرف المواد والمستهلكات لتشغيل العيادة وخصمها فوراً من المخزون مع قيد تكلفتها تلقائياً كمصروف تشغيلي
          </p>
        </div>

        <button
          onClick={() => {
            fetchDispatches();
            onRefreshInventory();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* ── Metric Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">عدد أذونات الصرف</p>
            <p className="text-2xl font-bold text-stone-900">{dispatches.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">إجمالي تكلفة المستهلكات المنصرفة</p>
            <p className="text-2xl font-bold text-stone-900">
              {totalCostAll.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-emerald-800 font-bold">ربط مالي ومخزني تلقائي</p>
            <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
              يتم قيد التكلفة تلقائياً تحت بند "مستهلكات تشغيل العيادة" في المصروفات
            </p>
          </div>
        </div>
      </div>

      {/* ── New Dispatch Form Card ───────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-emerald-700" />
          <span>تسجيل إذن صرف مستهلكات جديد</span>
        </h3>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleDispatchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Select Product */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                المنتج / المستهلك *
              </label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600"
              >
                <option value="">-- اختر الصنف من المخزن --</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (الرصيد: {item.quantityInStock} {item.unitType} | تكلفة الوحدة: {item.unitCost} ج.م)
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                الكمية المنصرفة *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600"
                  placeholder="1"
                />
                <span className="text-xs text-stone-500 font-semibold shrink-0">
                  {selectedProduct?.unitType || 'قطعة'}
                </span>
              </div>
            </div>

            {/* Live Cost Calculation Card */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                التكلفة التشغيلية التقديرية
              </label>
              <div className="px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  {selectedProduct ? `${selectedProduct.unitCost} × ${parsedQty}` : '0 ج.م'}
                </span>
                <span className="text-sm font-bold text-emerald-800">
                  {estimatedCost.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              ملاحظات الصرف (القسم / سبب الاستهلاك)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: استهلاك غيار جلسات علاج طبيعي يوم الثلاثاء - عيادة 2"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !selectedProductId}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>جاري الصرف والترحيل المالي...</span>
                </>
              ) : (
                <>
                  <PackageMinus className="w-4 h-4" />
                  <span>تأكيد إذن الصرف وخصم المخزون</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Dispatches History Table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-700" />
            <span>سجل أذونات الصرف السابقة</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في أذونات الصرف..."
              className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-hidden focus:bg-white focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200/80 text-stone-600 font-bold">
                <th className="py-3 px-4">التاريخ والوقت</th>
                <th className="py-3 px-4">اسم المستهلك / الصنف</th>
                <th className="py-3 px-4">الكمية المنصرفة</th>
                <th className="py-3 px-4">تكلفة الوحدة</th>
                <th className="py-3 px-4">إجمالي التكلفة</th>
                <th className="py-3 px-4">ملاحظات الصرف</th>
                <th className="py-3 px-4 text-center">الأثر المالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري تحميل سجل الأذونات...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400">
                    لا توجد أذونات صرف مسجلة حالياً
                  </td>
                </tr>
              ) : (
                filteredDispatches.map((d) => {
                  const dDate = new Date(d.date);
                  const formattedDate = !isNaN(dDate.getTime())
                    ? dDate.toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : d.date;

                  return (
                    <tr key={d.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-800">
                        {d.productName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-700">
                        {d.quantity} {d.unitType || 'قطعة'}
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {d.unitCost} ج.م
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-800 whitespace-nowrap">
                        {d.totalCost.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3 px-4 text-stone-600 max-w-xs truncate">
                        {d.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Receipt className="w-3 h-3" />
                          <span>مصروف تشغيل مسجل</span>
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
    </div>
  );
};
