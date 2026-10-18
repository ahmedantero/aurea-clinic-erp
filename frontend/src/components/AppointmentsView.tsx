import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Receipt, RefreshCw, Calendar, CheckCircle, Clock, XCircle, Layers } from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';

interface AppointmentsViewProps {
  appointments: Appointment[];
  onOpenNewModal: () => void;
  onOpenCheckoutModal: (apt: Appointment) => void;
  onOpenReceiptModal?: (apt: Appointment) => void;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onDeleteAppointment: (id: string) => void;
  onRefresh?: () => void;
  onFilteredCountChange?: (count: number) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  onOpenNewModal,
  onOpenCheckoutModal,
  onOpenReceiptModal,
  onUpdateStatus,
  onDeleteAppointment,
  onRefresh,
  onFilteredCountChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // Default strictly to 'All' to show all appointments without hidden constraints
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const normalizeStatus = (s?: string) => {
    if (!s) return '';
    const trimmed = s.trim();
    if (trimmed === 'Pending' || trimmed === 'قيد الانتظار') return 'قيد الانتظار';
    if (trimmed === 'Confirmed' || trimmed === 'مؤكد') return 'مؤكد';
    if (trimmed === 'Completed' || trimmed === 'مكتمل') return 'مكتمل';
    if (trimmed === 'Cancelled' || trimmed === 'ملغي') return 'ملغي';
    return trimmed;
  };

  const isAllStatus =
    !statusFilter ||
    statusFilter === 'الكل' ||
    statusFilter === 'All' ||
    statusFilter === 'all' ||
    statusFilter === 'جميع الحالات';

  const isAllDate =
    !dateFilter ||
    dateFilter === 'الكل' ||
    dateFilter === 'All' ||
    dateFilter === 'all' ||
    dateFilter === 'جميع التواريخ';

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = appointments.filter((apt) => {
    if (!apt) return false;

    // Search filter across client name, phone, service name, and staff name
    const term = (searchTerm || '').trim().toLowerCase();
    const matchesSearch =
      !term ||
      (apt.clientName || '').toLowerCase().includes(term) ||
      (apt.clientPhone || '').toLowerCase().includes(term) ||
      (apt.serviceName || '').toLowerCase().includes(term) ||
      (apt.staffName || '').toLowerCase().includes(term) ||
      (apt.categoryName || '').toLowerCase().includes(term);

    // Status filter - if set to "All" / "الكل", return all
    const normAptStatus = normalizeStatus(apt.status);
    const normFilter = normalizeStatus(statusFilter);

    const matchesStatus =
      isAllStatus ||
      apt.status === statusFilter ||
      normAptStatus === normFilter ||
      normAptStatus === statusFilter;

    // Date filter - strictly defaults to All (no hidden today/upcoming constraints)
    let matchesDate = true;
    if (!isAllDate) {
      const aptDate = (apt.appointmentDate || '').trim();
      if (dateFilter === 'today' || dateFilter === 'اليوم') {
        matchesDate = aptDate === todayStr;
      } else if (dateFilter === 'upcoming' || dateFilter === 'المواعيد القادمة') {
        matchesDate = aptDate >= todayStr;
      } else if (dateFilter === 'past' || dateFilter === 'المواعيد السابقة') {
        matchesDate = aptDate < todayStr;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Keep sidebar badge and parent in 1:1 synchronization with the data table count
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(filtered.length);
    }
  }, [filtered.length, onFilteredCountChange]);

  const getStatusBadge = (status?: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case 'مؤكد':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>مؤكد</span>
          </span>
        );
      case 'قيد الانتظار':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 shadow-2xs">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>قيد الانتظار</span>
          </span>
        );
      case 'مكتمل':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200 shadow-2xs">
            <CheckCircle className="w-3 h-3 text-stone-500" />
            <span>مكتمل</span>
          </span>
        );
      case 'ملغي':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 shadow-2xs">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>ملغي</span>
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            {status || 'غير محدد'}
          </span>
        );
    }
  };

  const handleManualRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  };

  const handleDeleteAppointmentClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا الحجز نهائياً؟')) {
      onDeleteAppointment(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-800">جدول الحجوزات</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {appointments.length} حجز كلي
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-0.5">
            متابعة مواعيد الكشوفات وجلسات السبا والعلاج الطبيعي بدقة وتحديث لحظي
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
              title="تحديث قائمة الحجوزات من قاعدة البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-700' : ''}`} />
            </button>
          )}

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حجز جديد</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم العميل أو الخدمة أو الهاتف..."
            className="w-full pr-10 pl-4 py-2 text-sm rounded-xl border border-stone-200/80 bg-stone-50/50 focus:bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 placeholder-stone-400"
          />
        </div>

        {/* Filters & Count Indicator */}
        <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-3">
          <div className="text-xs text-stone-500 font-medium whitespace-nowrap">
            عرض <span className="font-bold text-stone-800">{filtered.length}</span> من أصل <span className="font-bold text-stone-800">{appointments.length}</span>
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500 font-medium whitespace-nowrap">التاريخ:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200/80 bg-white text-stone-700 focus:outline-hidden focus:border-emerald-600 font-medium cursor-pointer shadow-2xs"
            >
              <option value="All">جميع التواريخ (All)</option>
              <option value="today">اليوم (Today)</option>
              <option value="upcoming">المواعيد القادمة (Upcoming)</option>
              <option value="past">المواعيد السابقة (Past)</option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500 font-medium whitespace-nowrap">الحالة:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200/80 bg-white text-stone-700 focus:outline-hidden focus:border-emerald-600 font-medium cursor-pointer shadow-2xs"
            >
              <option value="All">جميع الحالات (All)</option>
              <option value="مؤكد">مؤكد (Confirmed)</option>
              <option value="قيد الانتظار">قيد الانتظار (Pending)</option>
              <option value="مكتمل">مكتمل (Completed)</option>
              <option value="ملغي">ملغي (Cancelled)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clean Appointments Table strictly: (العميل, الخدمة, الأخصائي, الموعد, السعر, الحالة) */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-stone-50/70 border-b border-stone-200/80 text-xs font-semibold text-stone-600">
                <th className="py-3.5 px-6">العميل</th>
                <th className="py-3.5 px-6">الخدمة</th>
                <th className="py-3.5 px-6">الأخصائي</th>
                <th className="py-3.5 px-6">الموعد</th>
                <th className="py-3.5 px-6">السعر</th>
                <th className="py-3.5 px-6">الحالة</th>
                <th className="py-3.5 px-6 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <p className="font-medium text-stone-600">لا توجد حجوزات مطابقة</p>
                    <p className="text-xs mt-1">جرّب تغيير عبارة البحث أو اختيار "جميع الحالات" أو إضافة حجز جديد.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((apt, index) => (
                  <tr 
                    key={apt.id || `apt-row-${index}`} 
                    className={`hover:bg-stone-50/60 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-[#faf8f4]/30'
                    }`}
                  >
                    {/* العميل */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-stone-800">{apt.clientName || 'عميل غير مسجل'}</div>
                      <div className="text-xs text-stone-400 mt-0.5 font-mono" dir="ltr">{apt.clientPhone || '—'}</div>
                    </td>

                    {/* الخدمة */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-stone-800">{apt.serviceName || 'خدمة غير محددة'}</span>
                        {apt.isPackageSession && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">
                            <Layers className="w-3 h-3 text-purple-600" />
                            <span>جلسة باقة</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-400 mt-0.5 block">
                        {apt.categoryName || 'عام'} {apt.packageName ? `• ${apt.packageName}` : ''}
                      </span>
                    </td>

                    {/* الأخصائي */}
                    <td className="py-4 px-6 text-stone-700 font-medium">
                      {apt.staffName || 'غير محدد'}
                    </td>

                    {/* الموعد */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-stone-800">{apt.appointmentDate || '—'}</div>
                      <div className="text-xs text-stone-400 mt-0.5 font-mono">{apt.time || ''}</div>
                    </td>

                    {/* السعر */}
                    <td className="py-4 px-6 font-bold text-stone-800">
                      {apt.isPackageSession ? (
                        <div>
                          <span className="text-emerald-700 font-bold">0 ج.م</span>
                          <span className="text-[10px] block text-purple-600 font-medium">(مسبقة الدفع)</span>
                        </div>
                      ) : (
                        <>
                          {apt.finalPrice ?? 0} <span className="text-xs font-normal text-stone-500">ج.م</span>
                        </>
                      )}
                    </td>

                    {/* الحالة */}
                    <td className="py-4 px-6">
                      {getStatusBadge(apt.status)}
                    </td>

                    {/* إجراءات سريعة */}
                    <td className="py-4 px-6 text-left">
                      <div className="inline-flex items-center gap-1.5">
                        {/* زر الإجراء: إن كان الحجز مكتملاً يفتح إيصال العرض والطباعة فقط للقراءة، وإلا يفتح نافذة الدفع */}
                        {apt.status === 'مكتمل' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenReceiptModal) {
                                onOpenReceiptModal({ ...apt });
                              } else {
                                onOpenCheckoutModal({ ...apt });
                              }
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 shadow-2xs"
                            title="عرض وطباعة الفاتورة"
                          >
                            <Receipt className="w-3.5 h-3.5 text-stone-600" />
                            <span>عرض الفاتورة</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCheckoutModal({ ...apt });
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 shadow-2xs"
                            title="الدفع وإصدار الفاتورة"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                            <span>دفع / فاتورة</span>
                          </button>
                        )}

                        {apt.status === 'قيد الانتظار' && (
                          <button
                            onClick={() => onUpdateStatus(apt.id, 'مؤكد')}
                            className="px-2 py-1 text-xs font-medium rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            تأكيد
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDeleteAppointmentClick(apt.id, e)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="حذف الحجز نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
