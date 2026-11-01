import React, { useState, useEffect, useMemo } from 'react';
import Select, { StylesConfig } from 'react-select';
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
  Banknote,
  Wallet,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Printer,
  Percent,
  Search,
  Receipt,
  CreditCard,
} from 'lucide-react';

const QUICK_TIME_SLOTS = [
  { label: '10:00 ص', value: '10:00' },
  { label: '11:30 ص', value: '11:30' },
  { label: '01:00 م', value: '13:00' },
  { label: '02:30 م', value: '14:30' },
  { label: '04:00 م', value: '16:00' },
  { label: '05:30 م', value: '17:30' },
  { label: '07:00 م', value: '19:00' },
  { label: '08:30 م', value: '20:30' },
];
import { AnimatedStepper, StepItem } from './ui/AnimatedStepper';
import {
  Appointment,
  ServiceItem,
  PackageItem,
  StaffItem,
  ClientItem,
  CategoryItem,
  AppointmentStatus,
  InventoryItemType,
  PaymentMethodType,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { printReceipt } from '../utils/printReceipt';
import { generateInvoiceImageBase64 } from '../utils/generateInvoicePdf';
import { dispatchWhatsAppInvoice } from '../utils/whatsappHelper';

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

// ── Zero-Grey Luminous Warm Cream & Glass Emerald React-Select Styling ─────────
const customSelectStyles: StylesConfig<any, false> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: '#ffffff',
    borderColor: state.isFocused ? '#059669' : 'rgba(16, 185, 129, 0.3)',
    borderRadius: '0.85rem',
    padding: '2px 4px',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : 'none',
    '&:hover': {
      borderColor: '#059669',
    },
    fontSize: '0.875rem',
    minHeight: '42px',
    direction: 'rtl',
    cursor: 'pointer',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    boxShadow: '0 16px 36px -6px rgba(15, 59, 44, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 999999,
    overflow: 'hidden',
    padding: '6px',
    direction: 'rtl',
  }),
  menuPortal: (base) => ({ ...base, zIndex: 999999 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'rgba(16, 185, 129, 0.12)'
      : state.isFocused
      ? 'rgba(16, 185, 129, 0.06)'
      : 'transparent',
    color: state.isSelected ? '#065f46' : '#1c1917',
    borderRadius: '0.6rem',
    margin: '2px 0',
    padding: '8px 12px',
    fontSize: '0.825rem',
    fontWeight: state.isSelected ? '700' : 'normal',
    borderRight: state.isSelected ? '4px solid #059669' : '4px solid transparent',
    cursor: 'pointer',
    textAlign: 'right',
    '&:active': {
      backgroundColor: 'rgba(16, 185, 129, 0.18)',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1c1917',
    fontWeight: '700',
    textAlign: 'right',
    fontSize: '0.875rem',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#6b7280',
    textAlign: 'right',
    fontSize: '0.825rem',
  }),
  input: (base) => ({
    ...base,
    textAlign: 'right',
    direction: 'rtl',
  }),
};

export interface SelectedBookingService {
  compositeId: string;
  type: 'service' | 'package';
  rawId: string;
  name: string;
  price: number;
  durationMinutes: number;
  categoryName: string;
  sessionsCount?: number;
  isPackageSession?: boolean;
  clientPackageId?: string | null;
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
  const { user, getAuthHeaders } = useAuth();

  // ── Step State: Strict 1-based indexing (1 -> 2 -> 3) ─────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [slideDirection, setSlideDirection] = useState<number>(1);

  const steps: StepItem[] = [
    { id: 1, title: 'العميل', subtitle: 'البيانات الأساسية', icon: User },
    { id: 2, title: 'تفاصيل الحجز', subtitle: 'الخدمة والأخصائي', icon: FolderKanban },
    { id: 3, title: 'تأكيد ودفع', subtitle: 'الحساب والفاتورة', icon: Banknote },
  ];

  // ── Step 1: Client ────────────────────────────────────────────────────────────
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // ── Step 2: Category, Specialist, Service / Package ───────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItemCompositeId, setSelectedItemCompositeId] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<SelectedBookingService[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [serviceSearchTerm, setServiceSearchTerm] = useState<string>('');

  // ── Timing & Status ───────────────────────────────────────────────────────────
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [appointmentTime, setAppointmentTime] = useState<string>('11:00 صباحاً');
  const [status, setStatus] = useState<AppointmentStatus>('مؤكد');

  // ── Step 3: Add-ons, Final Price & Payment ─────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [isAddonExpanded, setIsAddonExpanded] = useState(false);
  const [selectedConsumables, setSelectedConsumables] = useState<
    Array<{
      productId: string;
      quantity: number;
      isBilledToClient: boolean;
    }>
  >([]);
  const [selectedAddonId, setSelectedAddonId] = useState<string>('');
  const [addonQty, setAddonQty] = useState<number>(1);
  const [finalPrice, setFinalPrice] = useState<string>('');
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // ── UI feedback ──────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (staffList.length > 0 && !selectedStaffId) {
      setSelectedStaffId(staffList[0].id);
    }
  }, [staffList, selectedStaffId]);

  const availableCategories = useMemo(() => {
    const catMap = new Map<string, string>();
    categories.forEach((c) => {
      const name = c.name?.trim();
      if (name && !name.match(/(test|تجارب|تجرب|1792|1793|تكامل)/i)) {
        catMap.set(name, name);
      }
    });
    services.forEach((s) => {
      const name = s.category?.trim();
      if (name && !name.match(/(test|تجارب|تجرب|1792|1793|تكامل)/i)) {
        catMap.set(name, name);
      }
    });
    if (catMap.size === 0) {
      ['علاج طبيعي', 'حجامة', 'عناية بالبشرة', 'سبا وتدليك', 'أسنان', 'عناية بالشعر'].forEach((n) => catMap.set(n, n));
    }
    const result = Array.from(catMap.keys());
    if (!result.includes('عروض وباقات')) result.push('عروض وباقات');
    return result;
  }, [categories, services]);

  useEffect(() => {
    if (!selectedCategory && availableCategories.length > 0) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [availableCategories, selectedCategory]);

  const isPackageCategory = useMemo(() => {
    const norm = (selectedCategory || '').trim().toLowerCase();
    return norm === 'عروض وباقات' || norm.includes('عروض') || norm.includes('باقات');
  }, [selectedCategory]);

  const filteredServices = useMemo(() => {
    if (isPackageCategory) return [];
    return services.filter((s) => (s.category || '').trim() === (selectedCategory || '').trim());
  }, [services, selectedCategory, isPackageCategory]);

  const filteredPackages = useMemo(() => {
    if (isPackageCategory) return packages;
    return [];
  }, [packages, isPackageCategory]);

  const handleCategoryChange = (newCat: string) => {
    setSelectedCategory(newCat);
    setServiceSearchTerm('');
    setErrorMsg('');
  };

  const handleServiceSelect = (compositeId: string) => {
    setErrorMsg('');
    const existingIndex = selectedServices.findIndex((s) => s.compositeId === compositeId);
    if (existingIndex > -1) {
      // Toggle off / unselect
      setSelectedServices((prev) => prev.filter((s) => s.compositeId !== compositeId));
      return;
    }

    setSelectedItemCompositeId(compositeId);
    const idx = compositeId.indexOf('_');
    if (idx === -1) return;
    const type = compositeId.slice(0, idx) as 'service' | 'package';
    const rawId = compositeId.slice(idx + 1);

    if (type === 'service') {
      const srv = services.find((s) => s.id === rawId);
      if (!srv) return;

      let effectivePrice = srv.minPrice ?? 0;
      let isPkgSession = false;
      let matchedClientPkgId = null;

      if (currentClient && clientMode === 'existing') {
        const activeClientPkgs = (currentClient.clientPackages || []).filter(
          (cp) => cp.status === 'ACTIVE' && cp.usedSessions < cp.totalSessions
        );
        const match = activeClientPkgs.find((cp) => {
          if (cp.serviceId === srv.id) return true;
          const pkgDef = packages.find((p) => p.id === cp.packageId);
          return pkgDef && pkgDef.name === srv.name;
        });
        if (match) {
          effectivePrice = 0;
          isPkgSession = true;
          matchedClientPkgId = match.id;
        }
      }

      setSelectedServices((prev) => [
        ...prev,
        {
          compositeId,
          type: 'service',
          rawId: srv.id,
          name: srv.name,
          price: effectivePrice,
          durationMinutes: srv.durationMinutes || 45,
          categoryName: srv.category || selectedCategory || 'عام',
          sessionsCount: srv.sessionsCount || 1,
          isPackageSession: isPkgSession,
          clientPackageId: matchedClientPkgId,
        },
      ]);
    } else if (type === 'package') {
      const pkg = packages.find((p) => p.id === rawId);
      if (!pkg) return;

      let effectivePrice = pkg.fixedPrice ?? 0;
      let isPkgSession = false;
      let matchedClientPkgId = null;

      if (currentClient && clientMode === 'existing') {
        const activeClientPkgs = (currentClient.clientPackages || []).filter(
          (cp) => cp.status === 'ACTIVE' && cp.usedSessions < cp.totalSessions
        );
        const match = activeClientPkgs.find((cp) => cp.packageId === pkg.id);
        if (match) {
          effectivePrice = 0;
          isPkgSession = true;
          matchedClientPkgId = match.id;
        }
      }

      setSelectedServices((prev) => [
        ...prev,
        {
          compositeId,
          type: 'package',
          rawId: pkg.id,
          name: pkg.name,
          price: effectivePrice,
          durationMinutes: 60,
          categoryName: 'عروض وباقات',
          sessionsCount: pkg.sessionsCount || 1,
          isPackageSession: isPkgSession,
          clientPackageId: matchedClientPkgId,
        },
      ]);
    }
  };

  const handleRemoveService = (compositeId: string) => {
    setSelectedServices((prev) => prev.filter((s) => s.compositeId !== compositeId));
  };

  const displayedServices = useMemo(() => {
    if (isPackageCategory) return [];
    if (!serviceSearchTerm.trim()) return filteredServices;
    const q = serviceSearchTerm.trim().toLowerCase();
    return filteredServices.filter((s) => s.name.toLowerCase().includes(q));
  }, [filteredServices, serviceSearchTerm, isPackageCategory]);

  const displayedPackages = useMemo(() => {
    if (!isPackageCategory) return [];
    if (!serviceSearchTerm.trim()) return filteredPackages;
    const q = serviceSearchTerm.trim().toLowerCase();
    return filteredPackages.filter((p) => p.name.toLowerCase().includes(q));
  }, [filteredPackages, serviceSearchTerm, isPackageCategory]);

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

  const serviceDuration = useMemo(() => {
    if (selectedServiceItem) return selectedServiceItem.durationMinutes;
    if (selectedPackageItem) return selectedPackageItem.durationMinutes || 60;
    return 45;
  }, [selectedServiceItem, selectedPackageItem]);

  const currentClient = useMemo(
    () => clientsList.find((c) => c.id === selectedClientId) || null,
    [clientsList, selectedClientId]
  );

  const matchingActivePackage = useMemo(() => {
    if (!currentClient || clientMode !== 'existing') return null;
    const activeClientPkgs = (currentClient.clientPackages || []).filter(
      (cp) => cp.status === 'ACTIVE' && cp.usedSessions < cp.totalSessions
    );
    if (!activeClientPkgs.length) return null;

    if (itemType === 'package' && itemRawId) {
      return activeClientPkgs.find((cp) => cp.packageId === itemRawId) || null;
    }
    if (itemType === 'service' && selectedServiceItem) {
      return (
        activeClientPkgs.find((cp) => {
          if (cp.serviceId === selectedServiceItem.id) return true;
          const pkgDef = packages.find((p) => p.id === cp.packageId);
          return pkgDef && pkgDef.name === selectedServiceItem.name;
        }) || null
      );
    }
    return null;
  }, [currentClient, clientMode, itemType, itemRawId, selectedServiceItem, packages]);

  const { displayPrice, priceNote } = useMemo(() => {
    if (!selectedItemCompositeId) return { displayPrice: '', priceNote: '' };
    if (matchingActivePackage) {
      const remaining = matchingActivePackage.totalSessions - matchingActivePackage.usedSessions;
      return {
        displayPrice: '0',
        priceNote: `خصم من الباقة النشطة (${matchingActivePackage.packageName}) — متبقي ${remaining} جلسة`,
      };
    }
    if (itemType === 'package' && selectedPackageItem) {
      return {
        displayPrice: (selectedPackageItem.fixedPrice ?? 0).toString(),
        priceNote: `سعر الباقة الإجمالي (${selectedPackageItem.sessionsCount || 1} جلسات)`,
      };
    }
    if (itemType === 'service' && selectedServiceItem) {
      return {
        displayPrice: (selectedServiceItem.minPrice ?? 0).toString(),
        priceNote: `سعر الجلسة المعتمد (${selectedServiceItem.durationMinutes} دقيقة)`,
      };
    }
    return { displayPrice: '', priceNote: '' };
  }, [selectedItemCompositeId, matchingActivePackage, itemType, selectedPackageItem, selectedServiceItem]);

  const getProductPricing = (prod?: InventoryItemType | null) => {
    if (!prod) return { sellingPrice: 0, costPrice: 0 };
    const sellingPrice = (prod as any).sellingPrice ?? (prod as any).unitPrice ?? prod.unitCost ?? 0;
    const costPrice = prod.unitCost ?? 0;
    return { sellingPrice: Number(sellingPrice) || 0, costPrice: Number(costPrice) || 0 };
  };

  const consumablesTotal = useMemo(() => {
    return selectedConsumables.reduce((sum, item) => {
      if (!item.isBilledToClient) return sum;
      const prod = inventoryItems.find((p) => p.id === item.productId);
      const { sellingPrice } = getProductPricing(prod);
      return sum + sellingPrice * item.quantity;
    }, 0);
  }, [selectedConsumables, inventoryItems]);

  const handleAddConsumable = () => {
    if (!selectedAddonId) return;
    const existingIndex = selectedConsumables.findIndex((c) => c.productId === selectedAddonId);
    if (existingIndex > -1) {
      setSelectedConsumables((prev) =>
        prev.map((c, i) => (i === existingIndex ? { ...c, quantity: c.quantity + addonQty } : c))
      );
    } else {
      setSelectedConsumables((prev) => [
        ...prev,
        { productId: selectedAddonId, quantity: addonQty, isBilledToClient: true },
      ]);
    }
    setSelectedAddonId('');
    setAddonQty(1);
  };

  const handleToggleConsumableBilled = (prodId: string, isBilled: boolean) => {
    setSelectedConsumables((prev) =>
      prev.map((c) => (c.productId === prodId ? { ...c, isBilledToClient: isBilled } : c))
    );
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

  const servicesBaseTotal = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const totalDurationMinutes = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedServices]);

  const baseSessionPrice = servicesBaseTotal;

  const grossTotal = useMemo(() => {
    return servicesBaseTotal + consumablesTotal;
  }, [servicesBaseTotal, consumablesTotal]);

  const discountAmount = useMemo(() => {
    if (discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      return Math.round(((grossTotal * Math.min(100, discountValue)) / 100) * 100) / 100;
    }
    return Math.min(grossTotal, discountValue);
  }, [grossTotal, discountType, discountValue]);

  const netTotal = useMemo(() => Math.max(0, grossTotal - discountAmount), [grossTotal, discountAmount]);

  useEffect(() => {
    if (selectedServices.length === 0 && consumablesTotal === 0) {
      setFinalPrice('');
    } else {
      setFinalPrice(netTotal.toString());
    }
  }, [netTotal, selectedServices, consumablesTotal]);

  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === selectedStaffId) || staffList[0] || null,
    [staffList, selectedStaffId]
  );

  const estimatedDoctorCommission = useMemo(() => {
    if (!selectedStaff || selectedServices.length === 0) return 0;
    const isPercentage =
      !selectedStaff.commissionType ||
      selectedStaff.commissionType === 'نسبة' ||
      selectedStaff.commissionType.includes('%');
    const commVal = Number(selectedStaff.commissionValue) || 0;
    if (isPercentage) {
      return Math.round(((servicesBaseTotal * commVal) / 100) * 100) / 100;
    }
    return servicesBaseTotal;
  }, [selectedStaff, servicesBaseTotal, selectedServices]);

  useEffect(() => {
    setSelectedItemCompositeId('');
    setErrorMsg('');
  }, [selectedClientId, clientMode]);

  // Options Preparation
  const clientOptions = useMemo(
    () => clientsList.map((c) => ({
      value: c.id,
      label: `${c.name} — ${c.phone} (${c.loyaltyPoints || 0} نقطة ولاء)`,
    })),
    [clientsList]
  );

  const categoryOptions = useMemo(
    () => availableCategories.map((cat) => ({
      value: cat,
      label: cat === 'عروض وباقات' ? '🎁 عروض وباقات متكاملة' : cat,
    })),
    [availableCategories]
  );

  const staffOptions = useMemo(
    () => staffList.map((st) => ({
      value: st.id,
      label: `${st.name} (${st.specialty || 'أخصائي'})`,
    })),
    [staffList]
  );

  const itemOptions = useMemo(() => {
    if (isPackageCategory) {
      return filteredPackages.map((pkg) => ({
        value: `package_${pkg.id}`,
        label: `${pkg.name}${(pkg.sessionsCount || 1) > 1 ? ` (${pkg.sessionsCount} جلسات)` : ''}${
          pkg.fixedPrice != null ? ` • (${pkg.fixedPrice} ج.م)` : pkg.discountPercentage ? ` • (خصم ${pkg.discountPercentage}%)` : ''
        }`,
      }));
    }
    return filteredServices.map((srv) => ({
      value: `service_${srv.id}`,
      label: `${srv.name}${(srv.sessionsCount || 1) > 1 ? ` (${srv.sessionsCount} جلسات)` : ''} • ${srv.durationMinutes} دقيقة — (${srv.minPrice} ج.م)`,
    }));
  }, [isPackageCategory, filteredPackages, filteredServices]);

  const consumableOptions = useMemo(
    () => inventoryItems.map((prod) => {
      const { sellingPrice } = getProductPricing(prod);
      return {
        value: prod.id,
        label: `${prod.name} (السعر: ${sellingPrice} ج.م | متاح: ${prod.quantityInStock} ${prod.unitType || 'قطعة'})`,
      };
    }),
    [inventoryItems]
  );

  // ── Step Navigation & Validation Logic (Guarantees Step 1 -> 2 -> 3) ─────────
  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg('');

    if (step === 1) {
      if (clientMode === 'new') {
        if (!newClientName.trim() || !newClientPhone.trim()) {
          setErrorMsg('يرجى إدخال اسم العميل ورقم هاتفه للمتابعة إلى الخطوة التالية');
          return;
        }
      } else {
        if (!selectedClientId) {
          setErrorMsg('يرجى اختيار عميل مسجل من القائمة للمتابعة إلى الخطوة التالية');
          return;
        }
      }
      setSlideDirection(1);
      setStep(2);
    } else if (step === 2) {
      if (!selectedCategory) {
        setErrorMsg('يرجى تحديد القسم / التصنيف أولاً');
        return;
      }
      if (selectedServices.length === 0) {
        setErrorMsg('يرجى اختيار خدمة أو باقة واحدة على الأقل للمتابعة إلى الخطوة التالية');
        return;
      }
      setSlideDirection(1);
      setStep(3);
    }
  };

  const handlePrevStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg('');
    setSlideDirection(-1);
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  // ── Comprehensive Reset ──────────────────────────────────────────────────────
  const resetForm = () => {
    setStep(1);
    setSlideDirection(1);
    setClientMode('existing');
    setSelectedClientId('');
    setNewClientName('');
    setNewClientPhone('');
    setSelectedCategory(availableCategories[0] || '');
    setSelectedItemCompositeId('');
    setSelectedServices([]);
    setSelectedStaffId(staffList[0]?.id || '');
    setAppointmentDate(new Date().toISOString().split('T')[0]);
    setAppointmentTime('11:00 صباحاً');
    setStatus('مؤكد');
    setPaymentMethod('CASH');
    setSelectedConsumables([]);
    setSelectedAddonId('');
    setAddonQty(1);
    setIsAddonExpanded(false);
    setFinalPrice('');
    setDiscountType('amount');
    setDiscountValue(0);
    setNotes('');
    setErrorMsg('');
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // ── Submit Handler (Callable ONLY from Step 3 with Isolated Print) ───────────
  const handleSubmit = async (options?: { printInvoice?: boolean }) => {
    const shouldPrint = options?.printInvoice ?? false;
    if (isSubmitting) return;
    setErrorMsg('');

    if (clientMode === 'new' && (!newClientName.trim() || !newClientPhone.trim())) {
      setErrorMsg('يرجى كتابة اسم العميل ورقم الهاتف');
      return;
    }
    if (clientMode === 'existing' && !selectedClientId) {
      setErrorMsg('يرجى اختيار عميل من القائمة أو تسجيل عميل جديد');
      return;
    }
    if (selectedServices.length === 0) {
      setErrorMsg('يرجى اختيار خدمة أو باقة واحدة على الأقل من اللوحة');
      return;
    }

    setIsSubmitting(true);

    try {

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        cache: 'no-store',
        body: JSON.stringify({
          clientId: clientMode === 'existing' ? selectedClientId : null,
          clientName: clientMode === 'existing' ? currentClient?.name : null,
          clientPhone: clientMode === 'existing' ? currentClient?.phone : null,
          newClientName: clientMode === 'new' ? newClientName.trim() : null,
          newClientPhone: clientMode === 'new' ? newClientPhone.trim() : null,
          staffId: selectedStaffId || staffList[0]?.id || null,
          services: selectedServices.map((s) => ({
            serviceId: s.type === 'service' ? s.rawId : null,
            packageId: s.type === 'package' ? s.rawId : null,
            itemType: s.type,
            itemId: s.rawId,
            itemCompositeId: s.compositeId,
            name: s.name,
            price: s.price,
            durationMinutes: s.durationMinutes,
            staffId: selectedStaffId,
          })),
          appointmentDate,
          time: appointmentTime,
          status,
          paymentMethod,
          notes: notes.trim() || undefined,
          finalPrice: Number(finalPrice) || 0,
          totalAmount: grossTotal,
          discountApplied: discountAmount,
          discountType,
          discountValue,
          netAmount: Number(finalPrice) || 0,
          consumables: selectedConsumables.map((c) => ({
            productId: c.productId,
            quantity: c.quantity,
            isBilledToClient: c.isBilledToClient,
          })),
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || 'تعذر الحفظ في قاعدة البيانات');
      }

      const savedAppointment = await response.json();
      const populatedAppointment = {
        ...savedAppointment,
        createdBy: savedAppointment.createdBy || (user ? {
          id: user.id,
          name: user.name || user.username,
          username: user.username,
        } : null),
      };

      onAddAppointment(populatedAppointment);

      // Automatically send official invoice image via WhatsApp
      const clientObj = clientMode === 'existing' ? currentClient : { name: newClientName, phone: newClientPhone };
      const rawTargetPhone = (clientObj?.phone || savedAppointment.clientPhone || '').trim();
      const invNum = savedAppointment.invoice?.invoiceNumber || (savedAppointment.id ? `AUR-${savedAppointment.id.slice(0, 8).toUpperCase()}` : `AUR-${Math.floor(100000 + Math.random() * 900000)}`);
      const combinedServiceName = selectedServices.map((s) => s.name).join(' + ');
      const combinedCategoryName = Array.from(new Set(selectedServices.map((s) => s.categoryName))).join(' / ');
      const staffObj = selectedStaff;

      if (rawTargetPhone) {
        dispatchWhatsAppInvoice({
          invoiceNumber: invNum,
          clientName: clientObj?.name || 'عميل مسجل',
          clientPhone: rawTargetPhone,
          serviceName: combinedServiceName || 'جلسة علاجية / سبا',
          categoryName: combinedCategoryName || selectedCategory,
          packageName: selectedServices.find((s) => s.type === 'package')?.name,
          staffName: staffObj?.name || 'الكادر الطبي المختص',
          appointmentDate,
          time: appointmentTime,
          basePrice: baseSessionPrice,
          totalAmount: grossTotal,
          discountApplied: discountAmount,
          discountType,
          discountValue,
          finalPrice: Number(finalPrice) || 0,
          paymentMethod,
          consumables: selectedConsumables.map((c) => {
            const p = inventoryItems.find((i) => i.id === c.productId);
            return {
              name: p?.name,
              quantity: c.quantity,
              price: c.isBilledToClient ? getProductPricing(p).sellingPrice * c.quantity : 0,
            };
          }),
        }).catch((err) => console.error('Auto send invoice error:', err));
      }

      // Isolated Print: Target ONLY the appointment invoice via invisible iframe!
      if (shouldPrint) {
        await printReceipt({
          invoiceNumber: invNum,
          clientName: clientObj?.name || 'عميل مسجل',
          clientPhone: rawTargetPhone || '—',
          serviceName: combinedServiceName || 'جلسة علاجية / سبا',
          categoryName: combinedCategoryName || selectedCategory,
          packageName: selectedServices.find((s) => s.type === 'package')?.name,
          staffName: staffObj?.name || 'الكادر الطبي المختص',
          appointmentDate,
          time: appointmentTime,
          basePrice: servicesBaseTotal,
          totalAmount: grossTotal,
          discountApplied: discountAmount,
          discountType,
          discountValue,
          finalPrice: Number(finalPrice) || 0,
          paymentMethod,
          items: selectedServices.map((s) => ({
            name: s.name,
            price: s.price,
            durationMinutes: s.durationMinutes,
            categoryName: s.categoryName,
            staffName: staffObj?.name,
          })),
          consumables: selectedConsumables.map((c) => {
            const p = inventoryItems.find((i) => i.id === c.productId);
            return {
              name: p?.name,
              quantity: c.quantity,
              price: c.isBilledToClient ? getProductPricing(p).sellingPrice * c.quantity : 0,
            };
          }),
          createdByName: user?.name || user?.username,
        });
      }

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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      {/* ── Split-Screen Master-Detail Hub Modal Window ───────── */}
      <div
        className="w-full max-w-6xl xl:max-w-7xl h-[92vh] max-h-[92vh] bg-gradient-to-b from-[#fdfcf9] via-white to-[#f9f7f2] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 backdrop-blur-2xl shadow-2xl shadow-emerald-950/25 border border-stone-200/90 dark:border-white/10 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/25 shadow-xs">
              <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#0f3b2c] dark:text-emerald-200 leading-tight">
                  أوريا كلينيك & سبا
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                  لوحة الحجز المباشر • LIVE FOLIO
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                تحديد العميل، الخدمة، والتسعير المباشر مع الفاتورة اللحظية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{appointmentDate}</span>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{appointmentTime}</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          
          {/* ══════════════════════════════════════════════════════════════════════
              RIGHT CANVAS: Master Booking Controls (7 Cols on LG/XL)
              ══════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-l border-stone-200/80 dark:border-stone-800">
            <div className="flex-1 overflow-y-auto silk-scrollbar p-4 sm:p-5 space-y-4">
              
              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between backdrop-blur-md animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-bold">{errorMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="text-rose-700 hover:text-rose-900 cursor-pointer text-xs font-bold"
                  >
                    إغلاق
                  </button>
                </div>
              )}

              {/* ── CARD 1: بيانات العميل وتوقيت الحجز ── */}
              <div className="p-4 bg-white/80 dark:bg-stone-850/60 backdrop-blur-xl rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-3.5 shadow-xs">
                {/* Client Header & Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/25">
                      <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-black text-stone-900 dark:text-stone-100">بيانات العميل والموعد</span>
                  </div>
                  <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200/80 dark:border-stone-700 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setClientMode('existing');
                        setErrorMsg('');
                      }}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        clientMode === 'existing'
                          ? 'bg-white dark:bg-stone-700 text-[#0f3b2c] dark:text-emerald-200 shadow-xs'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                      }`}
                    >
                      عميل مسجل
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClientMode('new');
                        setSelectedClientId('');
                        setErrorMsg('');
                      }}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        clientMode === 'new'
                          ? 'bg-white dark:bg-stone-700 text-[#0f3b2c] dark:text-emerald-200 shadow-xs'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                      }`}
                    >
                      + عميل جديد
                    </button>
                  </div>
                </div>

                {/* Client Input */}
                {clientMode === 'existing' ? (
                  <div>
                    <Select
                      value={clientOptions.find((opt) => opt.value === selectedClientId) || null}
                      onChange={(selected) => setSelectedClientId(selected ? selected.value : '')}
                      options={clientOptions}
                      placeholder="-- ابحث باسم العميل أو رقم الهاتف --"
                      isSearchable={true}
                      isRtl={true}
                      isClearable={true}
                      menuPlacement="auto"
                      maxMenuHeight={220}
                      styles={customSelectStyles}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      noOptionsMessage={() => 'لا يوجد عملاء مطابقين للبحث'}
                    />
                    {currentClient && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#0f3b2c] dark:text-emerald-200">{currentClient.name}</span>
                          <span className="text-stone-500 dark:text-stone-400 text-[11px]">({currentClient.phone})</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                            🌟 {currentClient.loyaltyPoints || 0} نقطة ولاء
                          </span>
                        </div>
                        {currentClient.medicalHistory && (
                          <div className="text-[11px] text-amber-900 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                            ⚠️ {currentClient.medicalHistory}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                        اسم العميل <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="مثال: نورهان السيد"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                        رقم الهاتف / الواتساب <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="مثال: 01012345678"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                )}

                {/* Date & Time Slot Controls */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تاريخ الحجز</span>
                      </label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-center font-bold"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>التوقيت المفضل</span>
                        </label>
                        {/* Status Toggle */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setStatus('مؤكد')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                              status === 'مؤكد'
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                            }`}
                          >
                            مؤكد
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatus('قيد الانتظار')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                              status === 'قيد الانتظار'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                            }`}
                          >
                            انتظار
                          </button>
                        </div>
                      </div>
                      <input
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-center font-bold"
                      />
                    </div>
                  </div>

                  {/* Quick Slot Pills */}
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block mb-1">فترات المواعيد السريعة:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TIME_SLOTS.map((slot) => {
                        const isCurrent = appointmentTime === slot.value;
                        return (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => setAppointmentTime(slot.value)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                              isCurrent
                                ? 'bg-[#0f3b2c] text-white border-[#0f3b2c] shadow-xs scale-102'
                                : 'bg-white/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border-stone-200/70 dark:border-stone-700 hover:border-emerald-500/40 hover:bg-emerald-50/40'
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CARD 2: القسم / التخصص الطبي ── */}
              <div className="p-4 bg-white/80 dark:bg-stone-850/60 backdrop-blur-xl rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/25">
                      <FolderKanban className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-black text-stone-900 dark:text-stone-100">القسم / التخصص الطبي</span>
                  </div>
                  {selectedCategory && (
                    <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200 bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                      {selectedCategory}
                    </span>
                  )}
                </div>

                {/* Category Pills Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {availableCategories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const isPkg = cat === 'عروض وباقات' || cat.includes('باقات');
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border text-center ${
                          isSelected
                            ? 'bg-[#0f3b2c] text-[#fbf8ee] border-[#0f3b2c] shadow-md shadow-emerald-950/20 ring-2 ring-emerald-500/25 scale-[1.02]'
                            : 'bg-white/90 dark:bg-stone-850/90 text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-700 hover:border-emerald-500/40 hover:bg-emerald-50/50'
                        }`}
                      >
                        <span className="text-sm">
                          {isPkg ? '🎁' : cat.includes('أسنان') ? '🦷' : cat.includes('حجامة') ? '🪡' : cat.includes('سبا') || cat.includes('مساج') ? '💆‍♀️' : cat.includes('بشرة') ? '✨' : cat.includes('شعر') ? '💇‍♀️' : cat.includes('علاج طبيعي') ? '🩺' : '🏷️'}
                        </span>
                        <span className="truncate">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── CARD 3: اختيار الخدمة أو الباقة (Interactive Visual Cards) ── */}
              <div className="p-4 bg-white/80 dark:bg-stone-850/60 backdrop-blur-xl rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/25">
                      <PackageIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                        {isPackageCategory ? 'العروض والباقات المتاحة' : `خدمات قسم (${selectedCategory})`}
                      </span>
                      <span className="text-[10px] text-stone-400 mr-1.5 font-normal">
                        ({isPackageCategory ? displayedPackages.length : displayedServices.length} متاحة)
                      </span>
                    </div>
                  </div>

                  {/* Real-time Quick Search Input */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={serviceSearchTerm}
                      onChange={(e) => setServiceSearchTerm(e.target.value)}
                      placeholder="ابحث باسم الخدمة أو السعر..."
                      className="w-full pl-6 pr-8 py-1.5 text-xs rounded-xl border border-stone-200/80 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                    {serviceSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setServiceSearchTerm('')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="max-h-60 overflow-y-auto silk-scrollbar pr-0.5">
                  {isPackageCategory ? (
                    displayedPackages.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-500 bg-stone-50/50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
                        لا توجد باقات تطابق بحثك حالياً
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {displayedPackages.map((pkg) => {
                          const compositeId = `package_${pkg.id}`;
                          const isSelected = selectedServices.some((s) => s.compositeId === compositeId);
                          const pkgPrice = pkg.fixedPrice != null ? pkg.fixedPrice : 0;
                          return (
                            <div
                              key={pkg.id}
                              onClick={() => handleServiceSelect(compositeId)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer relative text-right flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-gradient-to-br from-emerald-50/90 to-emerald-100/60 dark:from-emerald-950/60 dark:to-emerald-900/40 border-emerald-600/70 shadow-md ring-2 ring-emerald-500/30'
                                  : 'bg-white/90 dark:bg-stone-850/90 border-stone-200/70 dark:border-stone-700 hover:border-emerald-400 hover:bg-emerald-50/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100 line-clamp-1">
                                  {pkg.name}
                                </span>
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border border-stone-300 dark:border-stone-600 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-2">
                                <span className="flex items-center gap-1">
                                  <Repeat className="w-3 h-3 text-emerald-600" />
                                  <span>{pkg.sessionsCount || 1} جلسات</span>
                                </span>
                                <span className="font-black text-xs text-[#0f3b2c] dark:text-emerald-300">
                                  {pkgPrice > 0 ? `${pkgPrice} ج.م` : 'حسب الاختيار'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : displayedServices.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-500 bg-stone-50/50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
                      لا توجد خدمات تطابق بحثك في هذا القسم
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {displayedServices.map((srv) => {
                        const compositeId = `service_${srv.id}`;
                        const isSelected = selectedServices.some((s) => s.compositeId === compositeId);
                        const hasMatchingPackage =
                          matchingActivePackage &&
                          (matchingActivePackage.serviceId === srv.id ||
                           matchingActivePackage.packageName?.trim().toLowerCase() === srv.name.trim().toLowerCase());

                        return (
                          <div
                            key={srv.id}
                            onClick={() => handleServiceSelect(compositeId)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer relative text-right flex flex-col justify-between ${
                              isSelected
                                ? 'bg-gradient-to-br from-emerald-50/90 to-emerald-100/60 dark:from-emerald-950/60 dark:to-emerald-900/40 border-emerald-600/70 shadow-md ring-2 ring-emerald-500/30'
                                : 'bg-white/90 dark:bg-stone-850/90 border-stone-200/70 dark:border-stone-700 hover:border-emerald-400 hover:bg-emerald-50/30'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <div>
                                <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100 line-clamp-1">
                                  {srv.name}
                                </span>
                                {srv.sessionsCount && srv.sessionsCount > 1 && (
                                  <span className="text-[10px] text-emerald-700 font-bold mr-1">
                                    ({srv.sessionsCount} جلسات)
                                  </span>
                                )}
                              </div>
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-stone-300 dark:border-stone-600 shrink-0" />
                              )}
                            </div>

                            {hasMatchingPackage && (
                              <div className="my-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-[10px] font-extrabold flex items-center gap-1">
                                <span>🎁 للعميل جلسات متبقية في هذه الباقة!</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-stone-400" />
                                <span>{srv.durationMinutes} دقيقة</span>
                              </span>
                              <span className="font-black text-xs text-[#0f3b2c] dark:text-emerald-300">
                                {srv.minPrice} ج.م
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── CARD 4: الأخصائي المعالج والمستهلكات (Specialist & Consumables) ── */}
              <div className="p-4 bg-white/80 dark:bg-stone-850/60 backdrop-blur-xl rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-3.5 shadow-xs">
                {/* Specialist Row */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/25">
                        <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      </div>
                      <span>الأخصائي / الطبيب المعالج</span>
                    </label>
                    {estimatedDoctorCommission > 0 && (
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/25">
                        عمولة الطبيب: {estimatedDoctorCommission} ج.م
                      </span>
                    )}
                  </div>
                  <Select
                    value={staffOptions.find((opt) => opt.value === selectedStaffId) || null}
                    onChange={(selected) => setSelectedStaffId(selected ? selected.value : '')}
                    options={staffOptions}
                    placeholder="-- اختر الأخصائي المعالج --"
                    isSearchable={true}
                    isRtl={true}
                    isClearable={false}
                    menuPlacement="auto"
                    styles={customSelectStyles}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                  />
                </div>

                {/* Consumables Collapsible Accordion */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsAddonExpanded(!isAddonExpanded)}
                    className="w-full px-3 py-2 flex items-center justify-between rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-emerald-50/50 transition-colors cursor-pointer border border-stone-200/60 dark:border-stone-700/60"
                  >
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        مستهلكات إضافية أثناء الجلسة (اختياري)
                      </span>
                      {selectedConsumables.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                          {selectedConsumables.length} أصناف (+{consumablesTotal} ج.م)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-500 font-bold">
                      <span>{isAddonExpanded ? 'إخفاء' : 'إضافة مستهلك'}</span>
                      {isAddonExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {isAddonExpanded && (
                    <div className="p-3 mt-2 rounded-xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Select
                            value={consumableOptions.find((opt) => opt.value === selectedAddonId) || null}
                            onChange={(selected) => setSelectedAddonId(selected ? selected.value : '')}
                            options={consumableOptions}
                            placeholder="-- ابحث عن مستهلك من المخزن --"
                            isSearchable={true}
                            isRtl={true}
                            isClearable={true}
                            menuPlacement="auto"
                            maxMenuHeight={190}
                            styles={customSelectStyles}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                            noOptionsMessage={() => 'لا توجد منتجات مطابقة'}
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min="1"
                            value={addonQty}
                            onChange={(e) => setAddonQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-14 px-2 py-2 text-xs text-center rounded-xl border border-stone-200 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-extrabold"
                            placeholder="الكمية"
                          />
                          <button
                            type="button"
                            onClick={handleAddConsumable}
                            disabled={!selectedAddonId}
                            className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة</span>
                          </button>
                        </div>
                      </div>

                      {/* Selected Consumables List */}
                      {selectedConsumables.length > 0 && (
                        <div className="divide-y divide-stone-200/60 dark:divide-stone-700/60 border border-stone-200/80 dark:border-stone-700/80 rounded-xl bg-white dark:bg-stone-800 overflow-hidden max-h-32 overflow-y-auto">
                          {selectedConsumables.map((item) => {
                            const prod = inventoryItems.find((p) => p.id === item.productId);
                            const { sellingPrice } = getProductPricing(prod);
                            const lineTotal = sellingPrice * item.quantity;
                            return (
                              <div key={item.productId} className="px-3 py-2 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-stone-900 dark:text-stone-100">{prod?.name || 'مستهلك'}</span>
                                  <span className="text-[11px] text-stone-500 mr-2">
                                    ({sellingPrice} ج.م × {item.quantity} = {lineTotal} ج.م)
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <label className="inline-flex items-center gap-1 text-[11px] cursor-pointer font-bold text-stone-600 dark:text-stone-300">
                                    <input
                                      type="checkbox"
                                      checked={item.isBilledToClient}
                                      onChange={(e) => handleToggleConsumableBilled(item.productId, e.target.checked)}
                                      className="rounded text-emerald-700 focus:ring-emerald-500"
                                    />
                                    <span>تحميل على العميل</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveConsumable(item.productId)}
                                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
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
              </div>

            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              LEFT CANVAS: Live Folio & Instant Execution (5 Cols on LG/XL)
              ══════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col bg-gradient-to-b from-[#fbf9f5] via-white to-[#f6f2ea] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 shadow-inner overflow-hidden">
            
            {/* Folio Top Header Bar */}
            <div className="px-5 py-3 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-stone-100/50 dark:bg-stone-850/50">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-xs font-black text-[#0f3b2c] dark:text-emerald-200 tracking-wide">
                  تذكرة الحجز والفاتورة الحية • LIVE FOLIO
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                تحديث لحظي
              </span>
            </div>

            {/* Folio Scrollable Content */}
            <div className="flex-1 p-4 md:p-5 overflow-y-auto silk-scrollbar space-y-3.5">
              
              {/* Receipt Ticket Container */}
              <div className="bg-white dark:bg-stone-850 rounded-2xl border border-stone-200/90 dark:border-stone-700/80 p-4 shadow-sm space-y-3 relative">
                
                {/* Ticket Top Info */}
                <div className="flex items-center justify-between border-b border-dashed border-stone-200 dark:border-stone-700 pb-2.5">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block">العميل</span>
                    <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                      {clientMode === 'existing'
                        ? currentClient?.name || 'لم يتم اختيار عميل'
                        : newClientName.trim() || 'عميل جديد'}
                    </span>
                    {(clientMode === 'existing' ? currentClient?.phone : newClientPhone) && (
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-mono">
                        {clientMode === 'existing' ? currentClient?.phone : newClientPhone}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-stone-400 font-bold block">الموعد</span>
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                      {appointmentTime}
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                      {appointmentDate}
                    </span>
                  </div>
                </div>

                {/* Selected Items Breakdown (Multi-Service Support) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 font-bold flex items-center gap-1.5">
                      <span>الخدمات المطلوبة</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-700 text-white text-[9px] font-black">
                        {selectedServices.length}
                      </span>
                    </span>
                    {totalDurationMinutes > 0 && (
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        ⏱️ {Math.floor(totalDurationMinutes / 60) > 0 ? `${Math.floor(totalDurationMinutes / 60)} س ` : ''}{totalDurationMinutes % 60} دقيقة
                      </span>
                    )}
                  </div>

                  {selectedServices.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto silk-scrollbar pr-0.5">
                      {selectedServices.map((item) => (
                        <div
                          key={item.compositeId}
                          className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/25 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-[#0f3b2c] dark:text-emerald-200 truncate">
                                {item.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                                {item.categoryName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                              <span>⏱️ {item.durationMinutes} دقيقة</span>
                              {item.isPackageSession && (
                                <span className="text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-500/15 px-1 rounded">
                                  🎁 باقة نشطة
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                              {item.price > 0 ? `${item.price} ج.م` : '0 ج.م'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveService(item.compositeId)}
                              className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="حذف الخدمة"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-stone-400 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
                      انقر على خدمة أو باقة من القائمة اليمنى لإضافتها إلى الحجز
                    </div>
                  )}
                </div>

                {/* Consumables List in Folio (if any) */}
                {selectedConsumables.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-dashed border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] text-stone-400 font-bold block">المستلزمات المضافة</span>
                    {selectedConsumables.map((c) => {
                      const prod = inventoryItems.find((p) => p.id === c.productId);
                      const { sellingPrice } = getProductPricing(prod);
                      const linePrice = c.isBilledToClient ? sellingPrice * c.quantity : 0;
                      return (
                        <div key={c.productId} className="flex items-center justify-between text-[11px] py-0.5">
                          <span className="text-stone-700 dark:text-stone-300">
                            {prod?.name} (×{c.quantity})
                            {!c.isBilledToClient && <span className="text-[10px] text-emerald-600 mr-1">(مجاني)</span>}
                          </span>
                          <span className="font-bold text-stone-800 dark:text-stone-200">
                            {linePrice > 0 ? `${linePrice} ج.م` : '0 ج.م'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Perforated Divider */}
                <div className="border-t-2 border-dashed border-stone-300 dark:border-stone-700 my-1" />

                {/* Financial Math Breakdown */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span>الإجمالي الأولي:</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">{grossTotal} ج.م</span>
                  </div>

                  {/* Inline Discount Control */}
                  <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">الخصم:</span>
                      <div className="flex items-center bg-white dark:bg-stone-700 rounded-lg p-0.5 border border-stone-200 dark:border-stone-600 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setDiscountType('amount')}
                          className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                            discountType === 'amount' ? 'bg-[#0f3b2c] text-white' : 'text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          ج.م
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('percentage')}
                          className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                            discountType === 'percentage' ? 'bg-[#0f3b2c] text-white' : 'text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          %
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={discountValue || ''}
                        onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-200 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                      />
                      {discountAmount > 0 && (
                        <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400">
                          (-{discountAmount} ج.م)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grand Net Total */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-800 to-[#0f3b2c] text-white flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-[11px] font-medium text-emerald-200 block">الإجمالي الصافي المطلوب</span>
                      <span className="text-xl sm:text-2xl font-black text-white">
                        {finalPrice || 0} <span className="text-xs font-bold text-emerald-200">ج.م</span>
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                      <Calculator className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1.5">
                    طريقة السداد المتوقعة
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'CASH', label: 'كاش', icon: Banknote },
                      { id: 'WALLET', label: 'محفظة', icon: Wallet },
                      { id: 'INSTAPAY', label: 'انستاباي', icon: Smartphone },
                      { id: 'VISA', label: 'فيزا', icon: CreditCard },
                    ].map((pm) => {
                      const isSelected = paymentMethod === pm.id;
                      const Icon = pm.icon;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id as PaymentMethodType)}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center gap-1 border ${
                            isSelected
                              ? 'bg-[#0f3b2c] text-white border-[#0f3b2c] shadow-xs'
                              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-emerald-500/40'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Reception Notes */}
                <div className="pt-1">
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات الحجز أو رغبات خاصة للعميل..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200/80 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                  />
                </div>

              </div>

            </div>

            {/* Folio Bottom Action Buttons */}
            <div className="p-4 bg-white/95 dark:bg-stone-900/95 border-t border-stone-200/80 dark:border-stone-800 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Secondary Save Only Button */}
                <button
                  type="button"
                  onClick={() => handleSubmit({ printInvoice: false })}
                  disabled={isSubmitting || selectedServices.length === 0}
                  className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-white hover:bg-stone-50 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isSubmitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  )}
                  <span>تأكيد وحفظ فقط</span>
                </button>

                {/* Primary Confirm & Print Button */}
                <button
                  type="button"
                  onClick={() => handleSubmit({ printInvoice: true })}
                  disabled={isSubmitting || selectedServices.length === 0}
                  className="w-full py-2.5 px-3 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-[#0f3b2c] hover:from-emerald-700 hover:to-emerald-900 text-white shadow-lg shadow-emerald-700/25 border border-emerald-400/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>جاري الحفظ والطباعة...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4 text-amber-300" />
                      <span>تأكيد وطباعة الفاتورة</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-1.5 text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer font-bold transition-colors"
              >
                إلغاء وإغلاق
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};