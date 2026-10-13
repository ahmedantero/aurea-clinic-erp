import React, { useState } from 'react';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  Percent, 
  Building2, 
  RotateCcw, 
  X, 
  Check, 
  User, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { StaffItem } from '../types';

interface StaffManagementViewProps {
  staffList: StaffItem[];
  onRefreshStaff: () => void;
  onAddStaff: (newStaff: StaffItem) => void;
  onUpdateStaff: (updatedStaff: StaffItem) => void;
  onDeleteStaff: (id: string) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staffList,
  onRefreshStaff,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState<'all' | 'percentage' | 'fixed'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('علاج طبيعي');
  const [formPhone, setFormPhone] = useState('');
  const [formContractType, setFormContractType] = useState<'نسبة' | 'ثابت'>('نسبة');
  const [formCommissionValue, setFormCommissionValue] = useState<string>('30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Specialties presets
  const popularSpecialties = ['علاج طبيعي', 'عناية بالبشرة', 'سبا وتدليك', 'طب الأسنان', 'حجامة وتأهيل'];

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingStaffId(null);
    setFormName('');
    setFormSpecialty('علاج طبيعي');
    setFormPhone('');
    setFormContractType('نسبة');
    setFormCommissionValue('30');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (staff: StaffItem) => {
    setEditingStaffId(staff.id);
    setFormName(staff.name);
    setFormSpecialty(staff.specialty);
    setFormPhone(staff.phone || '');
    const isFixed = staff.commissionType === 'ثابت' || staff.commissionType?.includes('إيجار');
    setFormContractType(isFixed ? 'ثابت' : 'نسبة');
    setFormCommissionValue((staff.commissionValue ?? (isFixed ? 3000 : 30)).toString());
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSpecialty.trim()) {
      setErrorMessage('يرجى إدخال اسم الأخصائي والتخصص');
      return;
    }

    const commVal = parseFloat(formCommissionValue);
    if (isNaN(commVal) || commVal < 0) {
      setErrorMessage('يرجى إدخال قيمة تعاقد صحيحة');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name: formName.trim(),
      specialty: formSpecialty.trim(),
      phone: formPhone.trim() || null,
      commissionType: formContractType,
      commissionValue: commVal,
    };

    try {
      if (editingStaffId) {
        // UPDATE existing specialist
        const res = await fetch(`/api/staff/${editingStaffId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل تحديث بيانات الأخصائي');
        }

        const updated = await res.json();
        onUpdateStaff(updated);
      } else {
        // CREATE new specialist
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل إضافة الأخصائي في قاعدة البيانات');
        }

        const created = await res.json();
        onAddStaff(created);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.warn('API error during staff save:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (staff: StaffItem) => {
    if (!confirm(`هل أنت متأكد من حذف الأخصائي "${staff.name}" نهائياً من النظام؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'لا يمكن حذف هذا الأخصائي لوجود حجوزات أو سجلات مرتبطة به.');
        return;
      }

      onDeleteStaff(staff.id);
    } catch (err: any) {
      console.warn('Error deleting staff:', err);
      alert('تعذر حذف الأخصائي، يرجى المحاولة لاحقاً');
    }
  };

  // Filtered List
  const filteredStaff = staffList.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone && item.phone.includes(searchTerm));

    const isFixed = item.commissionType === 'ثابت' || item.commissionType?.includes('إيجار');
    const matchesContract = 
      contractFilter === 'all'
        ? true
        : contractFilter === 'percentage'
        ? !isFixed
        : isFixed;

    return matchesSearch && matchesContract;
  });

  // KPI Metrics
  const totalCount = staffList.length;
  const percentageCount = staffList.filter(
    (s) => s.commissionType !== 'ثابت' && !s.commissionType?.includes('إيجار')
  ).length;
  const fixedCount = totalCount - percentageCount;
  const uniqueSpecialties = Array.from(new Set(staffList.map((s) => s.specialty))).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">إدارة المتخصصين والأطباء</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            إضافة وتعديل بيانات الكادر الطبي، نسب العمولات، ونظام التعاقد
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshStaff}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="تحديث القائمة من قاعدة البيانات"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أخصائي جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">إجمالي الكادر</p>
            <h3 className="text-2xl font-bold text-stone-800 mt-1">{totalCount}</h3>
            <p className="text-xs text-stone-400 mt-0.5">أطباء وأخصائيين مسجلين</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600">
            <User className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">نظام النسبة المئوية (%)</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{percentageCount}</h3>
            <p className="text-xs text-stone-400 mt-0.5">حصة من إيراد الجلسات</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">نظام الإيجار / الراتب</p>
            <h3 className="text-2xl font-bold text-blue-700 mt-1">{fixedCount}</h3>
            <p className="text-xs text-stone-400 mt-0.5">إيجار أو أتعاب ثابتة</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">التخصصات المتاحة</p>
            <h3 className="text-2xl font-bold text-stone-800 mt-1">{uniqueSpecialties}</h3>
            <p className="text-xs text-stone-400 mt-0.5">أقسام العيادة والسبا</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، التخصص، أو الهاتف..."
            className="w-full pr-10 pl-4 py-2 text-sm rounded-xl border border-stone-200/80 bg-stone-50/50 focus:bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 placeholder-stone-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setContractFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              contractFilter === 'all'
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60'
            }`}
          >
            الكل ({totalCount})
          </button>
          <button
            onClick={() => setContractFilter('percentage')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              contractFilter === 'percentage'
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60'
            }`}
          >
            نسبة مئوية ({percentageCount})
          </button>
          <button
            onClick={() => setContractFilter('fixed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              contractFilter === 'fixed'
                ? 'bg-blue-700 text-white'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60'
            }`}
          >
            إيجار / ثابت ({fixedCount})
          </button>
        </div>
      </div>

      {/* Main Staff Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-stone-50/70 border-b border-stone-200/80 text-xs font-semibold text-stone-600">
                <th className="py-3.5 px-6">الاسم (Name)</th>
                <th className="py-3.5 px-6">التخصص (Specialty)</th>
                <th className="py-3.5 px-6">رقم الهاتف (Phone)</th>
                <th className="py-3.5 px-6">نوع التعاقد (Contract Type)</th>
                <th className="py-3.5 px-6">قيمة التعاقد (Value)</th>
                <th className="py-3.5 px-6 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <Stethoscope className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                    <p className="font-medium text-stone-600">لا يوجد أخصائيين مسجلين</p>
                    <p className="text-xs mt-1">اضغط على زر "إضافة أخصائي جديد" لإدخال الكادر الطبي.</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((st) => {
                  const isFixed = st.commissionType === 'ثابت' || st.commissionType?.includes('إيجار');
                  return (
                    <tr key={st.id} className="hover:bg-stone-50/50 transition-colors">
                      {/* الاسم */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100 shrink-0">
                            {st.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-stone-800">{st.name}</div>
                            <div className="text-[11px] text-stone-400">معرّف: {st.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>

                      {/* التخصص */}
                      <td className="py-4 px-6">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium">
                          {st.specialty}
                        </span>
                      </td>

                      {/* رقم الهاتف */}
                      <td className="py-4 px-6">
                        {st.phone ? (
                          <span className="font-mono text-xs text-stone-700 flex items-center gap-1.5" dir="ltr">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {st.phone}
                          </span>
                        ) : (
                          <span className="text-stone-300 text-xs italic">غير مسجل</span>
                        )}
                      </td>

                      {/* نوع التعاقد */}
                      <td className="py-4 px-6">
                        {!isFixed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                            <Percent className="w-3 h-3 text-emerald-600" />
                            <span>نسبة مئوية %</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            <span>إيجار / راتب ثابت</span>
                          </span>
                        )}
                      </td>

                      {/* قيمة التعاقد */}
                      <td className="py-4 px-6 font-bold text-stone-800">
                        {!isFixed ? (
                          <span className="text-emerald-700 font-extrabold">
                            {st.commissionValue ?? 30}%
                          </span>
                        ) : (
                          <span className="text-blue-700 font-extrabold">
                            {(st.commissionValue ?? 0).toLocaleString()} <span className="text-xs font-normal text-stone-500">ج.م</span>
                          </span>
                        )}
                      </td>

                      {/* الإجراءات */}
                      <td className="py-4 px-6 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(st)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                            title="تعديل البيانات"
                          >
                            <Edit3 className="w-4 h-4 text-stone-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(st)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="حذف الأخصائي"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Specialist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-base">
                    {editingStaffId ? 'تعديل بيانات الأخصائي' : 'إضافة أخصائي / طبيب جديد'}
                  </h3>
                  <p className="text-xs text-stone-400">إدارة تفاصيل الكادر ونظام استحقاق العمولات</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-right">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  الاسم بالكامل (Specialist Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: د. مروان الكردي"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800"
                />
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  التخصص الطبي / المهني (Specialty) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: علاج طبيعي، سبا وتدليك، عناية بالبشرة..."
                  value={formSpecialty}
                  onChange={(e) => setFormSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800"
                />
                {/* Specialty quick select chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                  <span className="text-[10px] text-stone-400">تخصصات شائعة:</span>
                  {popularSpecialties.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setFormSpecialty(spec)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] transition-colors cursor-pointer ${
                        formSpecialty === spec
                          ? 'bg-emerald-100 text-emerald-800 font-bold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  رقم الهاتف (Phone)
                </label>
                <input
                  type="tel"
                  placeholder="مثال: 01012345678"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-mono"
                  dir="ltr"
                />
              </div>

              {/* Contract Type & Commission Value Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Contract Type Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    نوع التعاقد (Contract Type) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formContractType}
                    onChange={(e) => {
                      const val = e.target.value as 'نسبة' | 'ثابت';
                      setFormContractType(val);
                      // Default values helper
                      if (val === 'نسبة' && parseFloat(formCommissionValue) > 100) {
                        setFormCommissionValue('30');
                      } else if (val === 'ثابت' && parseFloat(formCommissionValue) < 100) {
                        setFormCommissionValue('3000');
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 font-medium"
                  >
                    <option value="نسبة">نسبة مئوية (%)</option>
                    <option value="ثابت">إيجار أو راتب ثابت</option>
                  </select>
                </div>

                {/* Commission Value Input */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {formContractType === 'نسبة' ? 'نسبة العمولة (%)' : 'المبلغ الثابت (ج.م)'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={formContractType === 'نسبة' ? '1' : '100'}
                      max={formContractType === 'نسبة' ? '100' : undefined}
                      required
                      placeholder={formContractType === 'نسبة' ? '30' : '3000'}
                      value={formCommissionValue}
                      onChange={(e) => setFormCommissionValue(e.target.value)}
                      className="w-full pr-3.5 pl-8 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 font-bold"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      {formContractType === 'نسبة' ? '%' : 'ج.م'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informative Helper Card */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-xs text-stone-500">
                {formContractType === 'نسبة' ? (
                  <p>
                    💡 <strong>نظام النسبة:</strong> سيحصل الأخصائي تلقائياً على نسبة{' '}
                    <strong className="text-emerald-700">{formCommissionValue || 0}%</strong> من إجمالي دخل كل جلسة مكتملة، والباقي للمركز.
                  </p>
                ) : (
                  <p>
                    💡 <strong>نظام الإيجار / الثابت:</strong> يحصل المركز على قيمة الإيجار الثابتة (
                    <strong className="text-blue-700">{formCommissionValue || 0} ج.م</strong>)، ويتم تسوية أرباح الجلسات للمتخصص بعد استقطاعها.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingStaffId ? 'حفظ التعديلات' : 'إضافة الأخصائي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
