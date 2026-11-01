import React, { useState } from 'react';
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
  Wallet,
  MessageSquare
} from 'lucide-react';
import { Appointment, GeneratedInvoice } from '../types';
import { printReceipt } from '../utils/printReceipt';
import { generateInvoiceImageBase64 } from '../utils/generateInvoicePdf';
import { useToast } from '../context/ToastContext';

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

  const { success, error } = useToast();
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const handlePrint = () => {
    printReceipt({
      invoiceNumber: invoice?.invoiceNumber || appointment.invoice?.invoiceNumber || `AUR-${appointment.id.slice(0, 8).toUpperCase()}`,
      clientName: invoice?.clientName || appointment.clientName,
      clientPhone: invoice?.clientPhone || appointment.clientPhone,
      serviceName: invoice?.serviceName || appointment.serviceName,
      categoryName: appointment.categoryName,
      packageName: appointment.packageName,
      staffName: appointment.staffName,
      appointmentDate: appointment.appointmentDate,
      time: appointment.time,
      totalAmount,
      discountApplied,
      discountType,
      discountValue,
      finalPrice: netAmount,
      paymentMethod: invoice?.paymentMethod || appointment.invoice?.paymentMethod || 'نقداً (كاش)',
    });
  };

  const handleSendWhatsApp = async () => {
    const phone = invoice?.clientPhone || appointment.clientPhone;
    if (!phone) {
      error('لا يوجد رقم هاتف مسجل لهذا العميل لإرسال الفاتورة عبر واتساب', 'رقم الهاتف مفقود');
      return;
    }

    setIsSendingWhatsApp(true);
    try {
      const invNum = invoice?.invoiceNumber || appointment.invoice?.invoiceNumber || `AUR-${appointment.id.slice(0, 8).toUpperCase()}`;
      const imageBase64 = await generateInvoiceImageBase64({
        invoiceNumber: invNum,
        clientName: invoice?.clientName || appointment.clientName,
        clientPhone: phone,
        serviceName: invoice?.serviceName || appointment.serviceName,
        categoryName: appointment.categoryName,
        packageName: appointment.packageName,
        staffName: appointment.staffName,
        appointmentDate: appointment.appointmentDate,
        time: appointment.time,
        totalAmount,
        discountApplied,
        discountType,
        discountValue,
        finalPrice: netAmount,
        paymentMethod: invoice?.paymentMethod || appointment.invoice?.paymentMethod || 'نقداً (كاش)',
      });

      if (!imageBase64 || imageBase64.length < 50) {
        error('تعذر التقاط صورة الفاتورة بشكل صحيح', 'خطأ في إنشاء الصورة');
        return;
      }

      console.log("Sending invoice image from ReceiptModal: length =", imageBase64.length);

      const res = await fetch('/api/whatsapp/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          clientName: invoice?.clientName || appointment.clientName,
          invoiceNumber: invNum,
          image: imageBase64,
          imageBase64: imageBase64,
          pdf: imageBase64,
          pdfBase64: imageBase64,
          filename: `فاتورة_أوريا_${invNum}.jpg`,
          message: `مرحباً ${invoice?.clientName || appointment.clientName || 'عميلنا العزيز'} ✨\nمرفق فاتورة زيارتك لعيادة وسبا أوريا (Aurea Clinic & Spa).\nنتمنى لك دوام الصحة والعافية والراحة دائماً 🤍\nرقم الفاتورة: ${invNum}\nيسعدنا دائماً تواصلك معنا!`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success(
          `تم إرسال الفاتورة بنجاح إلى ${invoice?.clientName || appointment.clientName || phone} عبر واتساب ✨`,
          'تم إرسال الفاتورة'
        );
      } else {
        const isNotReady = data.reason === 'client_not_ready' || data.error === 'client_not_ready';
        const msg = isNotReady
          ? 'بوت الواتساب قيد التشغيل والتهيئة حالياً، يرجى الانتظار لحظات والمحاولة مجدداً (WhatsApp bot is still starting, please wait a moment)'
          : data.message || data.error || 'تعذر إرسال صورة الفاتورة عبر واتساب، يرجى التأكد من تشغيل البوت.';
        error(msg, isNotReady ? 'البوت قيد التشغيل' : 'فشل إرسال الفاتورة');
      }
    } catch (err: any) {
      console.error('Error capturing or sending invoice image:', err);
      error('حدث خطأ أثناء إرسال الفاتورة عبر واتساب', 'خطأ في الإرسال');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // Derive display values from invoice or appointment
  const invoiceNumber = invoice?.invoiceNumber || `INV-${appointment.id.slice(0, 8).toUpperCase()}`;
  const clientName = invoice?.clientName || appointment.clientName || 'عميل غير مسجل';
  const clientPhone = invoice?.clientPhone || appointment.clientPhone || '—';
  const serviceName = invoice?.serviceName || appointment.serviceName || 'جلسة متخصصة';
  const staffName = appointment.staffName || 'غير محدد';
  const categoryName = appointment.categoryName || 'عام';
  
  const basePrice = invoice?.basePrice ?? appointment.invoice?.basePrice ?? appointment.basePrice ?? appointment.finalPrice ?? 0;
  const totalAmount = invoice?.totalAmount ?? appointment.invoice?.totalAmount ?? appointment.finalPrice ?? 0;
  const discountApplied = invoice?.discountApplied ?? appointment.invoice?.discountApplied ?? 0;
  const discountType = invoice?.discountType ?? appointment.invoice?.discountType ?? 'amount';
  const discountValue = invoice?.discountValue ?? appointment.invoice?.discountValue ?? discountApplied;
  const netAmount = invoice?.netAmount ?? appointment.invoice?.netAmount ?? appointment.finalPrice ?? 0;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/45 dark:bg-black/60 backdrop-blur-md print:p-0 print:bg-white print:static animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-gradient-to-b from-white via-[#fcfaf6] to-[#f9f6f0] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl shadow-2xl shadow-emerald-950/20 border border-stone-200/90 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-w-none print:h-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Modal Top Header (Hidden in Print) */}
        <div className="px-6 py-4.5 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between bg-white/60 dark:bg-stone-900/60 backdrop-blur-md shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/25 shadow-2xs">
              <Receipt className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">فاتورة مسددة معتمدة</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  مدفوع بالكامل
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">عرض رسمي للقراءة والطباعة فقط • لا يمكن تعديل الفاتورة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 silk-scrollbar bg-transparent print:p-0 print:overflow-visible">
          
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
                  <span>الخصم الممنوح {discountType === 'percentage' ? `(${discountValue}%)` : '(مبلغ ثابت)'}:</span>
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

        {/* Soft Gradient Fade Mask before Footer */}
        <div className="h-4 -mt-4 bg-gradient-to-t from-white/95 dark:from-stone-900/95 to-transparent pointer-events-none relative z-10 print:hidden" />

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="p-4 px-6 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl shrink-0 print:hidden z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSendingWhatsApp}
              onClick={handleSendWhatsApp}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="إرسال الفاتورة الرسمية PDF للعميل عبر واتساب"
            >
              {isSendingWhatsApp ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              <span>إرسال الفاتورة واتساب (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] text-xs font-bold transition-all shadow-md shadow-emerald-950/15 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#d4af37]" />
              <span>طباعة الفاتورة (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
