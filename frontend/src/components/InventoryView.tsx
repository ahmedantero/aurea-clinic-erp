import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  ArrowUpRight, 
  Layers, 
  Boxes, 
  DollarSign,
  TrendingDown,
  Trash2,
  Edit3,
  X,
  Check
} from 'lucide-react';
import { InventoryItemType } from '../types';

interface InventoryViewProps {
  inventoryItems: InventoryItemType[];
  onRefreshInventory: () => void;
  onAddItem: (item: InventoryItemType) => void;
  onUpdateStock: (id: string, newStock: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventoryItems,
  onRefreshInventory,
  onAddItem,
  onUpdateStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');

  // Modal states
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItemType | null>(null);

  // Form states for New Item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemStock, setNewItemStock] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('قطعة');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stock Adjustment Form
  const [quantityToAdd, setQuantityToAdd] = useState<string>('10');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Metrics
  const totalItemsCount = inventoryItems.length;
  const lowStockItems = inventoryItems.filter((i) => i.quantityInStock < 10);
  const inStockItems = inventoryItems.filter((i) => i.quantityInStock >= 10);
  const totalValuation = inventoryItems.reduce(
    (sum, i) => sum + i.quantityInStock * i.unitCost,
    0
  );

  // Filtered Items
  const filtered = inventoryItems.filter((item) => {
    const matchesSearch = item.name.includes(searchTerm);
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'low_stock'
        ? item.quantityInStock < 10
        : item.quantityInStock >= 10;

    return matchesSearch && matchesStatus;
  });

  // Handle Add New Item Submit
  const handleCreateItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCost || !newItemStock) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName.trim(),
          unitCost: parseFloat(newItemCost),
          quantityInStock: parseFloat(newItemStock),
          unitType: newItemUnit,
        }),
      });

      if (!response.ok) throw new Error('فشل إضافة المنتج');

      const created = await response.json();
      onAddItem(created);
      setIsNewItemModalOpen(false);

      // Reset
      setNewItemName('');
      setNewItemCost('');
      setNewItemStock('');
    } catch (err: any) {
      console.warn('API error, saving locally:', err);
      const fallback: InventoryItemType = {
        id: `inv-${Date.now().toString().slice(-4)}`,
        name: newItemName.trim(),
        unitCost: parseFloat(newItemCost),
        quantityInStock: parseFloat(newItemStock),
        unitType: newItemUnit,
      };
      onAddItem(fallback);
      setIsNewItemModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Stock Adjustment Submit
  const handleUpdateStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const addAmount = parseFloat(quantityToAdd) || 0;
    if (addAmount === 0) return;

    const newQuantity = Math.max(0, adjustingItem.quantityInStock + addAmount);

    setIsUpdatingStock(true);
    try {
      const response = await fetch(`/api/inventory/${adjustingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantityInStock: newQuantity,
        }),
      });

      if (!response.ok) throw new Error('فشل تحديث الرصيد');

      onUpdateStock(adjustingItem.id, newQuantity);
      setAdjustingItem(null);
      setQuantityToAdd('10');
    } catch (err: any) {
      console.warn('API error, updating locally:', err);
      onUpdateStock(adjustingItem.id, newQuantity);
      setAdjustingItem(null);
      setQuantityToAdd('10');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">إدارة المخزون والمبيعات</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            متابعة أرصدة منتجات السبا، ماسكات العناية، وتوريدات الجلسات ومبيعات الفواتير
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshInventory}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="تحديث البيانات من قاعدة البيانات"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsNewItemModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج جديد
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">إجمالي الأصناف</p>
            <h3 className="text-2xl font-bold text-stone-800 mt-1">{totalItemsCount}</h3>
            <p className="text-xs text-stone-400 mt-0.5">منتجات مسجلة بالمخزن</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">أصناف متوفرة</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{inStockItems.length}</h3>
            <p className="text-xs text-stone-400 mt-0.5">رصيد كافٍ للجلسات</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">قاربت على النفاذ</p>
            <h3 className={`text-2xl font-bold mt-1 ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-stone-700'}`}>
              {lowStockItems.length}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">أقل من 10 قطع</p>
          </div>
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
            lowStockItems.length > 0 
              ? 'bg-rose-50 border-rose-100 text-rose-600'
              : 'bg-stone-50 border-stone-100 text-stone-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">القيمة التقديرية للمخزون</p>
            <h3 className="text-2xl font-bold text-stone-800 mt-1">
              {totalValuation.toLocaleString()} <span className="text-xs font-normal text-stone-500">ج.م</span>
            </h3>
            <p className="text-xs text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> إجمالي قيمة البضاعة
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم المنتج في المخزن..."
            className="w-full pr-10 pl-4 py-2 text-sm rounded-xl border border-stone-200/80 bg-stone-50/50 focus:bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 placeholder-stone-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60'
            }`}
          >
            الكل ({inventoryItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('in_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'in_stock'
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60'
            }`}
          >
            متوفر ({inStockItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('low_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'low_stock'
                ? 'bg-rose-700 text-white'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60'
            }`}
          >
            قارب على النفاذ ({lowStockItems.length})
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-stone-50/70 border-b border-stone-200/80 text-xs font-semibold text-stone-600">
                <th className="py-3.5 px-6">اسم المنتج (Item Name)</th>
                <th className="py-3.5 px-6">سعر البيع (Selling Price)</th>
                <th className="py-3.5 px-6">الرصيد المتاح (Stock Quantity)</th>
                <th className="py-3.5 px-6">حالة المخزون (Status)</th>
                <th className="py-3.5 px-6 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                    <p className="font-medium text-stone-600">لا توجد منتجات مسجلة بالمخزن</p>
                    <p className="text-xs mt-1">اضغط على زر "إضافة منتج جديد" لإدخال الأصناف.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLowStock = item.quantityInStock < 10;
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                      {/* اسم المنتج */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-stone-800">{item.name}</div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          وحدة الصرف: {item.unitType || 'قطعة'}
                        </div>
                      </td>

                      {/* سعر البيع */}
                      <td className="py-4 px-6 font-bold text-stone-800">
                        {item.unitCost} <span className="text-xs font-normal text-stone-500">ج.م</span>
                      </td>

                      {/* الرصيد المتاح */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-extrabold ${isLowStock ? 'text-rose-600' : 'text-stone-800'}`}>
                            {item.quantityInStock}
                          </span>
                          <span className="text-xs text-stone-400">{item.unitType || 'قطعة'}</span>
                        </div>
                      </td>

                      {/* حالة المخزون (متوفر vs قارب على النفاذ) */}
                      <td className="py-4 px-6">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            قارب على النفاذ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            متوفر
                          </span>
                        )}
                      </td>

                      {/* إجراءات: زر تحديث الرصيد */}
                      <td className="py-4 px-6 text-left">
                        <button
                          onClick={() => setAdjustingItem(item)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="تعديل أو زيادة كمية المنتج"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                          <span>تحديث الرصيد</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: إضافة منتج جديد */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div 
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-800 text-base">إضافة منتج جديد للمخزن</h3>
              </div>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItemSubmit} className="p-6 space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  اسم المنتج
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: زيت مساج لافندر، كريم ترطيب..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    سعر البيع (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    placeholder="مثال: 120"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    الرصيد الأولي
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="مثال: 50"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  وحدة القياس / العبوة
                </label>
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="قطعة">قطعة</option>
                  <option value="عبوة">عبوة</option>
                  <option value="زجاجة">زجاجة</option>
                  <option value="لتر">لتر</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ المنتج في المخزن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: تحديث الرصيد */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div 
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div>
                <h3 className="font-bold text-stone-800 text-sm">تحديث رصيد المخزن</h3>
                <p className="text-xs text-stone-400 mt-0.5">{adjustingItem.name}</p>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStockSubmit} className="p-6 space-y-4 text-right">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
                <span className="text-stone-500">الرصيد الحالي بالمخزن:</span>
                <span className="text-base font-extrabold text-stone-800">
                  {adjustingItem.quantityInStock} {adjustingItem.unitType || 'قطعة'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  الكمية المضافة للتوريد (+):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    required
                    value={quantityToAdd}
                    onChange={(e) => setQuantityToAdd(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 font-bold"
                  />
                  <span className="text-xs text-stone-500 whitespace-nowrap">
                    {adjustingItem.unitType || 'قطعة'}
                  </span>
                </div>
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-stone-400 ml-1">زيادة سريعة:</span>
                {['+5', '+10', '+20', '+50'].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => setQuantityToAdd((parseInt(btn.replace('+', ''))).toString())}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
                  >
                    {btn}
                  </button>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStock}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingStock ? 'جاري التحديث...' : 'تأكيد وحفظ الرصيد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
