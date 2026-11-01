import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  User, 
  Receipt, 
  Layers, 
  Phone, 
  Sparkles,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Appointment, AppointmentStatus } from '../types';
import { Badge } from './ui/Badge';
import { useToast } from '../context/ToastContext';

interface AppointmentsKanbanProps {
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onOpenCheckoutModal: (apt: Appointment) => void;
  onOpenReceiptModal?: (apt: Appointment) => void;
  onCancelRefund?: (apt: Appointment) => void;
}

interface ColumnConfig {
  id: AppointmentStatus;
  title: string;
  icon: any;
  color: string;
  bgLight: string;
  borderColor: string;
  badgeVariant: 'warning' | 'success' | 'neutral' | 'danger';
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'قيد الانتظار',
    title: 'قيد الانتظار (Pending)',
    icon: Clock,
    color: 'text-amber-700 dark:text-amber-400',
    bgLight: 'bg-amber-500/5 dark:bg-amber-500/10',
    borderColor: 'border-amber-200/80 dark:border-amber-500/20',
    badgeVariant: 'warning',
  },
  {
    id: 'مؤكد',
    title: 'مؤكد (Confirmed)',
    icon: CheckCircle2,
    color: 'text-emerald-700 dark:text-emerald-400',
    bgLight: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    borderColor: 'border-emerald-200/80 dark:border-emerald-500/20',
    badgeVariant: 'success',
  },
  {
    id: 'مكتمل',
    title: 'مكتمل (Completed)',
    icon: CheckCircle2,
    color: 'text-teal-800 dark:text-teal-300',
    bgLight: 'bg-teal-500/5 dark:bg-teal-500/10',
    borderColor: 'border-teal-200/80 dark:border-teal-500/20',
    badgeVariant: 'neutral',
  },
  {
    id: 'ملغي',
    title: 'ملغي (Cancelled)',
    icon: XCircle,
    color: 'text-rose-700 dark:text-rose-400',
    bgLight: 'bg-rose-500/5 dark:bg-rose-500/10',
    borderColor: 'border-rose-200/80 dark:border-rose-500/20',
    badgeVariant: 'danger',
  },
];

export const AppointmentsKanban: React.FC<AppointmentsKanbanProps> = ({
  appointments,
  onUpdateStatus,
  onOpenCheckoutModal,
  onOpenReceiptModal,
  onCancelRefund,
}) => {
  const { success } = useToast();
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<AppointmentStatus | null>(null);

  const normalizeStatus = (status?: string): AppointmentStatus => {
    if (!status) return 'قيد الانتظار';
    const s = status.trim();
    if (s === 'Pending' || s === 'قيد الانتظار') return 'قيد الانتظار';
    if (s === 'Confirmed' || s === 'مؤكد') return 'مؤكد';
    if (s === 'Completed' || s === 'مكتمل') return 'مكتمل';
    if (s === 'Cancelled' || s === 'ملغي') return 'ملغي';
    return 'قيد الانتظار';
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedAptId(id);
  };

  const handleDragOver = (e: React.DragEvent, colId: AppointmentStatus) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: AppointmentStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const aptId = e.dataTransfer.getData('text/plain') || draggedAptId;
    if (!aptId) return;

    const apt = appointments.find((a) => a.id === aptId);
    if (!apt) return;

    const currentStatus = normalizeStatus(apt.status);
    if (currentStatus !== targetStatus) {
      if (targetStatus === 'ملغي' && onCancelRefund) {
        onCancelRefund(apt);
      } else {
        onUpdateStatus(aptId, targetStatus);
        success(`تم نقل موعد "${apt.clientName || 'العميل'}" إلى "${targetStatus}"`);
      }
    }
    setDraggedAptId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4.5 items-start">
      {COLUMNS.map((col) => {
        const Icon = col.icon;
        const colAppointments = appointments.filter((apt) => {
          const norm = normalizeStatus(apt.status);
          if (norm === 'ملغي') {
            return col.id === 'ملغي';
          }
          const isDone = norm === 'مكتمل' || (Boolean(apt.invoice) && apt.finalPrice > 0);
          if (col.id === 'مكتمل') return isDone;
          if (isDone) return false;
          return norm === col.id;
        });

        const isDropActive = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`rounded-3xl border transition-all duration-200 flex flex-col min-h-[500px] ${col.borderColor} ${
              isDropActive 
                ? 'bg-emerald-100/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500 scale-[1.01]' 
                : col.bgLight
            }`}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.color}`} />
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {col.title}
                </h3>
              </div>
              <Badge variant={col.badgeVariant} size="sm">
                {colAppointments.length}
              </Badge>
            </div>

            {/* Column Cards Drop Area with Silk Scrollbar */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[400px] silk-scrollbar">
              <AnimatePresence>
                {colAppointments.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-stone-200/70 dark:border-stone-700/50 rounded-2xl text-stone-400 dark:text-stone-500 text-xs">
                    <p className="font-medium">اسحب موعداً إلى هنا</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">لتحديث الحالة مباشرة</p>
                  </div>
                ) : (
                  colAppointments.map((apt, idx) => {
                    const isCompleted = normalizeStatus(apt.status) !== 'ملغي' && (normalizeStatus(apt.status) === 'مكتمل' || Boolean(apt.invoice));

                    return (
                      <motion.div
                        key={apt.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e as any, apt.id)}
                        className="bg-white dark:bg-stone-900/90 rounded-2xl p-4 shadow-xs hover:shadow-md border border-stone-200/80 dark:border-stone-700/80 transition-all cursor-grab active:cursor-grabbing group hover:border-[#0f3b2c]/40 dark:hover:border-emerald-500/40 relative"
                      >
                        {/* Drag Handle Indicator */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#0f3b2c] dark:group-hover:text-emerald-400 transition-colors">
                              {apt.clientName || 'عميل غير مسجل'}
                            </h4>
                            <p className="text-xs text-stone-400 font-mono mt-0.5" dir="ltr">
                              {apt.clientPhone || '—'}
                            </p>
                          </div>
                          <GripVertical className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 shrink-0 mt-0.5" />
                        </div>

                        {/* Service / Package Badge */}
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-lg">
                            {apt.serviceName || 'خدمة غير محددة'}
                          </span>
                          {apt.services && apt.services.length > 1 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                              {apt.services.length} خدمات
                            </span>
                          )}
                          {apt.isPackageSession && (
                            <Badge variant="purple" size="sm" icon={<Layers className="w-3 h-3" />}>
                              باقة
                            </Badge>
                          )}
                        </div>

                        {/* Staff & Date info */}
                        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-stone-400" />
                              <span className="truncate max-w-[120px]">{apt.staffName || 'غير محدد'}</span>
                            </span>
                            <span className="font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                              {apt.isPackageSession ? '0 ج.م' : `${Number(apt.finalPrice || 0).toLocaleString()} ج.م`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-stone-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{apt.appointmentDate}</span>
                            </span>
                            <span className="font-mono">{apt.time || ''}</span>
                          </div>
                        </div>

                        {/* Quick Invoice Button */}
                        <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end">
                          {isCompleted ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenReceiptModal) onOpenReceiptModal(apt);
                                else onOpenCheckoutModal(apt);
                              }}
                              className="text-[11px] font-bold text-stone-700 dark:text-stone-300 hover:text-stone-900 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition-colors cursor-pointer"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>عرض الفاتورة</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenCheckoutModal(apt);
                              }}
                              className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200/60 dark:border-emerald-700/60"
                            >
                              <Receipt className="w-3 h-3 text-emerald-600" />
                              <span>دفع / فاتورة</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
};
