import React from 'react';
import { 
  X, 
  Receipt, 
  Printer, 
  CheckCircle2, 
  User, 
  Phone, 
  Sparkles, 
  Stethoscope, 
  Calendar, 
  Clock, 
  Lock,
  CreditCard,
  Banknote,
  Wallet
} from 'lucide-react';
import { Appointment, GeneratedInvoice } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  invoice?: GeneratedInvoice | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  appointment,
  invoice,
}) => {
  if (!isOpen || !appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  // Derive display values from invoice or appointment
  const invoiceNumber = invoice?.invoiceNumber || `INV-${appointment.id.slice(0, 8).toUpperCase()}`;
  const clientName = invoice?.clientName || appointment.clientName || 'عميل غير مسجل';
  const clientPhone = invoice?.clientPhone || appointment.clientPhone || '—';
  const serviceName = invoice?.serviceName || appointment.serviceName || 'جلسة متخصصة';
  const staffName = appointment.staffName || 'غير محدد';
  const categoryName = appointment.categoryName || 'عام';
  
  const basePrice = invoice?.basePrice ?? appointment.finalPrice ?? 0;
  const totalAmount = invoice?.totalAmount ?? appointment.finalPrice ?? 0;
  const discountApplied = invoice?.discountApplied ?? 0;
  const netAmount = invoice?.netAmount ?? appointment.finalPrice ?? 0;
  const paymentMethod = invoice?.paymentMethod || 'كاش (نقدي)';
  
  const formattedDate = appointment.appointmentDate || new Date().toISOString().split('T')[0];
  const formattedTime = appointment.time || '';

  const getPaymentIcon = () => {
    if (paymentMethod.includes('فيزا') || paymentMethod.includes('بطاقة')) {
      return <CreditCard className="w-3.5 h-3.5 text-emerald-700" />;
    }
    if (paymentMethod.includes('محفظة')) {
      return <Wallet className="w-3.5 h-3.5 text-emerald-700" />;
    }
    return <Banknote className="w-3.5 h-3.5 text-emerald-700" />;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs print:p-0 print:bg-white print:static"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col print:shadow-none print:border-none print:max-w-none print:h-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Modal Top Header (Hidden in Print) */}
        <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-800">فاتورة مسددة معتمدة</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  مدفوع بالكامل
                </span>
              </div>
              <p className="text-xs text-stone-400">عرض رسمي للقراءة والطباعة فقط • لا يمكن تعديل الفاتورة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
          
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-semibold text-emerald-900">
                هذه الفاتورة مغلقة ومسددة بالكامل. المعاملة المالية نهائية لمنع تكرار الدفع.
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200/60 shrink-0">
              {invoiceNumber}
            </span>
          </div>

          {/* Printable Official Receipt Card */}
          <div 
            id="printable-receipt" 
            className="w-full bg-[#fdfcfb] p-6 rounded-2xl border border-stone-200/80 text-right space-y-5 print:border-none print:shadow-none print:bg-white print:p-0"
          >
            {/* Letterhead Header */}
            <div className="border-b border-stone-200 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.jpg" 
                  alt="Aurea Clinic" 
                  className="w-12 h-12 rounded-xl object-contain border border-stone-200/80 shadow-2xs bg-white p-1"
                  onError={(e) => {
                    // Fallback gracefully if logo file not loaded
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <h2 className="text-lg font-black text-stone-900 tracking-tight">أوريا كلينك وسبا</h2>
                  <p className="text-xs text-stone-500 font-medium">Aurea Clinic & Spa — إيصال سداد ضريبي معتمد</p>
                </div>
              </div>

              <div className="text-left font-mono text-xs text-stone-600">
                <span className="block font-black text-emerald-900 text-sm">{invoiceNumber}</span>
                <span className="text-[11px] text-stone-400">
                  {formattedDate} {formattedTime ? `• ${formattedTime}` : ''}
                </span>
              </div>
            </div>

            {/* Client & Specialist Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-stone-50/70 border border-stone-200/60 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px] mb-0.5 flex items-center gap-1">
                  <User className="w-3 h-3 text-stone-400" />
                  اسم العميل
                </span>
                <strong className="text-stone-800 text-sm block">{clientName}</strong>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px] mb-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-stone-400" />
                  رقم الهاتف
                </span>
                <span className="text-stone-700 font-mono text-xs block" dir="ltr">{clientPhone}</span>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-stone-400 block text-[11px] mb-0.5 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-stone-400" />
                  الأخصائي المعالج
                </span>
                <span className="text-stone-800 font-bold block">{staffName}</span>
              </div>
            </div>

            {/* Service & Items Details Table */}
            <div className="border border-stone-200/80 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-stone-100/70 text-stone-600 font-semibold border-b border-stone-200/80">
                    <th className="py-2.5 px-4">البند / الخدمة</th>
                    <th className="py-2.5 px-4 text-center">القسم</th>
                    <th className="py-2.5 px-4 text-center">الكمية</th>
                    <th className="py-2.5 px-4 text-left">السعر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {/* Primary Service Row */}
                  <tr className="bg-white">
                    <td className="py-3 px-4 font-bold text-stone-800">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{serviceName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-stone-500">{categoryName}</td>
                    <td className="py-3 px-4 text-center font-bold">1</td>
                    <td className="py-3 px-4 text-left font-extrabold text-stone-900">{basePrice} ج.م</td>
                  </tr>

                  {/* Add-ons if present */}
                  {invoice?.items && invoice.items.length > 0 && invoice.items.map((it, idx) => (
                    <tr key={`${it.id}-${idx}`} className="bg-stone-50/40">
                      <td className="py-2.5 px-4 text-stone-700">
                        <div className="flex items-center gap-1.5">
                          <span>{it.name}</span>
                          {!it.chargeToClient && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                              استهلاك داخلي
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center text-stone-400">مستلزمات</td>
                      <td className="py-2.5 px-4 text-center font-bold">{it.quantity}</td>
                      <td className="py-2.5 px-4 text-left font-semibold text-stone-800">
                        {it.price * it.quantity} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/70 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>الإجمالي الأساسي:</span>
                <span className="font-bold">{totalAmount} ج.م</span>
              </div>

              {discountApplied > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>الخصم الممنوح:</span>
                  <span>- {discountApplied} ج.م</span>
                </div>
              )}

              <div className="pt-2.5 border-t border-stone-200 flex justify-between items-center text-sm font-extrabold text-stone-900">
                <span className="text-emerald-950 font-black">الصافي المسدد:</span>
                <div className="text-left">
                  <span className="text-emerald-800 text-xl font-black">{netAmount} ج.م</span>
                  <span className="block text-[10px] text-emerald-700 font-normal">تم التحصيل بالكامل</span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
                <div className="flex items-center gap-1.5">
                  <span>طريقة السداد:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200">
                    {getPaymentIcon()}
                    <span>{paymentMethod}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>معتمد من الإدارة</span>
                </div>
              </div>
            </div>

            {/* Official Footer */}
            <div className="text-center pt-2 border-t border-stone-200/60 text-[10px] text-stone-400 space-y-0.5">
              <p className="font-medium text-stone-500">أوريا كلينك وسبا • Aurea Clinic & Spa</p>
              <p>شكراً لاختياركم أوريا • نتمنى لكم دوام الصحة والجمال</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="p-4 px-6 border-t border-stone-100 flex items-center justify-between gap-3 bg-stone-50/70 shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            إغلاق
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الفاتورة (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
