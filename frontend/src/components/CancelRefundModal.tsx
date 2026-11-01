import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  AlertTriangle, 
  Banknote, 
  Wallet, 
  Zap, 
  Package, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  User, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { Appointment } from '../types';

interface CancelRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: (updatedAppointment: Appointment, refundInfo: any) => void;
}

export const CancelRefundModal: React.FC<CancelRefundModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  if (!isOpen || !appointment) return null;

  const originalPaid = Number(appointment.invoice?.netAmount ?? appointment.finalPrice ?? 0);
  
  const [shouldRefund, setShouldRefund] = useState<boolean>(originalPaid > 0);
  const [refundAmount, setRefundAmount] = useState<number>(originalPaid);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'WALLET' | 'INSTAPAY'>('CASH');
  const [refundReason, setRefundReason] = useState<string>('طلب العميل إلغاء الحجز واسترداد المبلغ');
  const [restockConsumables, setRestockConsumables] = useState<boolean>(true);
  const [restorePackageSession, setRestorePackageSession] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when modal opens or appointment changes
  useEffect(() => {
    if (appointment) {
      const paid = Number(appointment.invoice?.netAmount ?? appointment.finalPrice ?? 0);
      setShouldRefund(paid > 0);
      setRefundAmount(paid);
      setRefundReason('طلب العميل إلغاء الحجز واسترداد المبلغ');
      setRestockConsumables(true);
      setRestorePackageSession(true);
      setErrorMsg(null);
    }
  }, [appointment]);

  const handleQuickPercent = (percent: number) => {
    const val = Math.round((originalPaid * (percent / 100)) * 100) / 100;
    setRefundAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    if (shouldRefund && (refundAmount < 0 || refundAmount > originalPaid)) {
      setErrorMsg(`مبلغ الاسترداد يجب أن يكون بين 0 و ${originalPaid} ج.م`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}/cancel-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refund: shouldRefund,
          refundAmount: shouldRefund ? refundAmount : 0,
          refundMethod,
          refundReason: refundReason.trim() || 'إلغاء واسترداد الحجز',
          restockConsumables,
          restorePackageSession,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل إلغاء الحجز');
      }

      onSuccess(data.updatedAppointment || { ...appointment, status: 'ملغي' }, data.refundDetails);
      onClose();
    } catch (err: any) {
      console.error('Error during cancellation/refund:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء تنفيذ عملية الاسترداد والإلغاء');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-rose-50 via-rose-50/50 to-white dark:from-rose-950/40 dark:via-stone-900 dark:to-stone-900 border-b border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                إلغاء واسترداد الحجز
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                  تسوية مالية
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                إلغاء الموعد وإجراء التسوية المحاسبية واسترداد المستحقات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4.5 text-xs sm:text-sm silk-scrollbar flex-1 bg-transparent">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Appointment Snapshot Card */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 space-y-2.5">
            <div className="flex justify-between items-center text-stone-800 dark:text-stone-200">
              <span className="font-bold text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                {appointment.clientName || 'عميل مسجل'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                المسدد: {originalPaid} ج.م
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/60 dark:border-stone-700/50">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                <span>الخدمة: <strong className="text-stone-700 dark:text-stone-200">{appointment.serviceName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>المعالج: <strong className="text-stone-700 dark:text-stone-200">{appointment.staffName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>التاريخ: {appointment.appointmentDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>الوقت: {appointment.time}</span>
              </div>
            </div>
          </div>

          {/* Refund Option Mode */}
          <div className="space-y-2">
            <label className="font-bold text-stone-800 dark:text-stone-200 block text-xs">
              نوع الإجراء المالي:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShouldRefund(true);
                  if (refundAmount === 0) setRefundAmount(originalPaid);
                }}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex items-center gap-3 ${
                  shouldRefund
                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                }`}
              >
                <div className={`p-2 rounded-xl ${shouldRefund ? 'bg-rose-500 text-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-500'}`}>
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">استرداد مالي للعميل</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">رد المبلغ وتعديل الفاتورة</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShouldRefund(false);
                  setRefundAmount(0);
                }}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex items-center gap-3 ${
                  !shouldRefund
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                }`}
              >
                <div className={`p-2 rounded-xl ${!shouldRefund ? 'bg-amber-500 text-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-500'}`}>
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">إلغاء بدون استرداد</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">حسب سياسة عدم الإلغاء</div>
                </div>
              </button>
            </div>
          </div>

          {/* Refund Details (Shown if shouldRefund) */}
          {shouldRefund && (
            <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-3.5 animate-in fade-in">
              {/* Refund Amount Input & Quick Buttons */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    مبلغ الاسترداد (ج.م):
                  </label>
                  <span className="text-[11px] text-stone-500">
                    الحد الأقصى: {originalPaid} ج.م
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={originalPaid}
                    step="any"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base font-bold focus:outline-hidden focus:border-rose-500 shadow-2xs"
                  />
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-stone-400">
                    ج.م
                  </span>
                </div>

                {/* Quick Percent Pills */}
                {originalPaid > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => handleQuickPercent(100)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 transition-colors cursor-pointer"
                    >
                      كامل المبلغ (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPercent(80)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                    >
                      خصم 20% رسوم
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPercent(50)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                    >
                      50%
                    </button>
                  </div>
                )}
              </div>

              {/* Refund Payment Method */}
              <div>
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block mb-1.5">
                  طريقة رد المبلغ للعميل:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundMethod('CASH')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                      refundMethod === 'CASH'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 shadow-2xs'
                        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>كاش / نقدي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMethod('WALLET')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                      refundMethod === 'WALLET'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 shadow-2xs'
                        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>محفظة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMethod('INSTAPAY')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                      refundMethod === 'INSTAPAY'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 shadow-2xs'
                        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>إنستاباي</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Additional Restoration Toggles */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={restockConsumables}
                onChange={(e) => setRestockConsumables(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 dark:border-stone-700"
              />
              <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                إرجاع المستهلكات الطبية المحجوزة للمخزون تلقائياً 📦
              </span>
            </label>

            {appointment.clientPackageId && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={restorePackageSession}
                  onChange={(e) => setRestorePackageSession(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 dark:border-stone-700"
                />
                <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                  استرجاع رصيد الجلسة للباقة المخصصة للعميل 🎫
                </span>
              </label>
            )}
          </div>

          {/* Reason Input */}
          <div>
            <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block mb-1">
              سبب الإلغاء / ملاحظات:
            </label>
            <input
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="مثال: طلب العميل لظروف خاصة، إعادة جدولة، إلخ"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-stone-400 shadow-2xs"
            />
          </div>

          {/* Financial Integrity Note */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-[11px] text-emerald-900 dark:text-emerald-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              الترابط المحاسبي الأوتوماتيكي:
            </div>
            <p className="text-stone-600 dark:text-stone-400">
              {shouldRefund
                ? `سيتم تعديل صافي الفاتورة (${originalPaid} ⬅️ ${originalPaid - refundAmount} ج.م)، وتصفير عمولة الطبيب (${appointment.doctorCommission || 0} ج.م ⬅️ 0 ج.م)، وضبط رصيد الخزينة تلقائياً.`
                : 'سيتم تحويل حالة الحجز إلى ملغي، وإلغاء عمولة الأخصائي مع الاحتفاظ بالإيراد المحصل وفقاً للسياسة.'}
            </p>
          </div>

          {/* Soft Gradient Fade Mask before Footer */}
          <div className="h-4 -mt-4 bg-gradient-to-t from-white/95 dark:from-stone-900/95 to-transparent pointer-events-none relative z-10" />

          {/* Modal Footer Buttons */}
          <div className="sticky bottom-0 z-20 -mx-6 -mb-6 px-6 py-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
            >
              تراجع
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-2 py-2.5 px-4 text-xs font-bold rounded-xl text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                shouldRefund
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-900/20'
                  : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-900/20'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري تنفيذ التسوية...</span>
                </>
              ) : shouldRefund ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>تأكيد الإلغاء ورد {refundAmount} ج.م</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>تأكيد الإلغاء بدون استرداد</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
