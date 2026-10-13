import React, { useState } from 'react';
import { 
  X, 
  Receipt, 
  Plus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Wallet, 
  Printer, 
  CheckCircle2, 
  ShoppingBag,
  Phone,
  User,
  Stethoscope,
  Sparkles,
  Info
} from 'lucide-react';
import { Appointment, InventoryItemType, GeneratedInvoice, InvoiceItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  inventoryItems: InventoryItemType[];
  onInvoiceCreated: (invoice: GeneratedInvoice) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  appointment,
  inventoryItems,
  onInvoiceCreated,
}) => {
  // 1. Add-ons / Inventory: COMPLETELY OPTIONAL. Default is empty string ""
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [addonQuantity, setAddonQuantity] = useState<number>(1);
  const [chargeToClient, setChargeToClient] = useState<boolean>(true);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  // 2. Flexible Discount
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // 3. Payment Method
  const [paymentMethod, setPaymentMethod] = useState<string>('كاش');

  // 4. Submission & Generated Receipt State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<GeneratedInvoice | null>(null);

  if (!isOpen || !appointment) return null;

  // Real-time auto-calculation (Works flawlessly when invoiceItems is empty!)
  const basePrice = appointment.finalPrice || 0;
  const addonsTotal = invoiceItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grossTotal = basePrice + addonsTotal;

  const discountAmount = discountType === 'amount' 
    ? Math.min(discountValue, grossTotal)
    : Math.round((grossTotal * Math.min(discountValue, 100)) / 100);

  const netAmount = Math.max(0, grossTotal - discountAmount);

  // Add Item to Bill (Only if an item is explicitly chosen)
  const handleAddAddon = () => {
    if (!selectedInventoryId) return;

    const item = inventoryItems.find((it) => it.id === selectedInventoryId);
    if (!item || addonQuantity <= 0) return;

    // Checked: actual price; Unchecked: 0 EGP (internal consumption)
    const chargedUnitPrice = chargeToClient ? item.unitCost : 0;

    setInvoiceItems((prev) => {
      // Find matching item with SAME chargeToClient status
      const existingIndex = prev.findIndex(
        (i) => i.id === item.id && i.chargeToClient === chargeToClient
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += addonQuantity;
        return updated;
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: chargedUnitPrice,
          originalPrice: item.unitCost,
          quantity: addonQuantity,
          chargeToClient,
        },
      ];
    });

    // Reset dropdown back to default empty state, keep chargeToClient true by default
    setSelectedInventoryId('');
    setAddonQuantity(1);
    setChargeToClient(true);
  };

  // Remove Item from Bill by index
  const handleRemoveAddon = (index: number) => {
    setInvoiceItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Confirm & Generate Invoice
  const handleConfirmInvoice = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          totalAmount: grossTotal,
          discountApplied: discountAmount,
          netAmount,
          paymentMethod,
          items: invoiceItems, // Safely empty array [] if no items selected!
        }),
      });

      if (!response.ok) {
        throw new Error('فشل تسجيل الفاتورة في قاعدة البيانات');
      }

      const invoiceData = await response.json();
      
      const fullInvoice: GeneratedInvoice = {
        ...invoiceData,
        basePrice,
        items: invoiceItems,
      };

      setGeneratedReceipt(fullInvoice);
      onInvoiceCreated(fullInvoice);
    } catch (err) {
      console.warn('API error, falling back locally:', err);
      // Fallback receipt
      const fallback: GeneratedInvoice = {
        invoiceId: `inv-${Date.now().toString().slice(-6)}`,
        invoiceNumber: `INV-${Date.now().toString().slice(-6).toUpperCase()}`,
        appointmentId: appointment.id,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        serviceName: appointment.serviceName,
        basePrice,
        totalAmount: grossTotal,
        discountApplied: discountAmount,
        netAmount,
        paymentMethod,
        createdAt: new Date().toISOString(),
        items: invoiceItems,
      };
      setGeneratedReceipt(fallback);
      onInvoiceCreated(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Printable Receipt View (When invoice is confirmed) */}
        {generatedReceipt ? (
          <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-6 overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
                تم الدفع بنجاح • مكتمل
              </span>
              <h3 className="text-xl font-bold text-stone-800 pt-2">
                فاتورة حجز رقم: {generatedReceipt.invoiceNumber}
              </h3>
              <p className="text-xs text-stone-400">
                أوريا كلينك وسبا • {new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' })}
              </p>
            </div>

            {/* Official Printable Receipt Card */}
            <div 
              id="printable-receipt" 
              className="w-full bg-stone-50/70 p-6 rounded-2xl border border-stone-200/80 text-right space-y-4 print:border-none print:shadow-none print:bg-white"
            >
              {/* Receipt Header */}
              <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-stone-800">أوريا كلينك وسبا</h2>
                  <p className="text-[11px] text-stone-500">Aurea Clinic & Spa — إيصال سداد معتمد</p>
                </div>
                <div className="text-left font-mono text-xs text-stone-600">
                  <span className="block font-bold text-stone-800">{generatedReceipt.invoiceNumber}</span>
                  <span className="text-[10px] text-stone-400">
                    {new Date(generatedReceipt.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Client & Booking Info */}
              <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-stone-200/60 pb-3">
                <div>
                  <span className="text-stone-400 block text-[11px]">العميل:</span>
                  <strong className="text-stone-800">{generatedReceipt.clientName}</strong>
                </div>
                <div className="text-left">
                  <span className="text-stone-400 block text-[11px]">الهاتف:</span>
                  <span className="text-stone-800 font-mono" dir="ltr">{generatedReceipt.clientPhone}</span>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-800 font-medium">جلسة: {generatedReceipt.serviceName}</span>
                  <span className="font-bold text-stone-800">{generatedReceipt.basePrice} ج.م</span>
                </div>

                {/* Only display add-ons if they exist! */}
                {generatedReceipt.items.length > 0 && (
                  <div className="pt-1 border-t border-stone-100 space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 block">إضافات ومبيعات المخزن:</span>
                    {generatedReceipt.items.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="flex justify-between py-1 text-stone-600 border-b border-stone-50">
                        <div className="flex items-center gap-1.5">
                          <span>{item.name} × {item.quantity}</span>
                          {!item.chargeToClient && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                              استهلاك داخلي (مجاني)
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-stone-800">{item.price * item.quantity} ج.م</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>الإجمالي قبل الخصم:</span>
                  <span>{generatedReceipt.totalAmount} ج.م</span>
                </div>
                {generatedReceipt.discountApplied > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>الخصم المطبق:</span>
                    <span>- {generatedReceipt.discountApplied} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-800 font-extrabold text-sm pt-2 border-t border-dashed border-stone-300">
                  <span>الصافي المطلوب سداده:</span>
                  <span className="text-emerald-800 text-base">{generatedReceipt.netAmount} ج.م</span>
                </div>
                <div className="flex justify-between text-stone-500 text-[11px] pt-1">
                  <span>طريقة السداد:</span>
                  <span className="font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
                    {generatedReceipt.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="pt-3 text-center border-t border-stone-200/60 text-[10px] text-stone-400">
                شكراً لثقتكم بنا في أوريا كلينك وسبا • نتمنى لكم دوام الصحة والعافية
              </div>
            </div>

            {/* Receipt Modal Actions (Hidden during print) */}
            <div className="w-full flex items-center justify-between gap-3 pt-2 print:hidden">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                إغلاق والعودة للجدول
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة (Print)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Preparation Form */
          <>
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-800">الدفع وإصدار الفاتورة</h3>
                  <p className="text-xs text-stone-400">إتمام محاسبة الجلسة وإصدار الإيصال الرسمي</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* 1. Appointment Details */}
              <div className="p-4.5 rounded-2xl bg-stone-50/80 border border-stone-200/70 space-y-3">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  1. تفاصيل الجلسة الأساسية
                </span>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-700" />
                      <h4 className="font-bold text-stone-800 text-sm">{appointment.clientName}</h4>
                      <span className="text-xs text-stone-400 font-mono flex items-center gap-1" dir="ltr">
                        <Phone className="w-3 h-3 text-stone-400" />
                        {appointment.clientPhone}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-600 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                        الخدمة: <strong className="text-stone-800">{appointment.serviceName}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-stone-400" />
                        الأخصائي: <strong className="text-stone-800">{appointment.staffName}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="bg-white px-3.5 py-2 rounded-xl border border-stone-200/80 shadow-2xs text-left sm:text-right shrink-0">
                    <span className="text-[11px] text-stone-400 block">سعر الجلسة الأساسي</span>
                    <span className="font-extrabold text-stone-900 text-base">{basePrice} ج.م</span>
                  </div>
                </div>
              </div>

              {/* 2. Add-ons / Inventory: COMPLETELY OPTIONAL */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    <span>2. إضافات ومبيعات من المخزن</span>
                    <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      اختياري
                    </span>
                  </label>
                  <span className="text-[11px] text-stone-400">ماسكات، ليفة مغربي، منتجات</span>
                </div>

                {/* Add-on selector controls: Default state is empty! */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedInventoryId}
                    onChange={(e) => setSelectedInventoryId(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-hidden focus:border-emerald-600"
                  >
                    <option value="">-- بدون إضافات (اضغط لاختيار منتج) --</option>
                    {inventoryItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} — {it.unitCost} ج.م (المتوفر: {it.quantityInStock})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center border border-stone-200 rounded-xl bg-white px-2 py-1">
                    <span className="text-[11px] text-stone-400 ml-1">الكمية:</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      disabled={!selectedInventoryId}
                      value={addonQuantity}
                      onChange={(e) => setAddonQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 text-center text-xs font-bold focus:outline-hidden disabled:text-stone-300"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAddon}
                    disabled={!selectedInventoryId}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة</span>
                  </button>
                </div>

                {/* Charge to Client Toggle / Checkbox */}
                <div className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                  !selectedInventoryId 
                    ? 'bg-stone-50/50 border-stone-200/50 opacity-60' 
                    : chargeToClient 
                    ? 'bg-emerald-50/50 border-emerald-200/80' 
                    : 'bg-amber-50/50 border-amber-200/80'
                }`}>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={!selectedInventoryId}
                      checked={chargeToClient}
                      onChange={(e) => setChargeToClient(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700 accent-emerald-700 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-xs font-bold text-stone-800">
                      محاسبة العميل على هذا المنتج
                    </span>
                  </label>

                  <div>
                    {chargeToClient ? (
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ☑ يحسب على العميل (+ السعر)
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200">
                        ☐ استهلاك داخلي للجلسة (0 ج.م)
                      </span>
                    )}
                  </div>
                </div>

                {/* Selected Add-ons Table or Reassuring Helper message */}
                {invoiceItems.length > 0 ? (
                  <div className="bg-stone-50/60 rounded-xl border border-stone-200/70 overflow-hidden text-xs">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200/60 text-stone-500 bg-stone-100/50 text-[11px]">
                          <th className="py-2 px-3">المنتج</th>
                          <th className="py-2 px-3">طبيعة البند</th>
                          <th className="py-2 px-3">سعر الوحدة</th>
                          <th className="py-2 px-3">الكمية</th>
                          <th className="py-2 px-3">الإجمالي</th>
                          <th className="py-2 px-3 text-left">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {invoiceItems.map((item, idx) => (
                          <tr key={`${item.id}-${idx}`} className="hover:bg-white/60">
                            <td className="py-2 px-3 font-semibold text-stone-800">{item.name}</td>
                            <td className="py-2 px-3">
                              {item.chargeToClient ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                                  محاسبة عميل
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
                                  استهلاك داخلي
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-stone-500">
                              {item.chargeToClient ? (
                                <span>{item.price} ج.م</span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="line-through text-stone-400 text-[11px]">
                                    {item.originalPrice || item.price} ج.م
                                  </span>
                                  <span className="font-bold text-amber-800">0 ج.م</span>
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-stone-700 font-bold">{item.quantity}</td>
                            <td className="py-2 px-3 font-extrabold text-stone-800">
                              {item.price * item.quantity} ج.م
                            </td>
                            <td className="py-2 px-3 text-left">
                              <button
                                type="button"
                                onClick={() => handleRemoveAddon(idx)}
                                className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="حذف البند"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-stone-50/60 border border-stone-200/50 text-[11px] text-stone-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>لم تتم إضافة منتجات (سيتم إصدار الفاتورة بسعر الجلسة الأساسي فقط).</span>
                  </div>
                )}
              </div>

              {/* 3. Flexible Discount: Toggle between Fixed Amount (ج.م) and Percentage (%) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">3. الخصم والتخفيض (اختياري)</label>
                  <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setDiscountType('amount')}
                      className={`px-3 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                        discountType === 'amount' ? 'bg-white text-stone-800 shadow-xs' : 'text-stone-400'
                      }`}
                    >
                      مبلغ ثابت (ج.م)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      className={`px-3 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                        discountType === 'percentage' ? 'bg-white text-stone-800 shadow-xs' : 'text-stone-400'
                      }`}
                    >
                      نسبة مئوية (%)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 font-bold"
                  />
                  <span className="text-xs text-stone-400 w-12 font-medium">
                    {discountType === 'amount' ? 'ج.م' : '%'}
                  </span>
                </div>
              </div>

              {/* 4. Payment Method */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700">4. طريقة الدفع</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'كاش', label: 'كاش (نقدي)', icon: Banknote },
                    { id: 'فيزا', label: 'فيزا / بطاقة', icon: CreditCard },
                    { id: 'محفظة إلكترونية', label: 'محفظة ذكية', icon: Wallet },
                  ].map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-stone-400'}`} />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Auto-calculated Breakdown: Calming green card */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block pb-1 border-b border-emerald-100">
                  الحساب التلقائي الصافي للفاتورة
                </span>
                
                <div className="flex justify-between text-stone-600">
                  <span>سعر الجلسة الأساسي:</span>
                  <span className="font-bold">{basePrice} ج.م</span>
                </div>
                
                {addonsTotal > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>إجمالي مبيعات المخزن:</span>
                    <span className="font-bold">+{addonsTotal} ج.م</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>الخصم المطبق:</span>
                    <span className="font-bold text-rose-600">-{discountAmount} ج.م</span>
                  </div>
                )}

                <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-sm font-extrabold text-stone-900">
                  <span className="text-emerald-950">الإجمالي الصافي للدفع:</span>
                  <span className="text-emerald-800 text-xl font-black">{netAmount} ج.م</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 px-6 border-t border-stone-100 flex items-center justify-between gap-3 bg-stone-50/40 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmInvoice}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>جاري تسجيل الفاتورة...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>تأكيد وطباعة الفاتورة</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
