import React, { useState } from 'react';
import { Plus, Search, Trash2, Receipt } from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';

interface AppointmentsViewProps {
  appointments: Appointment[];
  onOpenNewModal: () => void;
  onOpenCheckoutModal: (apt: Appointment) => void;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onDeleteAppointment: (id: string) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  onOpenNewModal,
  onOpenCheckoutModal,
  onUpdateStatus,
  onDeleteAppointment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');

  const filtered = appointments.filter((apt) => {
    const matchesSearch =
      apt.clientName.includes(searchTerm) ||
      apt.clientPhone.includes(searchTerm) ||
      apt.serviceName.includes(searchTerm) ||
      apt.staffName.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'الكل' || apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'مؤكد':
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            مؤكد
          </span>
        );
      case 'قيد الانتظار':
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
            قيد الانتظار
          </span>
        );
      case 'مكتمل':
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            مكتمل
          </span>
        );
      case 'ملغي':
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            ملغي
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">جدول الحجوزات</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            متابعة مواعيد الكشوفات وجلسات السبا والعلاج الطبيعي
          </p>
        </div>
        <button
          onClick={onOpenNewModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إضافة حجز جديد
        </button>
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

        {/* Status Dropdown */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <span className="text-xs text-stone-500 font-medium whitespace-nowrap">الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 text-sm rounded-xl border border-stone-200/80 bg-white text-stone-700 focus:outline-hidden focus:border-emerald-600"
          >
            <option value="الكل">جميع الحالات</option>
            <option value="مؤكد">مؤكد</option>
            <option value="قيد الانتظار">قيد الانتظار</option>
            <option value="مكتمل">مكتمل</option>
            <option value="ملغي">ملغي</option>
          </select>
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
                    <p className="text-xs mt-1">جرّب تغيير عبارة البحث أو إضافة حجز جديد.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-stone-50/50 transition-colors">
                    {/* العميل */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-stone-800">{apt.clientName}</div>
                      <div className="text-xs text-stone-400 mt-0.5" dir="ltr">{apt.clientPhone}</div>
                    </td>

                    {/* الخدمة */}
                    <td className="py-4 px-6">
                      <span className="font-medium text-stone-800">{apt.serviceName}</span>
                      <span className="block text-xs text-stone-400 mt-0.5">{apt.categoryName}</span>
                    </td>

                    {/* الأخصائي */}
                    <td className="py-4 px-6 text-stone-700 font-medium">
                      {apt.staffName}
                    </td>

                    {/* الموعد */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-stone-800">{apt.appointmentDate}</div>
                      <div className="text-xs text-stone-400 mt-0.5">{apt.time}</div>
                    </td>

                    {/* السعر */}
                    <td className="py-4 px-6 font-bold text-stone-800">
                      {apt.finalPrice} <span className="text-xs font-normal text-stone-500">ج.م</span>
                    </td>

                    {/* الحالة */}
                    <td className="py-4 px-6">
                      {getStatusBadge(apt.status)}
                    </td>

                    {/* إجراءات سريعة */}
                    <td className="py-4 px-6 text-left">
                      <div className="inline-flex items-center gap-1.5">
                        {/* زر الدفع والفاتورة */}
                        <button
                          onClick={() => onOpenCheckoutModal(apt)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                            apt.status === 'مكتمل'
                              ? 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
                          }`}
                          title="الدفع وإصدار الفاتورة"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{apt.status === 'مكتمل' ? 'عرض الفاتورة' : 'دفع / فاتورة'}</span>
                        </button>

                        {apt.status === 'قيد الانتظار' && (
                          <button
                            onClick={() => onUpdateStatus(apt.id, 'مؤكد')}
                            className="px-2 py-1 text-xs font-medium rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            تأكيد
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteAppointment(apt.id)}
                          className="p-1 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="حذف الحجز"
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
