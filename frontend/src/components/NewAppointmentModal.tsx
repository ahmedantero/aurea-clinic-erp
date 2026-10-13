import React, { useState, useEffect } from 'react';
import { X, Check, Calculator, AlertCircle, Layers } from 'lucide-react';
import { 
  Appointment, 
  ServiceItem, 
  PackageItem, 
  StaffItem, 
  ClientItem, 
  AppointmentStatus 
} from '../types';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAppointment: (appointment: Appointment) => void;
  services: ServiceItem[];
  packages: PackageItem[];
  staffList: StaffItem[];
  clientsList: ClientItem[];
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onAddAppointment,
  services,
  packages,
  staffList,
  clientsList,
}) => {
  // Client selection: 'existing' or 'new'
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // 1. Cascading Dropdown States: Category & Service
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // Specialist, Date, Time, Status
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [appointmentTime, setAppointmentTime] = useState<string>('11:00 صباحاً');
  const [status, setStatus] = useState<AppointmentStatus>('مؤكد');

  // Auto price calculation
  const [priceNote, setPriceNote] = useState<string>('يرجى اختيار التصنيف والخدمة لعرض السعر وحسابه تلقائياً');
  const [finalPrice, setFinalPrice] = useState<string>('');

  // Loading & error feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Distinct categories from services + packages category
  const baseCategories = Array.from(new Set(services.map((s) => s.category).filter(Boolean)));
  const availableCategories = packages.length > 0 
    ? [...baseCategories, 'عروض وباكدجات متكاملة']
    : baseCategories;

  // Filtered services based on selected category
  const isPackageCategory = selectedCategory === 'عروض وباكدجات متكاملة';
  const filteredServices = isPackageCategory
    ? []
    : services.filter((s) => s.category === selectedCategory);
  const filteredPackages = isPackageCategory ? packages : [];

  // Initialize defaults on modal open or data load
  useEffect(() => {
    if (staffList.length > 0 && !selectedStaffId) {
      setSelectedStaffId(staffList[0].id);
    }
    if (clientsList.length > 0 && !selectedClientId) {
      setSelectedClientId(clientsList[0].id);
    }
  }, [staffList, clientsList]);

  // Reset or recalculate price when selected service/package changes
  useEffect(() => {
    if (!selectedCategory || !selectedServiceId) {
      setFinalPrice('');
      setPriceNote('يرجى اختيار التصنيف والخدمة أولاً لعرض السعر وحسابه تلقائياً');
      return;
    }

    if (isPackageCategory) {
      const pkg = packages.find((p) => p.id === selectedServiceId);
      if (pkg) {
        if (pkg.fixedPrice) {
          setFinalPrice(pkg.fixedPrice.toString());
          setPriceNote(`سعر الباكدج الشامل: ${pkg.fixedPrice} ج.م`);
        } else if (pkg.discountPercentage) {
          const estimated = Math.round(500 * (1 - pkg.discountPercentage / 100));
          setFinalPrice(estimated.toString());
          setPriceNote(`خصم العرض: ${pkg.discountPercentage}% (سعر تقديري: ${estimated} ج.م)`);
        }
      }
    } else {
      const srv = services.find((s) => s.id === selectedServiceId);
      if (srv) {
        setFinalPrice(srv.minPrice.toString());
        if (srv.maxPrice) {
          setPriceNote(`نطاق سعر الجلسة: من ${srv.minPrice} إلى ${srv.maxPrice} ج.م`);
        } else {
          setPriceNote(`السعر المعتمد للجلسة: ${srv.minPrice} ج.م`);
        }
      }
    }
  }, [selectedCategory, selectedServiceId, isPackageCategory, services, packages]);

  if (!isOpen) return null;

  const currentClient = clientsList.find((c) => c.id === selectedClientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (clientMode === 'new') {
      if (!newClientName.trim() || !newClientPhone.trim()) {
        setErrorMsg('يرجى كتابة اسم العميل ورقم الهاتف بالكامل');
        return;
      }
    } else {
      if (!selectedClientId) {
        setErrorMsg('يرجى اختيار عميل من القائمة أو تسجيل عميل جديد');
        return;
      }
    }

    if (!selectedCategory) {
      setErrorMsg('يرجى اختيار التصنيف / القسم أولاً');
      return;
    }

    if (!selectedServiceId) {
      setErrorMsg('يرجى اختيار الخدمة المطلوبة من القائمة');
      return;
    }

    const price = parseFloat(finalPrice);
    if (isNaN(price) || price < 0) {
      setErrorMsg('يرجى تحديد سعر صالح للجلسة');
      return;
    }

    // Resolve service or package item
    const srv = !isPackageCategory
      ? services.find((s) => s.id === selectedServiceId)
      : null;
    const pkg = isPackageCategory
      ? packages.find((p) => p.id === selectedServiceId)
      : null;
    const staff = staffList.find((st) => st.id === selectedStaffId) || staffList[0];

    const serviceName = srv ? srv.name : `باكدج: ${pkg?.name}`;
    const categoryName = srv ? srv.category : 'باكدجات وعروض';

    setIsSubmitting(true);

    try {
      // Send to Backend API connected to PostgreSQL
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientMode === 'existing' ? selectedClientId : null,
          newClientName: clientMode === 'new' ? newClientName : null,
          newClientPhone: clientMode === 'new' ? newClientPhone : null,
          staffId: staff?.id,
          serviceId: srv?.id || services[0]?.id,
          appointmentDate,
          time: appointmentTime,
          status,
          finalPrice: price,
        }),
      });

      if (!response.ok) {
        throw new Error('تعذر الحفظ في قاعدة البيانات');
      }

      const savedAppointment = await response.json();

      // Update schedule state
      onAddAppointment(savedAppointment);
      onClose();

      // Reset form
      setNewClientName('');
      setNewClientPhone('');
      setSelectedCategory('');
      setSelectedServiceId('');
      setFinalPrice('');
    } catch (err: any) {
      console.warn('API error, saving locally:', err);
      // Fallback local update
      const fallbackApt: Appointment = {
        id: `apt-${Date.now().toString().slice(-4)}`,
        clientName: clientMode === 'existing' ? (currentClient?.name || 'عميل مسجل') : newClientName,
        clientPhone: clientMode === 'existing' ? (currentClient?.phone || '') : newClientPhone,
        staffName: staff?.name || 'الأخصائي',
        serviceName,
        categoryName,
        appointmentDate,
        time: appointmentTime,
        status,
        finalPrice: price,
      };

      onAddAppointment(fallbackApt);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-stone-800">إضافة حجز جديد</h3>
            <p className="text-xs text-stone-400 mt-0.5">تسجيل موعد في جدول العيادة وقاعدة البيانات</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-right overflow-y-auto flex-1">
          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Client Selection (Existing vs New) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">بيانات العميل</label>
              <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setClientMode('existing')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    clientMode === 'existing'
                      ? 'bg-white text-stone-800 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  عميل مسجل
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('new')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    clientMode === 'new'
                      ? 'bg-white text-stone-800 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  عميل جديد +
                </button>
              </div>
            </div>

            {clientMode === 'existing' ? (
              <div>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800"
                >
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone} ({c.loyaltyPoints} نقطة ولاء)
                    </option>
                  ))}
                </select>
                {currentClient && (
                  <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                    <span>ملاحظات سابقة:</span>
                    <span className="text-stone-600">{currentClient.medicalHistory || 'لا توجد ملاحظات'}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="الاسم بالكامل..."
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600"
                />
                <input
                  type="tel"
                  placeholder="رقم الهاتف (01xxxxxxxxx)..."
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  dir="ltr"
                  className="px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-right"
                />
              </div>
            )}
          </div>

          {/* 2. CASCADING STEP 1: Category Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>1. التصنيف / القسم (Category)</span>
              </label>
              {selectedCategory && (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {isPackageCategory 
                    ? `${filteredPackages.length} باكدجات متاحة`
                    : `${filteredServices.length} خدمات متاحة`
                  }
                </span>
              )}
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const cat = e.target.value;
                setSelectedCategory(cat);
                setSelectedServiceId(''); // Reset cascading service
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800"
            >
              <option value="">-- اختر التصنيف أو القسم أولاً --</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 3. CASCADING STEP 2: Filtered Service Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">
              2. الخدمة أو الجلسة (Service)
            </label>
            <select
              value={selectedServiceId}
              disabled={!selectedCategory}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all ${
                !selectedCategory
                  ? 'bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-white border-stone-200 text-stone-800 focus:outline-hidden focus:border-emerald-600'
              }`}
            >
              {!selectedCategory ? (
                <option value="">يرجى اختيار التصنيف أولاً لفتح قائمة الخدمات...</option>
              ) : isPackageCategory ? (
                <>
                  <option value="">-- اختر الباكدج أو العرض --</option>
                  {filteredPackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} {pkg.fixedPrice ? `• (${pkg.fixedPrice} ج.م)` : `• (خصم ${pkg.discountPercentage}%)`}
                    </option>
                  ))}
                </>
              ) : (
                <>
                  <option value="">-- اختر الخدمة من قسم ({selectedCategory}) --</option>
                  {filteredServices.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} • {srv.durationMinutes} دقيقة — (تبدأ من {srv.minPrice} ج.م)
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* 4. Specialist (Staff) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              الأخصائي المعالج
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800"
            >
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.specialty})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                تاريخ الحجز
              </label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                الوقت المفضل
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600"
              >
                <option value="10:00 صباحاً">10:00 صباحاً</option>
                <option value="11:30 صباحاً">11:30 صباحاً</option>
                <option value="01:00 ظهراً">01:00 ظهراً</option>
                <option value="02:30 عصراً">02:30 عصراً</option>
                <option value="04:00 مساءً">04:00 مساءً</option>
                <option value="05:30 مساءً">05:30 مساءً</option>
                <option value="07:00 مساءً">07:00 مساءً</option>
              </select>
            </div>
          </div>

          {/* 6. Auto Price Calculation Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">حساب السعر التلقائي</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{priceNote}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="0"
                step="25"
                required
                placeholder="0"
                disabled={!selectedServiceId}
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                className="w-24 px-2 py-1 text-base font-bold text-stone-800 rounded-lg border border-emerald-200 bg-white text-center focus:outline-hidden focus:ring-1 focus:ring-emerald-600 disabled:bg-stone-100 disabled:text-stone-400"
              />
              <span className="text-xs font-semibold text-emerald-900">ج.م</span>
            </div>
          </div>

          {/* 7. Status Selector */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-stone-600">حالة الحجز المبدئية:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus('مؤكد')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  status === 'مؤكد'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                مؤكد
              </button>
              <button
                type="button"
                onClick={() => setStatus('قيد الانتظار')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  status === 'قيد الانتظار'
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                قيد الانتظار
              </button>
            </div>
          </div>

          {/* 8. Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-xl text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedServiceId}
              className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>جاري الحفظ في قاعدة البيانات...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>تأكيد وحفظ الحجز</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
