import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../context/AuthContext';

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
  const { getAuthHeaders } = useAuth();
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

  // Explicitly reset ALL states (addons, discount, payment method, generated receipt)
  const resetAllStates = () => {
    setSelectedInventoryId('');
    setAddonQuantity(1);
    setChargeToClient(true);
    setInvoiceItems([]);
    setDiscountType('amount');
    setDiscountValue(0);
    setPaymentMethod('كاش');
    setIsSubmitting(false);
    setGeneratedReceipt(null);
  };

  const handleFinishAndClose = () => {
    resetAllStates();
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    onClose();
  };

  const handleClose = () => {
    handleFinishAndClose();
  };

  // Whenever modal opens or selected appointment changes, reset all states fresh
  useEffect(() => {
    if (isOpen) {
      resetAllStates();
      // Defensive guard: If the appointment is completed, show read-only receipt view directly
      if (appointment?.status === 'مكتمل') {
        setGeneratedReceipt(
          appointment.invoice || {
            invoiceId: appointment.id,
            invoiceNumber: `INV-${appointment.id.slice(0, 8).toUpperCase()}`,
            appointmentId: appointment.id,
            clientName: appointment.clientName,
            clientPhone: appointment.clientPhone,
            serviceName: appointment.serviceName,
            basePrice: appointment.finalPrice,
            totalAmount: appointment.finalPrice,
            discountApplied: 0,
            netAmount: appointment.finalPrice,
            paymentMethod: 'كاش',
            createdAt: appointment.appointmentDate || new Date().toISOString(),
            items: [],
          }
        );
      }
    }
  }, [isOpen, appointment?.id, appointment?.status]);

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
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        cache: 'no-store',
        body: JSON.stringify({
          appointmentId: appointment.id,
          totalAmount: grossTotal,
          discountApplied: discountAmount,
          discountType,
          discountValue,
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
        discountApplied: discountAmount,
        discountType,
        discountValue,
        totalAmount: grossTotal,
        netAmount,
        items: invoiceItems,
      };

      // Clean browser history state to prevent reload resubmission prompts
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      onInvoiceCreated(fullInvoice);
      handleFinishAndClose();
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
        discountType,
        discountValue,
        netAmount,
        paymentMethod,
        createdAt: new Date().toISOString(),
        items: invoiceItems,
      };
      onInvoiceCreated(fallback);
      handleFinishAndClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/45 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-xl bg-gradient-to-b from-white via-[#fcfaf6] to-[#f9f6f0] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl shadow-2xl shadow-emerald-950/20 border border-stone-200/90 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Printable Receipt View (When invoice is confirmed) */}
        {generatedReceipt ? (
          <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-6 overflow-y-auto silk-scrollbar flex-1">
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
                    <span>الخصم المطبق {generatedReceipt.discountType === 'percentage' ? `(${generatedReceipt.discountValue}%)` : '(مبلغ ثابت)'}:</span>
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
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 print:hidden">
              <button
                type="button"
                onClick={handleFinishAndClose}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>إنهاء وإغلاق الفاتورة (Finish)</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-stone-600" />
                <span>طباعة الفاتورة (Print)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Preparation Form */
          <>
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between bg-white/60 dark:bg-stone-900/60 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/25 shadow-2xs">
                  <Receipt className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">الدفع وإصدار الفاتورة</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">إتمام محاسبة الجلسة وإصدار الإيصال الرسمي</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 silk-scrollbar bg-transparent">
              
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
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <span>3. الخصم والتخفيض (اختياري)</span>
                    {discountAmount > 0 && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        خصم {discountType === 'percentage' ? `${discountValue}%` : `${discountAmount} ج.م`} (-{discountAmount} ج.م)
                      </span>
                    )}
                  </label>
                  <div className="flex items-center bg-stone-200/60 p-0.5 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setDiscountType('amount')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                        discountType === 'amount' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      مبلغ ثابت (ج.م)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                        discountType === 'percentage' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
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
                    max={discountType === 'percentage' ? '100' : String(grossTotal)}
                    placeholder="0"
                    value={discountValue || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (discountType === 'percentage') {
                        setDiscountValue(Math.min(100, Math.max(0, val)));
                      } else {
                        setDiscountValue(Math.max(0, val));
                      }
                    }}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 font-bold"
                  />
                  <span className="text-xs font-bold text-stone-500 w-12 text-center bg-stone-100 py-2 rounded-xl border border-stone-200">
                    {discountType === 'amount' ? 'ج.م' : '%'}
                  </span>
                </div>

                {/* Quick Presets for Convenient Click */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-stone-400 font-medium">خيارات سريعة:</span>
                  {(discountType === 'percentage' ? [5, 10, 15, 20, 25, 50] : [50, 100, 150, 200, 300]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDiscountValue(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                        discountValue === preset
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {preset} {discountType === 'percentage' ? '%' : 'ج.م'}
                    </button>
                  ))}
                  {discountValue > 0 && (
                    <button
                      type="button"
                      onClick={() => setDiscountValue(0)}
                      className="text-[10px] px-2 py-0.5 rounded-lg text-stone-400 hover:text-rose-600 transition-colors cursor-pointer mr-auto"
                    >
                      إلغاء الخصم
                    </button>
                  )}
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

                {grossTotal !== basePrice && (
                  <div className="flex justify-between text-stone-500 text-[11px]">
                    <span>الإجمالي قبل الخصم:</span>
                    <span className="font-semibold">{grossTotal} ج.م</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold bg-white/70 p-1.5 rounded-lg border border-rose-100">
                    <span>الخصم المطبق ({discountType === 'percentage' ? `${discountValue}%` : 'مبلغ ثابت'}):</span>
                    <span>-{discountAmount} ج.م</span>
                  </div>
                )}

                <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-sm font-extrabold text-stone-900">
                  <span className="text-emerald-950">الإجمالي الصافي للدفع:</span>
                  <span className="text-emerald-800 text-xl font-black">{netAmount} ج.م</span>
                </div>
              </div>

              {/* Doctor Commission Notice Card */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>توزيع الحسابات المالية وعمولة الأخصائي (قاعدة عمل أساسية):</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  ✓ <strong>مستحقات الأخصائي محفوظة بالكامل:</strong> تُحسب عمولة الأخصائي حصرياً على سعر الجلسة الأساسي الأصلي (<strong>{basePrice} ج.م</strong>) دون أن تتأثر إطلاقاً بالخصم الممنوح للعميل.
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  ✓ <strong>تحمل المركز للخصم:</strong> المركز يتحمل 100% من قيمة الخصم الممنوح ({discountAmount} ج.م) ويخصم ذلك من صافي ربح المركز فقط. كما يستحق المركز 100% من عوائد المستلزمات ({addonsTotal} ج.م).
                </p>
              </div>
            </div>

            {/* Soft Gradient Fade Mask before Footer */}
            <div className="h-4 -mt-4 bg-gradient-to-t from-white/95 dark:from-stone-900/95 to-transparent pointer-events-none relative z-10" />

            {/* Modal Actions */}
            <div className="p-4 px-6 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl shrink-0 z-20">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmInvoice}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] text-xs font-bold transition-all shadow-md shadow-emerald-950/10 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>جاري تسجيل الفاتورة...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 text-[#d4af37]" />
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
