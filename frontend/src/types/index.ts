export type AppointmentStatus = 'مؤكد' | 'قيد الانتظار' | 'مكتمل' | 'ملغي';

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  staffName: string;
  serviceName: string;
  categoryName: string;
  appointmentDate: string;
  time: string;
  status: AppointmentStatus;
  basePrice?: number;
  totalConsumablesPrice?: number;
  finalPrice: number;
  doctorCommission?: number;
  doctorCommissionPercentage?: number;
  clientPackageId?: string | null;
  packageName?: string | null;
  isPackageSession?: boolean;
  consumables?: AppointmentConsumableItem[];
  invoice?: GeneratedInvoice | null;
}

export interface CategoryItem {
  id: string;
  name: string;
  servicesCount?: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  categoryId?: string;
  category: string;
  minPrice: number;
  maxPrice: number | null;
  durationMinutes: number;
  type: string;
  sessionsCount?: number;
}

export interface PackageItem {
  id: string;
  name: string;
  fixedPrice: number | null;
  discountPercentage: number | null;
  sessionsCount?: number;
}

export interface ClientAppointmentItem {
  id: string;
  date: string;
  time?: string;
  serviceName: string;
  categoryName?: string;
  staffName: string;
  status: string;
  finalPrice: number;
  hasInvoice?: boolean;
}

export interface ClientInvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  paymentMethod: string;
  serviceName?: string;
}

export interface ClientPackageItem {
  id: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  packageId?: string | null;
  serviceId?: string | null;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  pricePaid: number;
  status: 'ACTIVE' | 'COMPLETED' | string;
  notes?: string;
  createdAt?: string;
}

export interface ClientItem {
  id: string;
  name: string;
  phone: string;
  medicalHistory?: string;
  loyaltyPoints: number;
  totalVisits: number;
  totalSpent: number;
  joinDate?: string;
  appointments?: ClientAppointmentItem[];
  invoices?: ClientInvoiceItem[];
  clientPackages?: ClientPackageItem[];
}

export interface StaffItem {
  id: string;
  name: string;
  specialty: string;
  phone?: string;
  commissionType?: string;
  commissionValue?: number;
}

export interface StaffReportAppointment {
  id: string;
  date: string;
  clientName: string;
  serviceName: string;
  basePrice?: number;
  consumablesPrice?: number;
  doctorCommission?: number;
  finalPrice: number;
  invoiceNumber: string;
  invoiceTotal: number;
  paymentMethod: string;
}

export interface StaffReportItem {
  id: string;
  name: string;
  specialty: string;
  commissionType: string;
  commissionValue: number;
  sessionsCount: number;
  totalRevenue: number;
  commissionableBase?: number;
  consumablesRevenue?: number;
  staffDue: number;
  centerProfit: number;
  appointments: StaffReportAppointment[];
}

export interface InventoryItemType {
  id: string;
  name: string;
  unitCost: number;
  sellingPrice?: number;
  quantityInStock: number;
  unitType: string;
}

export interface AppointmentConsumableItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  priceCharged?: number;
}

export interface InternalDispatchItem {
  id: string;
  productId: string;
  productName: string;
  unitType?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  chargeToClient: boolean;
}

export interface GeneratedInvoice {
  invoiceId: string;
  invoiceNumber: string;
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  basePrice: number;
  consumablesPrice?: number;
  doctorCommission?: number;
  doctorCommissionPercentage?: number;
  totalAmount: number;
  discountApplied: number;
  netAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: InvoiceItem[];
}

export interface ExpenseItem {
  id: string;
  expenseDate: string;
  expenseType: string;
  amount: number;
  notes?: string;
  createdAt?: string;
}

export interface RevenueItem {
  id: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
  source: 'MANUAL' | 'APPOINTMENT' | string;
  referenceId?: string | null;
  appointment?: {
    id: string;
    clientName: string;
    serviceName: string;
  } | null;
  createdAt?: string;
}

export interface ExpenseCategoryStat {
  category: string;
  amount: number;
  percentage: number;
}

export interface DailyFinancialStat {
  date: string;
  dayName: string;
  revenue: number;
  staffDue: number;
  expenses: number;
  netProfit: number;
}

export interface StaffBreakdownItem {
  id: string;
  name: string;
  specialty: string;
  commissionType: string;
  commissionValue: number;
  sessionsCount: number;
  totalRevenue: number;
  staffDue: number;
  centerProfit: number;
}

export interface TopServiceStat {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  bookingsCount: number;
  totalRevenue: number;
  percentage: number;
}

export interface TopCategoryStat {
  category: string;
  revenue: number;
  percentage: number;
}

export interface InventoryReportItem {
  id: string;
  name: string;
  unitCost: number;
  quantityInStock: number;
  unitType: string;
  valuation: number;
  status: 'out_of_stock' | 'low_stock' | 'in_stock';
}

export interface InventoryAnalytics {
  totalItems: number;
  totalValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  items: InventoryReportItem[];
}

export interface FinancialAnalytics {
  period: {
    startDate?: string;
    endDate?: string;
    preset?: string;
  };
  totalRevenue: number;
  invoicesCount: number;
  totalStaffDue: number;
  totalExpenses: number;
  netProfit: number;
  expensesByCategory: ExpenseCategoryStat[];
  staffBreakdown?: StaffBreakdownItem[];
  dailyTrend: DailyFinancialStat[];
  topServices?: TopServiceStat[];
  topCategories?: TopCategoryStat[];
  inventoryAnalytics?: InventoryAnalytics;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: 'ADMIN' | 'RECEPTIONIST';
  name?: string;
  createdAt?: string;
}
