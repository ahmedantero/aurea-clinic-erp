import { Appointment, CategoryItem, ClientItem, ExpenseItem, InventoryItemType, PackageItem, ServiceItem, StaffItem } from '../types';

export const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: 'exp1', expenseDate: '2026-10-01', expenseType: 'إيجار', amount: 4000, notes: 'إيجار مقر المركز الطبي والسبا لشهر أكتوبر' },
  { id: 'exp2', expenseDate: '2026-10-05', expenseType: 'كهرباء ومرافق', amount: 950, notes: 'فاتورة الكهرباء وتشغيل أجهزة التكييف والساونا' },
  { id: 'exp3', expenseDate: '2026-10-08', expenseType: 'مستلزمات', amount: 620, notes: 'شراء كحول ومفارش طبية وقفازات معقمة' },
  { id: 'exp4', expenseDate: '2026-10-10', expenseType: 'صيانة', amount: 450, notes: 'صيانة وتعديل أجهزة العلاج الطبيعي الكهربائية' },
  { id: 'exp5', expenseDate: '2026-10-12', expenseType: 'نثريات وضيافة', amount: 300, notes: 'مشروبات وضيافة العملاء ومستلزمات نظافة' },
];

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'cat1', name: 'عناية بالبشرة', servicesCount: 2 },
  { id: 'cat2', name: 'عناية بالشعر', servicesCount: 2 },
  { id: 'cat3', name: 'سبا وتدليك', servicesCount: 2 },
  { id: 'cat4', name: 'علاج طبيعي', servicesCount: 2 },
  { id: 'cat5', name: 'حجامة', servicesCount: 1 },
  { id: 'cat6', name: 'أسنان', servicesCount: 1 },
];

export const INITIAL_INVENTORY: InventoryItemType[] = [
  { id: 'inv1', name: 'ماسك تهدئة وترطيب', unitCost: 150, quantityInStock: 50, unitType: 'قطعة' },
  { id: 'inv2', name: 'ليفة الحمام المغربي', unitCost: 80, quantityInStock: 100, unitType: 'قطعة' },
];

export const INITIAL_SERVICES: ServiceItem[] = [
  { id: 's1', name: 'تقشير خفيف وتجديد البشرة', category: 'عناية بالبشرة', minPrice: 250, maxPrice: 400, durationMinutes: 45, type: 'عناية بالبشرة' },
  { id: 's2', name: 'ديرما بيل', category: 'عناية بالبشرة', minPrice: 350, maxPrice: 650, durationMinutes: 60, type: 'عناية بالبشرة' },
  { id: 's3', name: 'صبغة', category: 'عناية بالشعر', minPrice: 400, maxPrice: null, durationMinutes: 90, type: 'عناية بالشعر' },
  { id: 's4', name: 'معالجة وفرد - شعر قصير ضعيف', category: 'عناية بالشعر', minPrice: 1200, maxPrice: null, durationMinutes: 120, type: 'عناية بالشعر' },
  { id: 's5', name: 'سبا اليد الأساسي', category: 'سبا وتدليك', minPrice: 100, maxPrice: null, durationMinutes: 30, type: 'سبا وتدليك' },
  { id: 's6', name: 'الحمام المغربي', category: 'سبا وتدليك', minPrice: 500, maxPrice: 1000, durationMinutes: 90, type: 'سبا وتدليك' },
  { id: 's7', name: 'جلسة علاج طبيعي أجهزة', category: 'علاج طبيعي', minPrice: 150, maxPrice: null, durationMinutes: 45, type: 'علاج طبيعي' },
  { id: 's8', name: 'تدليك علاجي أجهزة كهربائية - كامل', category: 'علاج طبيعي', minPrice: 1000, maxPrice: null, durationMinutes: 60, type: 'علاج طبيعي' },
  { id: 's9', name: 'كاسات زجاجي - جسم كامل', category: 'حجامة', minPrice: 500, maxPrice: null, durationMinutes: 60, type: 'حجامة' },
  { id: 's10', name: 'ابتسامة هوليوود للفكين', category: 'أسنان', minPrice: 6000, maxPrice: null, durationMinutes: 120, type: 'أسنان' },
];

export const INITIAL_PACKAGES: PackageItem[] = [
  { id: 'pkg1', name: 'باكدج العروسة', fixedPrice: 4000, discountPercentage: null },
  { id: 'pkg2', name: 'عرض 8 جلسات علاج طبيعي', fixedPrice: 1100, discountPercentage: null },
  { id: 'pkg3', name: 'باكدج الصحاب - 3 أفراد', fixedPrice: null, discountPercentage: 5 },
  { id: 'pkg4', name: 'باكدج الصحاب - 10 أفراد', fixedPrice: null, discountPercentage: 15 },
];

export const INITIAL_STAFF: StaffItem[] = [
  { id: 'st1', name: 'د. سارة المنصوري', specialty: 'عناية بالبشرة' },
  { id: 'st2', name: 'أ. يوسف الشامي', specialty: 'علاج طبيعي' },
  { id: 'st3', name: 'مها عبد الرحمن', specialty: 'سبا وتدليك' },
  { id: 'st4', name: 'د. كريم عبد الله', specialty: 'طب الأسنان' },
];

export const INITIAL_CLIENTS: ClientItem[] = [
  { id: 'c1', name: 'نورا السعيد', phone: '01012345678', medicalHistory: 'حساسية من بعض مقشرات الأحماض', loyaltyPoints: 120, totalVisits: 5, totalSpent: 2450, joinDate: '2026-08-15' },
  { id: 'c2', name: 'أحمد محمود', phone: '01123456789', medicalHistory: 'انزلاق غضروفي قطني خفيف', loyaltyPoints: 85, totalVisits: 3, totalSpent: 900, joinDate: '2026-09-10' },
  { id: 'c3', name: 'ليلى إبراهيم', phone: '01234567890', medicalHistory: 'لا يوجد ملاحظات', loyaltyPoints: 210, totalVisits: 8, totalSpent: 3850, joinDate: '2026-07-20' },
  { id: 'c4', name: 'طارق حسام', phone: '01545678901', medicalHistory: 'ارتفاع ضغط دم منضبط', loyaltyPoints: 40, totalVisits: 2, totalSpent: 650, joinDate: '2026-10-01' },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    clientName: 'نورا السعيد',
    clientPhone: '01012345678',
    staffName: 'د. سارة المنصوري',
    serviceName: 'ديرما بيل',
    categoryName: 'عناية بالبشرة',
    appointmentDate: '2026-10-14',
    time: '11:00 صباحاً',
    status: 'مؤكد',
    finalPrice: 500,
  },
  {
    id: 'apt-102',
    clientName: 'أحمد محمود',
    clientPhone: '01123456789',
    staffName: 'أ. يوسف الشامي',
    serviceName: 'جلسة علاج طبيعي أجهزة',
    categoryName: 'علاج طبيعي',
    appointmentDate: '2026-10-14',
    time: '01:30 ظهراً',
    status: 'قيد الانتظار',
    finalPrice: 150,
  },
  {
    id: 'apt-103',
    clientName: 'ليلى إبراهيم',
    clientPhone: '01234567890',
    staffName: 'مها عبد الرحمن',
    serviceName: 'الحمام المغربي',
    categoryName: 'سبا وتدليك',
    appointmentDate: '2026-10-15',
    time: '03:00 مساءً',
    status: 'مؤكد',
    finalPrice: 750,
  },
  {
    id: 'apt-104',
    clientName: 'طارق حسام',
    clientPhone: '01545678901',
    staffName: 'د. سارة المنصوري',
    serviceName: 'كاسات زجاجي - جسم كامل',
    categoryName: 'حجامة',
    appointmentDate: '2026-10-13',
    time: '05:00 مساءً',
    status: 'مكتمل',
    finalPrice: 500,
  },
];
