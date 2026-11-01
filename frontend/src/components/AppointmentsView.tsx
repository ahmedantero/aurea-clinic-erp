import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Trash2, 
  Receipt, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Layers, 
  FilterX, 
  CalendarDays,
  User,
  Sparkles,
  Table,
  LayoutGrid,
  MessageSquare,
  FileText,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Printer,
  Stethoscope,
  Boxes,
  X,
  Phone
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { generateInvoiceImageBase64 } from '../utils/generateInvoicePdf';
import { printReceipt } from '../utils/printReceipt';
import { EmptyState } from './ui/EmptyState';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { AppointmentsKanban } from './AppointmentsKanban';
import { TableContextMenu } from './ui/TableContextMenu';
import { Pagination } from './ui/Pagination';
import { usePagination } from '../hooks/usePagination';
import { CancelRefundModal } from './CancelRefundModal';

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
  const { success, error, confirm } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState<string | null>(null);
  const [cancelRefundApt, setCancelRefundApt] = useState<Appointment | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const toggleRowExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const handlePrintInvoice = async (apt: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onOpenReceiptModal) {
      onOpenReceiptModal(apt);
      return;
    }
    const invNumber = apt.invoice?.invoiceNumber || `AUR-${apt.id.slice(0, 8).toUpperCase()}`;
    await printReceipt({
      invoiceNumber: invNumber,
      clientName: apt.clientName,
      clientPhone: apt.clientPhone,
      serviceName: apt.serviceName || apt.packageName || 'جلسة علاجية / سبا',
      categoryName: apt.categoryName,
      packageName: apt.packageName || undefined,
      staffName: apt.staffName,
      appointmentDate: apt.appointmentDate,
      time: apt.time,
      finalPrice: apt.invoice?.netAmount ?? apt.finalPrice,
      basePrice: apt.basePrice ?? apt.finalPrice,
      totalAmount: apt.invoice?.totalAmount ?? apt.finalPrice,
      discountApplied: apt.invoice?.discountApplied ?? 0,
      paymentMethod: apt.invoice?.paymentMethod || apt.paymentMethod || 'CASH',
      items: apt.services && apt.services.length > 0
        ? apt.services.map((s) => ({
            name: s.name,
            price: s.price,
            durationMinutes: s.durationMinutes,
            categoryName: s.categoryName,
            staffName: s.staffName || apt.staffName,
          }))
        : undefined,
      consumables: apt.consumables?.map((c) => ({
        name: c.productName,
        quantity: c.quantity,
        price: c.priceCharged,
      })),
      createdByName: apt.createdBy?.name || apt.createdBy?.username,
    });
  };

  // ── Send WhatsApp Reminder Action with Toasts ────────────────────────────
  const handleSendWhatsAppReminder = async (apt: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const phone = apt.clientPhone?.trim();
    if (!phone) {
      error('لا يوجد رقم هاتف مسجل لهذا العميل لإرسال تذكير واتساب', 'رقم الهاتف مفقود');
      return;
    }

    setSendingWhatsAppId(apt.id);
    try {
      const res = await fetch('/api/whatsapp/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          clientName: apt.clientName,
          staffName: apt.staffName,
          serviceName: apt.serviceName || apt.packageName,
          appointmentDate: apt.appointmentDate,
          time: apt.time,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success(
          `تم إرسال تذكير الموعد بنجاح عبر واتساب إلى ${apt.clientName || phone} ✨`,
          'تم الإرسال بنجاح'
        );
      } else {
        const isNotReady = data.reason === 'client_not_ready' || data.error === 'client_not_ready';
        const msg = isNotReady
          ? 'بوت الواتساب قيد التشغيل والتهيئة حالياً، يرجى الانتظار لحظات والمحاولة مجدداً (WhatsApp bot is still starting, please wait a moment)'
          : data.message || data.error || 'تعذر إرسال رسالة الواتساب، يرجى التأكد من تشغيل البوت.';
        error(msg, isNotReady ? 'البوت قيد التشغيل' : 'فشل إرسال التذكير');
      }
    } catch (err: any) {
      error('حدث خطأ في الاتصال بالخادم أثناء إرسال تذكير الواتساب', 'خطأ في الاتصال');
    } finally {
      setSendingWhatsAppId(null);
    }
  };

  // ── Send WhatsApp Invoice PDF Action with Toasts ───────────────────────────
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);

  const handleSendWhatsAppInvoice = async (apt: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const phone = apt.clientPhone?.trim();
    if (!phone) {
      error('لا يوجد رقم هاتف مسجل لهذا العميل لإرسال الفاتورة عبر واتساب', 'رقم الهاتف مفقود');
      return;
    }

    setSendingInvoiceId(apt.id);
    try {
      const invoiceNum = apt.invoice?.invoiceNumber || `AUR-${apt.id.slice(0, 8).toUpperCase()}`;
      const imageBase64 = await generateInvoiceImageBase64({
        invoiceNumber: invoiceNum,
        clientName: apt.clientName,
        clientPhone: apt.clientPhone,
        serviceName: apt.serviceName || apt.packageName,
        categoryName: apt.categoryName,
        packageName: apt.packageName,
        staffName: apt.staffName,
        appointmentDate: apt.appointmentDate,
        time: apt.time,
        finalPrice: apt.invoice?.netAmount ?? apt.finalPrice,
        paymentMethod: apt.invoice?.paymentMethod || 'نقداً (كاش)',
      });

      if (!imageBase64 || imageBase64.length < 50) {
        error('تعذر إنشاء صورة الفاتورة بشكل صحيح', 'خطأ في إنشاء الصورة');
        return;
      }

      console.log("Sending invoice image to backend: length =", imageBase64.length);

      const res = await fetch('/api/whatsapp/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          clientName: apt.clientName,
          invoiceNumber: invoiceNum,
          image: imageBase64,
          imageBase64: imageBase64,
          pdf: imageBase64,
          pdfBase64: imageBase64,
          filename: `فاتورة_أوريا_${invoiceNum}.jpg`,
          message: `مرحباً ${apt.clientName || 'عميلنا العزيز'} ✨\nمرفق فاتورة زيارتك لعيادة وسبا أوريا (Aurea Clinic & Spa).\nنتمنى لك دوام الصحة والعافية والراحة دائماً 🤍\nرقم الفاتورة: ${invoiceNum}\nيسعدنا دائماً تواصلك معنا!`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success(
          `تم إرسال الفاتورة بنجاح إلى ${apt.clientName || phone} عبر واتساب ✨`,
          'تم إرسال الفاتورة'
        );
      } else {
        const isNotReady = data.reason === 'client_not_ready' || data.error === 'client_not_ready';
        const msg = isNotReady
          ? 'بوت الواتساب قيد التشغيل والتهيئة حالياً، يرجى الانتظار لحظات والمحاولة مجدداً (WhatsApp bot is still starting, please wait a moment)'
          : data.message || data.error || 'تعذر إرسال صورة الفاتورة عبر واتساب، تأكد من تشغيل البوت.';
        error(msg, isNotReady ? 'البوت قيد التشغيل' : 'فشل إرسال الفاتورة');
      }
    } catch (err: any) {
      console.error('Error generating or sending invoice image:', err);
      error('حدث خطأ أثناء إنشاء الفاتورة أو إرسالها عبر واتساب', 'خطأ في الإرسال');
    } finally {
      setSendingInvoiceId(null);
    }
  };

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

    // Date filter
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

  // Keep parent and badge count in exact synchronization
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(filtered.length);
    }
  }, [filtered.length, onFilteredCountChange]);

  // Luxury Pagination Controller
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData: paginatedAppointments,
    resetPage,
  } = usePagination(filtered, { initialPageSize: 10 });

  // Reset to page 1 whenever search, status, or date filters change
  useEffect(() => {
    resetPage();
  }, [searchTerm, statusFilter, dateFilter]);

  const getStatusBadge = (status?: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case 'مؤكد':
        return (
          <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
            مؤكد
          </Badge>
        );
      case 'قيد الانتظار':
        return (
          <Badge variant="warning" icon={<Clock className="w-3.5 h-3.5" />}>
            قيد الانتظار
          </Badge>
        );
      case 'مكتمل':
        return (
          <Badge variant="neutral" icon={<CheckCircle2 className="w-3.5 h-3.5 text-stone-500" />}>
            مكتمل
          </Badge>
        );
      case 'ملغي':
        return (
          <Badge variant="danger" icon={<XCircle className="w-3.5 h-3.5" />}>
            ملغي
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral">
            {status || 'غير محدد'}
          </Badge>
        );
    }
  };

  const handleManualRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        success('تم تحديث قائمة الحجوزات بنجاح');
      } finally {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  };

  const handleDeleteConfirm = async (id: string, _clientName?: string) => {
    const confirmed = await confirm({
      title: 'حذف الحجز نهائياً',
      message: 'هل أنت متأكد من رغبتك في حذف هذا الحجز نهائياً من قاعدة البيانات؟ لن يمكن استرجاع هذا الحجز بعد الحذف.',
      confirmText: 'نعم، حذف الحجز',
      cancelText: 'تراجع',
      type: 'danger',
    });

    if (confirmed) {
      onDeleteAppointment(id);
      success('تم حذف الحجز بنجاح');
    }
  };

  const handleDeleteAppointmentClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await handleDeleteConfirm(id);
  };

  const handleStatusUpdateWithFeedback = (id: string, newStatus: AppointmentStatus) => {
    onUpdateStatus(id, newStatus);
    success(`تم تحديث حالة الحجز إلى "${newStatus}" بنجاح`);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setDateFilter('All');
  };

  const isFiltering = searchTerm !== '' || !isAllStatus || !isAllDate;

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">جدول الحجوزات</h1>
            <Badge variant="gold" size="sm">
              {appointments.length} حجز كلي
            </Badge>
            {isFiltering && (
              <Badge variant="info" size="sm">
                مصفّى: {filtered.length}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            إدارة ومتابعة مواعيد الكشوفات، جلسات السبا، والعلاج الطبيعي مع الربط المالي المباشر
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* View Mode Segmented Control (Table vs Kanban Board) with Smooth Sliding Pill */}
          <div className="flex items-center p-1 bg-white/90 dark:bg-stone-800/90 rounded-2xl border border-stone-200/80 dark:border-stone-700 shadow-2xs relative">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'text-[#f5e4ab]'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              {viewMode === 'table' && (
                <motion.div
                  layoutId="activeViewTab"
                  className="absolute inset-0 bg-[#0f3b2c] rounded-xl shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Table className="w-3.5 h-3.5" />
              <span>عرض الجدول</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'text-[#f5e4ab]'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              {viewMode === 'kanban' && (
                <motion.div
                  layoutId="activeViewTab"
                  className="absolute inset-0 bg-[#0f3b2c] rounded-xl shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>لوحة السحب (Kanban)</span>
            </button>
          </div>

          {onRefresh && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-stone-200/80 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="تحديث الحجوزات من الخادم"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-700' : ''}`} />
            </button>
          )}

          <Button
            onClick={onOpenNewModal}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            إضافة حجز جديد
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar - Optimized for Mobile & iPad */}
      <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl p-3.5 sm:p-4 rounded-3xl border border-stone-200/90 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(15,59,44,0.05)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالعميل، الهاتف، الخدمة، أو المعالج..."
            className="w-full pr-10 pl-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:border-[#0f3b2c] focus:ring-2 focus:ring-[#0f3b2c]/10 transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
            >
              مسح
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <span className="text-xs text-stone-500 font-medium whitespace-nowrap hidden sm:inline">التاريخ:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-[#0f3b2c] font-medium cursor-pointer shadow-2xs"
            >
              <option value="All">جميع التواريخ</option>
              <option value="today">مواعيد اليوم</option>
              <option value="upcoming">المواعيد القادمة</option>
              <option value="past">المواعيد السابقة</option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <span className="text-xs text-stone-500 font-medium whitespace-nowrap hidden sm:inline">الحالة:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-[#0f3b2c] font-medium cursor-pointer shadow-2xs"
            >
              <option value="All">جميع الحالات</option>
              <option value="مؤكد">مؤكد</option>
              <option value="قيد الانتظار">قيد الانتظار</option>
              <option value="مكتمل">مكتمل</option>
              <option value="ملغي">ملغي</option>
            </select>
          </div>

          {/* Reset Filters Button if Active */}
          {isFiltering && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer border border-rose-200/60"
              title="إلغاء جميع الفلاتر"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* View Switch: Interactive Kanban Board vs Main SaaS Data Table */}
      {viewMode === 'kanban' ? (
        <AppointmentsKanban
          appointments={filtered}
          onUpdateStatus={onUpdateStatus}
          onOpenCheckoutModal={onOpenCheckoutModal}
          onOpenReceiptModal={onOpenReceiptModal}
          onCancelRefund={(apt) => setCancelRefundApt(apt)}
        />
      ) : (
        /* Main SaaS Data Table with Sticky Header & Ergonomics */
        <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-3xl border border-stone-200/90 dark:border-white/10 shadow-[0_15px_40px_-12px_rgba(15,59,44,0.06)] overflow-hidden">
        <div className="overflow-x-auto silk-scrollbar">
          <table className="w-full text-right border-collapse">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-b border-stone-200/90 dark:border-stone-800 shadow-xs">
              <tr className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                <th className="py-3 px-2 w-10 text-center"></th>
                <th className="py-3 px-3 text-right">العميل</th>
                <th className="py-3 px-3 text-right">الخدمة / الباقة</th>
                <th className="py-3 px-3 text-right">المعالج / الأخصائي</th>
                <th className="py-3 px-3 text-right">الموعد والتوقيت</th>
                <th className="py-3 px-3 text-right">السعر</th>
                <th className="py-3 px-3 text-center">الحالة</th>
                <th className="py-3 px-3 text-left">الإجراءات</th>
              </tr>
            </thead>

            {/* Table Body with Alternate Zebra Rows & Hover Accent */}
            <tbody className="divide-y divide-stone-100 text-sm font-normal">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6">
                    <EmptyState
                      icon={isFiltering ? FilterX : CalendarDays}
                      title={isFiltering ? 'لا توجد حجوزات مطابقة للفلاتر الحالية' : 'لا توجد حجوزات مسجلة بعد'}
                      description={
                        isFiltering
                          ? 'جرب البحث باسم آخر أو إزالة فلتر التاريخ والحالة لرؤية كافة المواعيد.'
                          : 'ابدأ بتسجيل أول حجز في العيادة لتظهر بياناته هنا فوراً.'
                      }
                      actionText={isFiltering ? 'إلغاء الفلاتر' : 'إضافة حجز جديد'}
                      onAction={isFiltering ? handleResetFilters : onOpenNewModal}
                    />
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((apt, index) => {
                  const normStatus = normalizeStatus(apt.status);
                  const isCancelled = normStatus === 'ملغي' || normStatus === 'Cancelled';
                  const isCompleted = !isCancelled && (normStatus === 'مكتمل' || Boolean(apt.invoice));
                  const isPending = !isCancelled && !isCompleted && normStatus === 'قيد الانتظار';
                  const isExpanded = expandedRowId === apt.id;
                  const primaryService = apt.services && apt.services.length > 0 ? apt.services[0] : null;
                  const remainingCount = apt.services && apt.services.length > 1 ? apt.services.length - 1 : 0;
                  const primaryServiceName = primaryService ? primaryService.name : (apt.serviceName || 'خدمة غير محددة');
                  const primaryCategoryName = primaryService?.categoryName || apt.categoryName || 'عام';

                  return (
                    <React.Fragment key={apt.id || `apt-row-${index}`}>
                      <TableContextMenu
                        isCompleted={isCompleted}
                        onCheckout={!isCompleted && !isCancelled ? () => onOpenCheckoutModal(apt) : undefined}
                        onViewReceipt={isCompleted && onOpenReceiptModal ? () => onOpenReceiptModal(apt) : undefined}
                        onCancelRefund={!isCancelled ? () => setCancelRefundApt(apt) : undefined}
                        onStatusChange={(newStatus) => {
                          if (newStatus === 'ملغي') {
                            setCancelRefundApt(apt);
                          } else {
                            handleStatusUpdateWithFeedback(apt.id, newStatus);
                          }
                        }}
                        onCopyInfo={() => {
                          navigator.clipboard.writeText(`${apt.clientName} - ${apt.serviceName} - ${apt.appointmentDate} ${apt.time}`);
                          success('تم نسخ بيانات الموعد إلى الحافظة 📋');
                        }}
                        onDelete={() => handleDeleteConfirm(apt.id, apt.clientName)}
                      >
                        <motion.tr
                          drag="x"
                          dragDirectionLock
                          dragConstraints={{ left: -100, right: 0 }}
                          dragElastic={0.2}
                          dragSnapToOrigin
                          onDragEnd={(_, info) => {
                            if (info.offset.x < -70) {
                              handleDeleteConfirm(apt.id, apt.clientName);
                            }
                          }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.22, 
                            delay: Math.min(index * 0.025, 0.35), 
                            ease: 'easeOut' 
                          }}
                          onClick={() => toggleRowExpand(apt.id)}
                          className={`transition-all duration-150 luxury-row-hover hover:bg-[#0f3b2c]/5 dark:hover:bg-stone-800/50 group cursor-pointer select-none ${
                            isExpanded
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/25 ring-1 ring-emerald-500/20'
                              : index % 2 === 0
                              ? 'bg-white dark:bg-stone-900'
                              : 'bg-[#fbf9f5]/60 dark:bg-stone-900/60'
                          }`}
                          title="انقر على الصف لتوسيع كارت التفاصيل والأدوات الكاملة"
                        >
                          {/* 0. سهم التوسيع */}
                          <td className="py-3 px-2 text-center w-10">
                            <button
                              type="button"
                              onClick={(e) => toggleRowExpand(apt.id, e)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isExpanded
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                              }`}
                              title={isExpanded ? 'طي التفاصيل' : 'توسيع كارت التفاصيل'}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-emerald-700 dark:text-emerald-400' : ''
                                }`}
                              />
                            </button>
                          </td>

                          {/* 1. العميل */}
                          <td className="py-3 px-3 max-w-[160px]">
                            <div className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#0f3b2c] dark:group-hover:text-[#d4af37] transition-colors truncate" title={apt.clientName}>
                              {apt.clientName || 'عميل غير مسجل'}
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5 font-mono" dir="ltr">
                              {apt.clientPhone || '—'}
                            </div>
                          </td>

                          {/* 2. الخدمة */}
                          <td className="py-3 px-3 max-w-[240px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-stone-800 dark:text-stone-100 truncate max-w-[180px]" title={apt.serviceName}>
                                {primaryServiceName}
                              </span>
                              {remainingCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 shrink-0" title={`يوجد ${remainingCount} خدمات إضافية مسجلة`}>
                                  +{remainingCount} أخرى
                                </span>
                              )}
                              {apt.isPackageSession && (
                                <Badge variant="purple" size="sm" icon={<Layers className="w-3 h-3" />}>
                                  باقة
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 block truncate max-w-[190px]">
                              {primaryCategoryName} {apt.packageName ? `• ${apt.packageName}` : ''}
                            </span>
                          </td>

                          {/* 3. الأخصائي */}
                          <td className="py-3 px-3 text-stone-700 dark:text-stone-300 font-medium max-w-[130px]">
                            <div className="flex items-center gap-1.5 truncate" title={apt.staffName}>
                              <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="truncate">{apt.staffName || 'غير محدد'}</span>
                            </div>
                          </td>

                          {/* 4. الموعد */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-medium text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>{apt.appointmentDate || '—'}</span>
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-mono mr-5">
                              {apt.time || ''}
                            </div>
                          </td>

                          {/* 5. السعر */}
                          <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap tabular-nums text-xs">
                            {apt.isPackageSession ? (
                              <div>
                                <span className="text-purple-700 dark:text-purple-400 font-bold">0 ج.م</span>
                                <span className="text-[9px] block text-purple-600 dark:text-purple-400 font-medium">(مسبقة الدفع)</span>
                              </div>
                            ) : (
                              <>
                                {Number(apt.finalPrice ?? 0).toLocaleString()}{' '}
                                <span className="text-[10px] font-normal text-stone-500">ج.م</span>
                              </>
                            )}
                          </td>

                          {/* 6. الحالة */}
                          <td className="py-3 px-3 whitespace-nowrap text-center">
                            {getStatusBadge(isCancelled ? 'ملغي' : (isCompleted ? 'مكتمل' : apt.status))}
                          </td>

                          {/* 7. الإجراءات المريحة */}
                          <td className="py-3 px-3 text-left whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {/* Primary Quick Action */}
                              {isCompleted ? (
                                <button
                                  type="button"
                                  onClick={(e) => handlePrintInvoice(apt, e)}
                                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/90 shadow-2xs"
                                  title="عرض وطباعة الفاتورة"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-stone-600" />
                                  <span>فاتورة</span>
                                </button>
                              ) : !isCancelled ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenCheckoutModal({ ...apt });
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-[#0f3b2c] border border-emerald-200/80 shadow-2xs"
                                  title="الدفع وإصدار الفاتورة"
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>سداد</span>
                                </button>
                              ) : (
                                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg">
                                  ملغي
                                </span>
                              )}

                              {/* Expand Card Quick Pill */}
                              <button
                                type="button"
                                onClick={(e) => toggleRowExpand(apt.id, e)}
                                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer border ${
                                  isExpanded
                                    ? 'bg-[#0f3b2c] text-white border-[#0f3b2c] shadow-xs'
                                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-emerald-500/50'
                                }`}
                                title="عرض كارت التفاصيل الكامل"
                              >
                                <span>{isExpanded ? 'طي' : 'التفاصيل'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      </TableContextMenu>

                      {/* ── Master-Detail Luxury Folio Card Row ──────────────── */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr className="bg-stone-50/70 dark:bg-stone-900/70 border-b border-emerald-500/20">
                            <td colSpan={8} className="p-0">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 sm:p-5 bg-gradient-to-b from-emerald-50/30 via-white to-stone-50 dark:from-stone-900 dark:via-stone-850 dark:to-stone-900 border-x border-stone-200/80 dark:border-stone-800">
                                  <div className="bg-white dark:bg-stone-800/95 rounded-2xl border border-stone-200/90 dark:border-stone-700/80 shadow-md p-4 sm:p-5 space-y-4">
                                    {/* Card Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-700 pb-3">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0f3b2c] to-emerald-700 text-white flex items-center justify-center shadow-xs">
                                          <Sparkles className="w-4 h-4 text-amber-300" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-black text-stone-900 dark:text-stone-100">
                                              كارت تفاصيل الحجز الفاخر • Booking Folio
                                            </h4>
                                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-600">
                                              {apt.invoice?.invoiceNumber || `AUR-${apt.id.slice(0, 8).toUpperCase()}`}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                                            الموعد: <span className="font-semibold text-stone-700 dark:text-stone-200">{apt.appointmentDate}</span> الساعة <span className="font-semibold text-emerald-800 dark:text-emerald-300">{apt.time}</span>
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {getStatusBadge(isCancelled ? 'ملغي' : (isCompleted ? 'مكتمل' : apt.status))}
                                        <button
                                          type="button"
                                          onClick={(e) => toggleRowExpand(apt.id, e)}
                                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                                          title="إغلاق الكارت"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Card Columns */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                      {/* Col 1: Services Breakdown */}
                                      <div className="bg-stone-50/90 dark:bg-stone-900/60 rounded-xl p-3 border border-stone-200/70 dark:border-stone-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200">
                                          <span className="flex items-center gap-1.5 text-[#0f3b2c] dark:text-emerald-400">
                                            <Stethoscope className="w-3.5 h-3.5" />
                                            <span>الخدمات المحجوزة</span>
                                          </span>
                                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold">
                                            {apt.services && apt.services.length > 0 ? apt.services.length : 1} خدمة
                                          </span>
                                        </div>

                                        <div className="space-y-1.5 divide-y divide-stone-200/60 dark:divide-stone-800 max-h-40 overflow-y-auto">
                                          {apt.services && apt.services.length > 0 ? (
                                            apt.services.map((srv, sIdx) => (
                                              <div key={srv.id || sIdx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                                                <div>
                                                  <div className="font-bold text-stone-900 dark:text-stone-100">{srv.name}</div>
                                                  <div className="text-[10px] text-stone-500 dark:text-stone-400">
                                                    {srv.categoryName || apt.categoryName} • {srv.durationMinutes || 45} دقيقة
                                                    {srv.staffName && srv.staffName !== apt.staffName && ` • مع ${srv.staffName}`}
                                                  </div>
                                                </div>
                                                <div className="font-mono font-bold text-stone-800 dark:text-stone-200 shrink-0 mr-2">
                                                  {srv.isPackageSession ? '0 ج.م' : `${srv.price.toLocaleString()} ج.م`}
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="flex items-center justify-between text-xs">
                                              <div>
                                                <div className="font-bold text-stone-900 dark:text-stone-100">{apt.serviceName || 'جلسة علاجية'}</div>
                                                <div className="text-[10px] text-stone-500 dark:text-stone-400">{apt.categoryName || 'عام'}</div>
                                              </div>
                                              <div className="font-mono font-bold text-stone-800 dark:text-stone-200">
                                                {Number(apt.finalPrice ?? 0).toLocaleString()} ج.م
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        <div className="pt-1 border-t border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-400">
                                          <span>الأخصائي المعالج:</span>
                                          <span className="font-bold text-stone-900 dark:text-stone-100">{apt.staffName || 'غير محدد'}</span>
                                        </div>
                                      </div>

                                      {/* Col 2: Financial Settlement */}
                                      <div className="bg-stone-50/90 dark:bg-stone-900/60 rounded-xl p-3 border border-stone-200/70 dark:border-stone-800 space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f3b2c] dark:text-emerald-400">
                                          <Receipt className="w-3.5 h-3.5" />
                                          <span>التسوية المحاسبية والمالية</span>
                                        </div>

                                        <div className="space-y-1 text-xs">
                                          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                                            <span>سعر الجلسات الأساسي:</span>
                                            <span className="font-mono">{Number(apt.basePrice ?? apt.finalPrice ?? 0).toLocaleString()} ج.م</span>
                                          </div>

                                          {Boolean(apt.totalConsumablesPrice && apt.totalConsumablesPrice > 0) && (
                                            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                                              <span>مستهلكات طبية:</span>
                                              <span className="font-mono text-emerald-700">+{apt.totalConsumablesPrice} ج.م</span>
                                            </div>
                                          )}

                                          {Boolean(apt.invoice?.discountApplied && apt.invoice.discountApplied > 0) && (
                                            <div className="flex items-center justify-between text-rose-600">
                                              <span>الخصم المطبق:</span>
                                              <span className="font-mono">-{apt.invoice.discountApplied} ج.م</span>
                                            </div>
                                          )}

                                          <div className="pt-1.5 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between">
                                            <span className="font-black text-stone-900 dark:text-stone-100">الإجمالي النهائي:</span>
                                            <span className="font-mono font-black text-sm text-[#0f3b2c] dark:text-emerald-400">
                                              {Number(apt.finalPrice ?? 0).toLocaleString()} ج.م
                                            </span>
                                          </div>

                                          <div className="pt-1 flex items-center justify-between text-[11px] text-stone-500">
                                            <span>طريقة الدفع:</span>
                                            <span className="font-bold text-stone-700 dark:text-stone-300">
                                              {apt.invoice?.paymentMethod === 'CASH'
                                                ? 'نقداً (كاش)'
                                                : apt.invoice?.paymentMethod === 'INSTAPAY'
                                                ? 'إنستاباي'
                                                : apt.invoice?.paymentMethod === 'WALLET'
                                                ? 'محفظة إلكترونية'
                                                : apt.paymentMethod || 'نقداً (كاش)'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Col 3: Client & Audit */}
                                      <div className="bg-stone-50/90 dark:bg-stone-900/60 rounded-xl p-3 border border-stone-200/70 dark:border-stone-800 space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f3b2c] dark:text-emerald-400">
                                          <User className="w-3.5 h-3.5" />
                                          <span>بيانات العميل والمستهلكات</span>
                                        </div>

                                        <div className="space-y-1 text-xs">
                                          <div className="flex items-center justify-between">
                                            <span className="text-stone-500">الاسم:</span>
                                            <span className="font-bold text-stone-900 dark:text-stone-100">{apt.clientName || 'عميل غير مسجل'}</span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-stone-500">الهاتف:</span>
                                            <a
                                              href={apt.clientPhone ? `tel:${apt.clientPhone}` : undefined}
                                              className="font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                                              dir="ltr"
                                            >
                                              {apt.clientPhone || '—'}
                                            </a>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-stone-500">مسؤول الإدخال:</span>
                                            <span className="text-stone-700 dark:text-stone-300 font-semibold">
                                              {apt.createdBy?.name || apt.createdBy?.username || 'النظام'}
                                            </span>
                                          </div>

                                          {apt.consumables && apt.consumables.length > 0 && (
                                            <div className="pt-1 border-t border-stone-200 dark:border-stone-700">
                                              <span className="text-[10px] font-bold text-stone-500 block mb-0.5">المستهلكات:</span>
                                              <div className="flex flex-wrap gap-1">
                                                {apt.consumables.map((c, cIdx) => (
                                                  <span
                                                    key={c.id || cIdx}
                                                    className="px-2 py-0.5 rounded-lg text-[10px] bg-stone-200/80 dark:bg-stone-700 text-stone-800 dark:text-stone-200"
                                                  >
                                                    {c.productName} ({c.quantity})
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Hub Toolbar inside Card */}
                                    <div className="pt-3 border-t border-stone-100 dark:border-stone-700 flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {/* Print / Checkout Button */}
                                        {isCompleted ? (
                                          <button
                                            type="button"
                                            onClick={(e) => handlePrintInvoice(apt, e)}
                                            className="px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 shadow-2xs"
                                            title="عرض وطباعة الفاتورة المعزولة"
                                          >
                                            <Printer className="w-4 h-4 text-stone-700" />
                                            <span>عرض وطباعة الفاتورة</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onOpenCheckoutModal({ ...apt });
                                            }}
                                            className="px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20"
                                            title="تحصيل وسداد الفاتورة"
                                          >
                                            <CreditCard className="w-4 h-4 text-emerald-100" />
                                            <span>تحصيل وسداد الفاتورة</span>
                                          </button>
                                        )}

                                        {/* WhatsApp Invoice Button */}
                                        <button
                                          type="button"
                                          disabled={sendingInvoiceId === apt.id}
                                          onClick={(e) => handleSendWhatsAppInvoice(apt, e)}
                                          className="px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="إرسال الفاتورة الرسمية للعميل عبر واتساب"
                                        >
                                          {sendingInvoiceId === apt.id ? (
                                            <span className="w-3.5 h-3.5 border-2 border-[#fbf8ee] border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <FileText className="w-3.5 h-3.5 text-amber-300" />
                                          )}
                                          <span>إرسال الفاتورة واتساب</span>
                                        </button>

                                        {/* WhatsApp Reminder Button */}
                                        <button
                                          type="button"
                                          disabled={sendingWhatsAppId === apt.id}
                                          onClick={(e) => handleSendWhatsAppReminder(apt, e)}
                                          className="px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="إرسال تذكير الموعد عبر واتساب"
                                        >
                                          {sendingWhatsAppId === apt.id ? (
                                            <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                                          )}
                                          <span>تذكير واتساب</span>
                                        </button>

                                        {/* Confirm if Pending */}
                                        {isPending && (
                                          <button
                                            type="button"
                                            onClick={() => handleStatusUpdateWithFeedback(apt.id, 'مؤكد')}
                                            className="px-3.5 py-2 text-xs font-bold rounded-xl text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                                            title="تأكيد الحجز فوراً"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5 inline ml-1 text-emerald-700" />
                                            <span>تأكيد الموعد</span>
                                          </button>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {/* Cancel & Refund Action */}
                                        {!isCancelled && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCancelRefundApt(apt);
                                            }}
                                            className="px-3 py-2 text-xs font-bold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                            title="إلغاء واسترداد الحجز والتسوية المالية"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                            <span>إلغاء واسترداد</span>
                                          </button>
                                        )}

                                        {/* Delete Button */}
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteAppointmentClick(apt.id, e)}
                                          className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                          title="حذف الحجز نهائياً"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Luxury Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          itemLabel="حجز"
        />
      </div>
      )}

      {/* Modern Cancellation & Financial Refund Settlement Modal */}
      <CancelRefundModal
        isOpen={Boolean(cancelRefundApt)}
        onClose={() => setCancelRefundApt(null)}
        appointment={cancelRefundApt}
        onSuccess={(_, refundDetails) => {
          if (onRefresh) onRefresh();
          const amount = refundDetails?.refundAmount || 0;
          if (amount > 0) {
            success(`تم إلغاء الحجز واسترداد (${amount} ج.م) بنجاح، وتمت التسوية المحاسبية ↩️`);
          } else {
            success('تم إلغاء الحجز بنجاح');
          }
        }}
      />
    </div>
  );
};
