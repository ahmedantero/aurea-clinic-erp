import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Calculator,
  AlertCircle,
  Package as PackageIcon,
  Repeat,
  FolderKanban,
  User,
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Boxes,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Appointment,
  ServiceItem,
  PackageItem,
  StaffItem,
  ClientItem,
  CategoryItem,
  AppointmentStatus,
  InventoryItemType,
} from '../types';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAppointment: (appointment: Appointment) => void;
  services: ServiceItem[];
  categories?: CategoryItem[];
  packages: PackageItem[];
  staffList: StaffItem[];
  clientsList: ClientItem[];
  inventoryItems?: InventoryItemType[];
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onAddAppointment,
  services,
  categories = [],
  packages,
  staffList,
  clientsList,
  inventoryItems = [],
}) => {
  // ── Step 1: Client ────────────────────────────────────────────────────────────
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // ── Step 2: Category ──────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // ── Step 3: Item selection (composite: "service_<id>" or "package_<id>") ───────
  const [selectedItemCompositeId, setSelectedItemCompositeId] = useState<string>('');

  // ── Step 4 & 5: Specialist / Date / Time / Status ─────────────────────────────
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [appointmentTime, setAppointmentTime] = useState<string>('11:00 صباحاً');
  const [status, setStatus] = useState<AppointmentStatus>('مؤكد');

  // ── UI feedback ──────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // ── Auto-select first staff on mount if not set ─────────────────────────────
  useEffect(() => {
    if (staffList.length > 0 && !selectedStaffId) {
      setSelectedStaffId(staffList[0].id);
    }
  }, [staffList, selectedStaffId]);

  // ── Compute available categories ─────────────────────────────────────────────
  const availableCategories = useMemo(() => {
    const catMap = new Map<string, string>(); // name -> display label

    // 1. From passed CategoryItem[]
    categories.forEach((c) => {
      if (c.name && c.name.trim()) {
        catMap.set(c.name.trim(), c.name.trim());
      }
    });

    // 2. From services
    services.forEach((s) => {
      if (s.category && s.category.trim()) {
        catMap.set(s.category.trim(), s.category.trim());
      }
    });

    // If still empty, fallbacks
    if (catMap.size === 0) {
      ['علاج طبيعي', 'حجامة', 'عناية بالبشرة', 'مساج'].forEach((name) =>
        catMap.set(name, name)
      );
    }

    const result = Array.from(catMap.keys());

    // Add Offers & Packages category if packages exist or as a dedicated section
    if (!result.includes('عروض وباقات')) {
      result.push('عروض وباقات');
    }

    return result;
  }, [categories, services]);

  // Auto-select first category if none selected
  useEffect(() => {
    if (!selectedCategory && availableCategories.length > 0) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [availableCategories, selectedCategory]);

  // Is the current category package-based?
  const isPackageCategory = useMemo(() => {
    const norm = (selectedCategory || '').trim().toLowerCase();
    return norm === 'عروض وباقات' || norm.includes('عروض') || norm.includes('باقات');
  }, [selectedCategory]);

  // ── Filtered items strictly based on Step 2 (Category) ────────────────────────
  const filteredServices = useMemo(() => {
    if (isPackageCategory) return [];
    return services.filter(
      (s) => (s.category || '').trim() === (selectedCategory || '').trim()
    );
  }, [services, selectedCategory, isPackageCategory]);

  const filteredPackages = useMemo(() => {
    if (isPackageCategory) return packages;
    return [];
  }, [packages, isPackageCategory]);

  // Reset selected item when category changes
  const handleCategoryChange = (newCat: string) => {
    setSelectedCategory(newCat);
    setSelectedItemCompositeId('');
    setErrorMsg('');
  };

  // ── Derived: parse composite ID ───────────────────────────────────────────────
  const itemType = useMemo(() => {
    if (!selectedItemCompositeId) return null;
    const idx = selectedItemCompositeId.indexOf('_');
    if (idx === -1) return null;
    return selectedItemCompositeId.slice(0, idx) as 'service' | 'package';
  }, [selectedItemCompositeId]);

  const itemRawId = useMemo(() => {
    if (!selectedItemCompositeId) return '';
    const idx = selectedItemCompositeId.indexOf('_');
    if (idx === -1) return '';
    return selectedItemCompositeId.slice(idx + 1);
  }, [selectedItemCompositeId]);

  const selectedServiceItem = useMemo(
    () => (itemType === 'service' ? services.find((s) => s.id === itemRawId) || null : null),
    [itemType, itemRawId, services]
  );

  const selectedPackageItem = useMemo(
    () => (itemType === 'package' ? packages.find((p) => p.id === itemRawId) || null : null),
    [itemType, itemRawId, packages]
  );

  // ── Derived: current client & their active packages ───────────────────────────
  const currentClient = useMemo(
    () => clientsList.find((c) => c.id === selectedClientId) || null,
    [clientsList, selectedClientId]
  );

  // ── Auto-detect matching active package (Scenario B Deduction) ─────────────────
  const matchingActivePackage = useMemo(() => {
    if (!currentClient || clientMode !== 'existing') return null;
    const activeClientPkgs = (currentClient.clientPackages || []).filter(
      (cp) => cp.status === 'ACTIVE' && cp.usedSessions < cp.totalSessions
    );
    if (!activeClientPkgs.length) return null;

    if (itemType === 'package' && itemRawId) {
      return (
        activeClientPkgs.find(
          (cp) =>
            cp.packageId === itemRawId ||
            (selectedPackageItem && cp.packageName === selectedPackageItem.name)
        ) || null
      );
    }
    if (
      itemType === 'service' &&
      itemRawId &&
      selectedServiceItem &&
      (selectedServiceItem.sessionsCount || 1) > 1
    ) {
      return (
        activeClientPkgs.find(
          (cp) =>
            cp.serviceId === itemRawId ||
            (selectedServiceItem && cp.packageName?.includes(selectedServiceItem.name))
        ) || null
      );
    }
    return null;
  }, [currentClient, clientMode, itemType, itemRawId, selectedServiceItem, selectedPackageItem]);

  // ── Derived: display price note ────────────────────────────────────────────────
  const { displayPrice, priceNote } = useMemo(() => {
    if (matchingActivePackage) {
      return {
        displayPrice: '0',
        priceNote: `جلسة مسبقة الدفع ضمن الباقة النشطة — 0 ج.م`,
      };
    }
    if (!selectedItemCompositeId) {
      return { displayPrice: '', priceNote: 'اختر الخدمة أو الباقة لعرض السعر تلقائياً' };
    }
    if (selectedServiceItem) {
      const note = selectedServiceItem.maxPrice
        ? `نطاق السعر: ${selectedServiceItem.minPrice} – ${selectedServiceItem.maxPrice} ج.م`
        : `السعر المعتمد: ${selectedServiceItem.minPrice} ج.م`;
      return { displayPrice: selectedServiceItem.minPrice.toString(), priceNote: note };
    }
    if (selectedPackageItem) {
      const price = selectedPackageItem.fixedPrice ?? 0;
      const note = selectedPackageItem.fixedPrice
        ? `سعر الباقة الشاملة: ${price} ج.م`
        : `خصم الباقة: ${selectedPackageItem.discountPercentage ?? 0}%`;
      return { displayPrice: price.toString(), priceNote: note };
    }
    return { displayPrice: '', priceNote: 'اختر الخدمة أو الباقة لعرض السعر تلقائياً' };
  }, [matchingActivePackage, selectedItemCompositeId, selectedServiceItem, selectedPackageItem]);

  // ── Step: Consumables (Add-ons charged to client) ───────────────────────────
  const [selectedConsumables, setSelectedConsumables] = useState<
    Array<{ productId: string; quantity: number }>
  >([]);
  const [selectedAddonId, setSelectedAddonId] = useState<string>('');
  const [addonQty, setAddonQty] = useState<number>(1);
  const [isAddonExpanded, setIsAddonExpanded] = useState<boolean>(false);

  const consumablesTotal = useMemo(() => {
    return selectedConsumables.reduce((sum, item) => {
      const prod = inventoryItems.find((p) => p.id === item.productId);
      const unitPrice = prod?.sellingPrice ?? prod?.unitCost ?? 0;
      return sum + unitPrice * item.quantity;
    }, 0);
  }, [selectedConsumables, inventoryItems]);

  const handleAddConsumable = () => {
    if (!selectedAddonId) return;
    const qty = Math.max(1, addonQty);
    setSelectedConsumables((prev) => {
      const existing = prev.find((c) => c.productId === selectedAddonId);
      if (existing) {
        return prev.map((c) =>
          c.productId === selectedAddonId ? { ...c, quantity: c.quantity + qty } : c
        );
      }
      return [...prev, { productId: selectedAddonId, quantity: qty }];
    });
    setSelectedAddonId('');
    setAddonQty(1);
  };

  const handleRemoveConsumable = (prodId: string) => {
    setSelectedConsumables((prev) => prev.filter((c) => c.productId !== prodId));
  };

  const handleUpdateConsumableQty = (prodId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveConsumable(prodId);
    } else {
      setSelectedConsumables((prev) =>
        prev.map((c) => (c.productId === prodId ? { ...c, quantity: newQty } : c))
      );
    }
  };

  // ── Editable price (user may override) ────────────────────────────────────────
  const [finalPrice, setFinalPrice] = useState<string>('');
  useEffect(() => {
    if (displayPrice === '') {
      setFinalPrice(consumablesTotal > 0 ? consumablesTotal.toString() : '');
    } else {
      const base = Number(displayPrice) || 0;
      setFinalPrice((base + consumablesTotal).toString());
    }
  }, [displayPrice, consumablesTotal]);

  // ── Derived: selected staff & doctor commission strictly on base price ───────
  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === selectedStaffId) || staffList[0] || null,
    [staffList, selectedStaffId]
  );

  const baseSessionPrice = useMemo(() => {
    return Number(displayPrice) || 0;
  }, [displayPrice]);

  const estimatedDoctorCommission = useMemo(() => {
    if (!selectedStaff) return 0;
    const isPercentage =
      !selectedStaff.commissionType ||
      selectedStaff.commissionType === 'نسبة' ||
      selectedStaff.commissionType.includes('%');
    const commVal = Number(selectedStaff.commissionValue) || 0;
    if (isPercentage) {
      return Math.round(((baseSessionPrice * commVal) / 100) * 100) / 100;
    }
    return baseSessionPrice;
  }, [selectedStaff, baseSessionPrice]);

  // Reset item & price when client changes
  useEffect(() => {
    setSelectedItemCompositeId('');
    setErrorMsg('');
  }, [selectedClientId, clientMode]);

  // ── Comprehensive Form State Reset ──────────────────────────────────────────
  const resetForm = () => {
    setClientMode('existing');
    setSelectedClientId('');
    setNewClientName('');
    setNewClientPhone('');
    setSelectedCategory(availableCategories[0] || '');
    setSelectedItemCompositeId('');
    setSelectedStaffId(staffList[0]?.id || '');
    setAppointmentDate(new Date().toISOString().split('T')[0]);
    setAppointmentTime('11:00 صباحاً');
    setStatus('مؤكد');
    setSelectedConsumables([]);
    setSelectedAddonId('');
    setAddonQty(1);
    setIsAddonExpanded(false);
    setFinalPrice('');
    setErrorMsg('');
    setIsSubmitting(false);
  };

  // Reset all state whenever the modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // ── Submit ─────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSubmitting) return;
    setErrorMsg('');

    // Step 1 validation
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

    // Step 2 & 3 validation
    if (!selectedCategory) {
      setErrorMsg('يرجى تحديد القسم / التصنيف');
      return;
    }
    if (!selectedItemCompositeId || !itemType || !itemRawId) {
      setErrorMsg('يرجى اختيار الخدمة أو الباقة المطلوبة من القائمة');
      return;
    }

    setIsSubmitting(true);

    try {
      const isPkg = isPackageCategory || itemType === 'package';
      const cleanPackageId = isPkg ? itemRawId : null;
      const cleanServiceId = !isPkg ? itemRawId : null;

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          clientId: clientMode === 'existing' ? selectedClientId : null,
          clientName: clientMode === 'existing' ? currentClient?.name : null,
          clientPhone: clientMode === 'existing' ? currentClient?.phone : null,
          newClientName: clientMode === 'new' ? newClientName.trim() : null,
          newClientPhone: clientMode === 'new' ? newClientPhone.trim() : null,
          staffId: selectedStaffId || staffList[0]?.id || null,
          categoryName: selectedCategory || (isPkg ? 'عروض وباقات' : 'عام'),
          // Strict explicit fields
          packageId: cleanPackageId,
          serviceId: cleanServiceId,
          itemType: isPkg ? 'package' : 'service',
          itemId: itemRawId,
          itemCompositeId: selectedItemCompositeId,
          appointmentDate,
          time: appointmentTime,
          status,
          finalPrice: Number(finalPrice) || 0,
          consumables: selectedConsumables,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || 'تعذر الحفظ في قاعدة البيانات');
      }

      const savedAppointment = await response.json();
      onAddAppointment(savedAppointment);

      // Clean browser history state to prevent reload prompt on hard refresh
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      // Complete reset and close
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع، يرجى المحاولة مجدداً');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>إضافة حجز جديد</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              تسجيل موعد في جدول العيادة وقاعدة البيانات وفق التدفق المنظم
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form 
          method="dialog"
          action="#"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(e);
          }} 
          className="p-6 space-y-4 text-right overflow-y-auto flex-1"
        >
          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── STEP 1: Client Selection ─────────────────────────────────────────── */}
          <div className="space-y-1.5 p-3.5 bg-stone-50/60 rounded-2xl border border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>الخطوة ١: بيانات العميل</span>
              </label>
              <div className="flex items-center bg-stone-200/60 p-0.5 rounded-lg text-xs">
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
              <div className="pt-1.5">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800"
                >
                  <option value="">-- اختر العميل من القائمة --</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone} ({c.loyaltyPoints} نقطة ولاء)
                    </option>
                  ))}
                </select>
                {currentClient?.medicalHistory && (
                  <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                    <span>ملاحظات:</span>
                    <span className="text-stone-600">{currentClient.medicalHistory}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1.5">
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

          {/* ── STEP 2: Category Selection ───────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-emerald-700" />
              <span>الخطوة ٢: اختيار القسم / التصنيف</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 font-medium"
            >
              <option value="">-- اختر التصنيف لتصفية الخدمات --</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'عروض وباقات' ? '🎁 عروض وباقات متكاملة' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* ── STEP 3: Item Selection (Strictly filtered by Step 2 Category) ─────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <PackageIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>الخطوة ٣: الخدمة أو الباقة المطلوبة</span>
            </label>
            <select
              value={selectedItemCompositeId}
              disabled={!selectedCategory}
              onChange={(e) => setSelectedItemCompositeId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 disabled:bg-stone-100 disabled:text-stone-400"
            >
              <option value="">
                {!selectedCategory
                  ? '-- يرجى اختيار القسم أولاً --'
                  : isPackageCategory
                  ? '-- اختر الباقة أو العرض المطلوب --'
                  : `-- اختر الخدمة من قسم (${selectedCategory}) --`}
              </option>

              {/* When category is Offers & Packages */}
              {isPackageCategory &&
                filteredPackages.map((pkg) => (
                  <option key={`package_${pkg.id}`} value={`package_${pkg.id}`}>
                    {pkg.name}
                    {(pkg.sessionsCount || 1) > 1 ? ` (${pkg.sessionsCount} جلسات)` : ''}
                    {pkg.fixedPrice != null
                      ? ` • (${pkg.fixedPrice} ج.م)`
                      : pkg.discountPercentage
                      ? ` • (خصم ${pkg.discountPercentage}%)`
                      : ''}
                  </option>
                ))}

              {/* When category is a service category */}
              {!isPackageCategory &&
                filteredServices.map((srv) => (
                  <option key={`service_${srv.id}`} value={`service_${srv.id}`}>
                    {srv.name}
                    {(srv.sessionsCount || 1) > 1 ? ` (${srv.sessionsCount} جلسات)` : ''}
                    {' '}• {srv.durationMinutes} دقيقة — ({srv.minPrice} ج.م)
                  </option>
                ))}
            </select>

            {/* Empty state note if no services exist in chosen category */}
            {selectedCategory && !isPackageCategory && filteredServices.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                لا توجد خدمات مسجلة تحت هذا القسم حالياً، يمكنك إضافة خدمات من إعدادات الخدمات.
              </p>
            )}

            {/* Scenario B Auto-detection Badge */}
            {matchingActivePackage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <Repeat className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  سيتم الخصم تلقائياً من الباقة النشطة —{' '}
                  <strong>{matchingActivePackage.packageName}</strong>{' '}
                  (المستخدم: {matchingActivePackage.usedSessions}/{matchingActivePackage.totalSessions}) • السعر: <strong>0 ج.م</strong>
                </span>
              </div>
            )}
          </div>

          {/* ── STEP 4: Specialist ─────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">الأخصائي المعالج</label>
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

          {/* ── STEP 5: Date & Time ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>تاريخ الحجز</span>
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
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span>الوقت المفضل</span>
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600"
              >
                <option value="10:00 صباحاً">10:00 صباحاً</option>
                <option value="11:00 صباحاً">11:00 صباحاً</option>
                <option value="11:30 صباحاً">11:30 صباحاً</option>
                <option value="01:00 ظهراً">01:00 ظهراً</option>
                <option value="02:30 عصراً">02:30 عصراً</option>
                <option value="04:00 مساءً">04:00 مساءً</option>
                <option value="05:30 مساءً">05:30 مساءً</option>
                <option value="07:00 مساءً">07:00 مساءً</option>
              </select>
            </div>
          </div>

          {/* ── Optional Consumable Add-ons Section ───────────────────────────── */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAddonExpanded(!isAddonExpanded)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-right hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-stone-800">
                  مستهلكات إضافية أثناء الجلسة (اختياري)
                </span>
                {selectedConsumables.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {selectedConsumables.length} أصناف (+{consumablesTotal} ج.م)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-500 font-medium">
                <span>{isAddonExpanded ? 'إخفاء' : 'إضافة مستهلكات'}</span>
                {isAddonExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isAddonExpanded && (
              <div className="p-3.5 pt-1 border-t border-stone-200/60 space-y-3">
                {/* Add product row */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedAddonId}
                    onChange={(e) => setSelectedAddonId(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600"
                  >
                    <option value="">-- اختر مستهلك من المخزن --</option>
                    {inventoryItems.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (السعر: {prod.sellingPrice ?? prod.unitCost ?? 0} ج.م | متاح: {prod.quantityInStock} {prod.unitType})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min="1"
                      value={addonQty}
                      onChange={(e) => setAddonQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-14 px-2 py-1.5 text-xs text-center rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600"
                      placeholder="الكمية"
                    />
                    <button
                      type="button"
                      onClick={handleAddConsumable}
                      disabled={!selectedAddonId}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة</span>
                    </button>
                  </div>
                </div>

                {/* Selected Consumables List */}
                {selectedConsumables.length > 0 && (
                  <div className="divide-y divide-stone-200/70 border border-stone-200 rounded-xl bg-white overflow-hidden max-h-36 overflow-y-auto">
                    {selectedConsumables.map((item) => {
                      const prod = inventoryItems.find((p) => p.id === item.productId);
                      const unitP = prod?.sellingPrice ?? prod?.unitCost ?? 0;
                      const lineTotal = unitP * item.quantity;
                      return (
                        <div key={item.productId} className="px-3 py-2 flex items-center justify-between text-xs">
                          <div className="flex-1">
                            <span className="font-semibold text-stone-800">{prod?.name || 'مستهلك'}</span>
                            <span className="text-[11px] text-stone-500 mr-2">
                              ({unitP} ج.م × {item.quantity} {prod?.unitType || 'قطعة'})
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-emerald-800">{lineTotal} ج.م</span>
                            <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                              <button
                                type="button"
                                onClick={() => handleUpdateConsumableQty(item.productId, item.quantity - 1)}
                                className="px-2 py-0.5 hover:bg-stone-200 text-stone-700 font-bold"
                              >
                                -
                              </button>
                              <span className="px-2 py-0.5 font-semibold text-stone-800">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateConsumableQty(item.productId, item.quantity + 1)}
                                className="px-2 py-0.5 hover:bg-stone-200 text-stone-700 font-bold"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveConsumable(item.productId)}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Price Card (auto-calculated / override) ────────────────────────── */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  حساب السعر التلقائي {consumablesTotal > 0 && `(شامل ${consumablesTotal} ج.م مستهلكات)`}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {priceNote}
                  {consumablesTotal > 0 && ` + ${consumablesTotal} ج.م مستهلكات إضافية`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="0"
                step="25"
                placeholder="0"
                disabled={!selectedItemCompositeId || (!!matchingActivePackage && consumablesTotal === 0)}
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                className="w-24 px-2 py-1 text-base font-bold text-stone-800 rounded-lg border border-emerald-200 bg-white text-center focus:outline-hidden focus:ring-1 focus:ring-emerald-600 disabled:bg-stone-100 disabled:text-stone-400"
              />
              <span className="text-xs font-semibold text-emerald-900">ج.م</span>
            </div>
          </div>

          {/* ── Doctor Commission & Revenue Breakdown Card ────────────────────── */}
          {selectedStaff && selectedItemCompositeId && (
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>عمولة الأخصائي ({selectedStaff.name}):</span>
                </span>
                <span className="text-amber-800 text-sm font-black">
                  {estimatedDoctorCommission} ج.م
                  {(!selectedStaff.commissionType || selectedStaff.commissionType === 'نسبة' || selectedStaff.commissionType.includes('%')) && (
                    <span className="text-[11px] font-semibold text-amber-700 mr-1">
                      ({selectedStaff.commissionValue || 0}% من سعر الجلسة الأساسي فقط)
                    </span>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                * ملاحظة مالية: تُحسب العمولة حصرياً على سعر الجلسة الأساسي ({baseSessionPrice} ج.م). مستهلكات ومبيعات المخزن (+{consumablesTotal} ج.م) مستبعدة تماماً من عمولة الطبيب وتدخل بنسبة 100% في إيرادات العيادة.
              </p>
            </div>
          )}

          {/* ── Initial Status ─────────────────────────────────────────────────── */}
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

          {/* ── Actions ────────────────────────────────────────────────────────── */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-xl text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedItemCompositeId}
              className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none flex items-center gap-2"
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
