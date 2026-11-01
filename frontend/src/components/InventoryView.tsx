import React, { useState, useEffect } from 'react';
import { Pagination } from './ui/Pagination';
import { usePagination } from '../hooks/usePagination';
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
import { useToast } from '../context/ToastContext';

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
  // Auto-refresh inventory on screen mount
  useEffect(() => {
    onRefreshInventory();
  }, []);

  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');

  // Excel-like Inline Editing State
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: 'unitCost' | 'sellingPrice' | 'quantityInStock';
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Modal states
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItemType | null>(null);

  // Form states for New Item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemSellingPrice, setNewItemSellingPrice] = useState('');
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

  // Luxury Pagination Controller
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData: paginatedInventory,
    resetPage,
  } = usePagination(filtered, { initialPageSize: 10 });

  useEffect(() => {
    resetPage();
  }, [searchTerm, statusFilter]);

  // Excel-like Inline Edit Actions
  const handleStartEdit = (id: string, field: 'unitCost' | 'sellingPrice' | 'quantityInStock', currentVal: number) => {
    setEditingCell({ id, field });
    setEditValue(currentVal.toString());
  };

  const handleInlineEditSave = async (id: string, field: 'unitCost' | 'sellingPrice' | 'quantityInStock') => {
    const num = parseFloat(editValue);
    if (isNaN(num) || num < 0) {
      error('يرجى إدخال رقم صحيح موجب');
      setEditingCell(null);
      return;
    }

    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: num }),
      });

      if (!res.ok) throw new Error('فشل تحديث البيانات في قاعدة البيانات');
      onRefreshInventory();
      success('تم الحفظ السريع بنجاح ⚡');
    } catch (err: any) {
      error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setEditingCell(null);
    }
  };

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
          sellingPrice: parseFloat(newItemSellingPrice) || 0,
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
      setNewItemSellingPrice('');
      setNewItemStock('');
    } catch (err: any) {
      console.warn('API error, saving locally:', err);
      const fallback: InventoryItemType = {
        id: `inv-${Date.now().toString().slice(-4)}`,
        name: newItemName.trim(),
        unitCost: parseFloat(newItemCost),
        sellingPrice: parseFloat(newItemSellingPrice) || 0,
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
            className="p-2.5 rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer shadow-2xs"
            title="تحديث البيانات من قاعدة البيانات"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsNewItemModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] font-bold text-sm shadow-md shadow-emerald-950/15 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white via-[#fcfaf6] to-[#f8f5ee] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 p-5 rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">إجمالي الأصناف</p>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white mt-1">{totalItemsCount}</h3>
            <p className="text-xs text-stone-400 mt-0.5">منتجات مسجلة بالمخزن</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0f3b2c]/10 text-[#0f3b2c] dark:bg-emerald-500/10 dark:text-emerald-400 border border-[#0f3b2c]/15 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-[#fcfaf6] to-[#f8f5ee] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 p-5 rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">أصناف متوفرة</p>
            <h3 className="text-2xl font-black text-[#0f3b2c] dark:text-emerald-400 mt-1">{inStockItems.length}</h3>
            <p className="text-xs text-stone-400 mt-0.5">رصيد كافٍ للجلسات</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#0f3b2c] dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-[#fcfaf6] to-[#f8f5ee] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 p-5 rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">قاربت على النفاذ</p>
            <h3 className={`text-2xl font-black mt-1 ${lowStockItems.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-700 dark:text-stone-200'}`}>
              {lowStockItems.length}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">أقل من 10 قطع</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
            lowStockItems.length > 0 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
              : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-[#fcfaf6] to-[#f8f5ee] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 p-5 rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">القيمة التقديرية للمخزون</p>
            <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
              {totalValuation.toLocaleString()} <span className="text-xs font-normal text-stone-500">ج.م</span>
            </h3>
            <p className="text-xs text-[#0f3b2c] dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> إجمالي قيمة البضاعة
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl p-3.5 rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم المنتج في المخزن..."
            className="w-full pr-10 pl-4 py-2.5 text-sm rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-[#0f3b2c] shadow-2xs placeholder-stone-400 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#0f3b2c] text-[#fbf8ee]'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200/70'
            }`}
          >
            الكل ({inventoryItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('in_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'in_stock'
                ? 'bg-[#0f3b2c] text-[#fbf8ee]'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200/70'
            }`}
          >
            متوفر ({inStockItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('low_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'low_stock'
                ? 'bg-rose-700 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200/70'
            }`}
          >
            قارب على النفاذ ({lowStockItems.length})
          </button>
        </div>
      </div>

      {/* Helper Banner for Excel-like Editing */}
      <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 px-4 py-2 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0f3b2c] text-[#fbf8ee] font-medium text-[11px] shadow-xs">
            ⚡ تعديل تفاعلي سريع (Excel-like)
          </span>
          <span>انقر نقراً مزدوجاً (Double Click) على <b>سعر التكلفة</b>، <b>سعر البيع</b>، أو <b>الرصيد</b> للتعديل الفوري ثم اضغط <b>Enter</b> للحفظ السريع في قاعدة البيانات.</span>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white/85 dark:bg-stone-900/85 backdrop-blur-xl rounded-3xl border border-stone-200/90 dark:border-white/10 shadow-[0_15px_40px_-12px_rgba(15,59,44,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="sticky top-0 z-10 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/90 dark:border-stone-800 shadow-2xs">
              <tr className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                <th className="py-3.5 px-6">اسم المنتج (Item Name)</th>
                <th className="py-3.5 px-6">سعر التكلفة (Cost)</th>
                <th className="py-3.5 px-6">سعر البيع (Selling)</th>
                <th className="py-3.5 px-6">الرصيد المتاح (Stock Quantity)</th>
                <th className="py-3.5 px-6">حالة المخزون (Status)</th>
                <th className="py-3.5 px-6 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                    <p className="font-medium text-stone-600 dark:text-stone-300">لا توجد منتجات مسجلة بالمخزن</p>
                    <p className="text-xs mt-1">اضغط على زر "إضافة منتج جديد" لإدخال الأصناف.</p>
                  </td>
                </tr>
              ) : (
                paginatedInventory.map((item) => {
                  const isLowStock = item.quantityInStock < 10;
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                      {/* اسم المنتج */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-stone-800 dark:text-stone-100">{item.name}</div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          وحدة الصرف: {item.unitType || 'قطعة'}
                        </div>
                      </td>

                      {/* سعر التكلفة */}
                      <td 
                        className="py-4 px-6 font-bold text-stone-700 dark:text-stone-300 cursor-pointer group"
                        onDoubleClick={() => handleStartEdit(item.id, 'unitCost', item.unitCost)}
                        title="انقر نقراً مزدوجاً للتعديل الفوري"
                      >
                        {editingCell?.id === item.id && editingCell?.field === 'unitCost' ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              step="any"
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineEditSave(item.id, 'unitCost');
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-20 px-2 py-1 text-xs border border-emerald-500 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none ring-2 ring-emerald-500/20"
                            />
                            <button
                              onClick={() => handleInlineEditSave(item.id, 'unitCost')}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              title="حفظ (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                              title="إلغاء (Esc)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span>{item.unitCost}</span>
                            <span className="text-xs font-normal text-stone-500">ج.م</span>
                            <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-60 text-stone-400 transition-opacity" />
                          </div>
                        )}
                      </td>

                      {/* سعر البيع للعميل */}
                      <td 
                        className="py-4 px-6 font-bold text-emerald-800 dark:text-emerald-400 cursor-pointer group"
                        onDoubleClick={() => handleStartEdit(item.id, 'sellingPrice', item.sellingPrice ?? 0)}
                        title="انقر نقراً مزدوجاً للتعديل الفوري"
                      >
                        {editingCell?.id === item.id && editingCell?.field === 'sellingPrice' ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              step="any"
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineEditSave(item.id, 'sellingPrice');
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-20 px-2 py-1 text-xs border border-emerald-500 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none ring-2 ring-emerald-500/20"
                            />
                            <button
                              onClick={() => handleInlineEditSave(item.id, 'sellingPrice')}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              title="حفظ (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                              title="إلغاء (Esc)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span>{item.sellingPrice ?? 0}</span>
                            <span className="text-xs font-normal text-stone-500">ج.م</span>
                            <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-60 text-emerald-600/70 transition-opacity" />
                          </div>
                        )}
                      </td>

                      {/* الرصيد المتاح */}
                      <td 
                        className="py-4 px-6 cursor-pointer group"
                        onDoubleClick={() => handleStartEdit(item.id, 'quantityInStock', item.quantityInStock)}
                        title="انقر نقراً مزدوجاً للتعديل الفوري"
                      >
                        {editingCell?.id === item.id && editingCell?.field === 'quantityInStock' ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              step="any"
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineEditSave(item.id, 'quantityInStock');
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-20 px-2 py-1 text-xs border border-emerald-500 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none ring-2 ring-emerald-500/20"
                            />
                            <button
                              onClick={() => handleInlineEditSave(item.id, 'quantityInStock')}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              title="حفظ (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                              title="إلغاء (Esc)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-extrabold ${isLowStock ? 'text-rose-600' : 'text-stone-800 dark:text-stone-100'}`}>
                              {item.quantityInStock}
                            </span>
                            <span className="text-xs text-stone-400">{item.unitType || 'قطعة'}</span>
                            <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-60 text-stone-400 transition-opacity" />
                          </div>
                        )}
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

        {/* Luxury Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          itemLabel="صنف"
        />
      </div>

      {/* MODAL 1: إضافة منتج جديد */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0f3b2c]/25 backdrop-blur-md">
          <div 
            className="w-full max-w-md bg-gradient-to-b from-[#fdfbf7] via-[#fcfaf5] to-[#f7f4ed] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl shadow-[0_25px_70px_-15px_rgba(15,59,44,0.22)] border border-stone-200/90 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="px-6 py-4.5 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between bg-white/60 dark:bg-stone-900/60 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/25 shadow-2xs">
                  <Package className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">إضافة منتج جديد للمخزن</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">تسجيل صنف أو مستهلك جديد في العيادة</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    سعر التكلفة (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    required
                    placeholder="مثال: 50"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    سعر البيع للعميل (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    placeholder="مثال: 80"
                    value={newItemSellingPrice}
                    onChange={(e) => setNewItemSellingPrice(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 font-bold text-emerald-800"
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

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-200/70 dark:border-stone-800">
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
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0f3b2c]/25 backdrop-blur-md">
          <div 
            className="w-full max-w-sm bg-gradient-to-b from-[#fdfbf7] via-[#fcfaf5] to-[#f7f4ed] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl shadow-[0_25px_70px_-15px_rgba(15,59,44,0.22)] border border-stone-200/90 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="px-6 py-4.5 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between bg-white/60 dark:bg-stone-900/60 backdrop-blur-md">
              <div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">تحديث رصيد المخزن</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{adjustingItem.name}</p>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStockSubmit} className="p-6 space-y-4 text-right">
              <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-stone-200/80 flex items-center justify-between text-xs">
                <span className="text-stone-500">الرصيد الحالي بالمخزن:</span>
                <span className="text-base font-extrabold text-stone-800 dark:text-stone-200">
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

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-200/70 dark:border-stone-800">
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
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
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
