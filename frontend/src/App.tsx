import { useState, useEffect } from 'react';
import { Sidebar, TabType } from './components/Sidebar';
import { Header } from './components/Header';
import { AppointmentsView } from './components/AppointmentsView';
import { DashboardView } from './components/DashboardView';
import { ServicesView } from './components/ServicesView';
import { ClientsView } from './components/ClientsView';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ReceiptModal } from './components/ReceiptModal';
import { InventoryView } from './components/InventoryView';
import { InternalDispatchView } from './components/InternalDispatchView';
import { StaffManagementView } from './components/StaffManagementView';
import { StaffReportsView } from './components/StaffReportsView';
import { ExpensesView } from './components/ExpensesView';
import { RevenuesView } from './components/RevenuesView';
import { FinancialAnalyticsView } from './components/FinancialAnalyticsView';
import { UsersManagementView } from './components/UsersManagementView';
import { LoginView } from './components/LoginView';
import { useAuth } from './context/AuthContext';
import { 
  INITIAL_APPOINTMENTS, 
  INITIAL_SERVICES, 
  INITIAL_CATEGORIES,
  INITIAL_PACKAGES,
  INITIAL_STAFF, 
  INITIAL_CLIENTS,
  INITIAL_INVENTORY,
  INITIAL_EXPENSES,
} from './data/mockData';
import { 
  Appointment, 
  AppointmentStatus, 
  CategoryItem,
  ClientItem, 
  ExpenseItem,
  RevenueItem,
  GeneratedInvoice, 
  InventoryItemType, 
  PackageItem, 
  ServiceItem, 
  StaffItem 
} from './types';

function App() {
  const { isAuthenticated, user, hasAccessToTab } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('appointments');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // RBAC protection: If current user has no access to active tab, redirect to 'appointments'
  useEffect(() => {
    if (user && !hasAccessToTab(currentTab)) {
      setCurrentTab('appointments');
    }
  }, [user, currentTab, hasAccessToTab]);

  // Checkout modal states (For pending/confirmed appointments payment)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedAppointmentForCheckout, setSelectedAppointmentForCheckout] = useState<Appointment | null>(null);

  // Read-only Receipt modal states (For completed appointments invoice viewing/printing only)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedAppointmentForReceipt, setSelectedAppointmentForReceipt] = useState<Appointment | null>(null);

  // Database-backed states (Initialized to empty arrays to reflect live database state accurately)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointmentsCount, setFilteredAppointmentsCount] = useState<number>(0);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [clientsList, setClientsList] = useState<ClientItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemType[]>([]);
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [revenuesList, setRevenuesList] = useState<RevenueItem[]>([]);

  // Fetch initial data from PostgreSQL Backend API with strict cache busting
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, categoriesRes, packagesRes, staffRes, clientsRes, aptsRes, invRes, expensesRes, revenuesRes] = await Promise.all([
          fetch('/api/services', { cache: 'no-store' }).catch(() => null),
          fetch('/api/categories', { cache: 'no-store' }).catch(() => null),
          fetch('/api/packages', { cache: 'no-store' }).catch(() => null),
          fetch('/api/staff', { cache: 'no-store' }).catch(() => null),
          fetch('/api/clients', { cache: 'no-store' }).catch(() => null),
          fetch('/api/appointments', { cache: 'no-store' }).catch(() => null),
          fetch('/api/inventory', { cache: 'no-store' }).catch(() => null),
          fetch('/api/expenses', { cache: 'no-store' }).catch(() => null),
          fetch('/api/revenues', { cache: 'no-store' }).catch(() => null),
        ]);

        if (servicesRes && servicesRes.ok) {
          const sData = await servicesRes.json();
          if (Array.isArray(sData)) setServices(sData);
        }

        if (categoriesRes && categoriesRes.ok) {
          const catData = await categoriesRes.json();
          if (Array.isArray(catData)) setCategories(catData);
        }

        if (packagesRes && packagesRes.ok) {
          const pData = await packagesRes.json();
          if (Array.isArray(pData)) setPackages(pData);
        }

        if (staffRes && staffRes.ok) {
          const stData = await staffRes.json();
          if (Array.isArray(stData)) setStaffList(stData);
        }

        if (clientsRes && clientsRes.ok) {
          const cData = await clientsRes.json();
          if (Array.isArray(cData)) setClientsList(cData);
        }

        if (aptsRes && aptsRes.ok) {
          const aData = await aptsRes.json();
          if (Array.isArray(aData)) {
            setAppointments(aData);
            setFilteredAppointmentsCount(aData.length);
          }
        }

        if (invRes && invRes.ok) {
          const iData = await invRes.json();
          if (Array.isArray(iData)) setInventoryItems(iData);
        }

        if (expensesRes && expensesRes.ok) {
          const expData = await expensesRes.json();
          if (Array.isArray(expData)) setExpensesList(expData);
        }

        if (revenuesRes && revenuesRes.ok) {
          const revData = await revenuesRes.json();
          if (Array.isArray(revData)) setRevenuesList(revData);
        }
      } catch (err) {
        console.warn('API is unreachable, using local fallback state:', err);
      }
    };

    fetchData();
  }, []);

  // Appointments Refresh Callback (Forced fresh request with no-store)
  const handleRefreshAppointments = async () => {
    try {
      const res = await fetch('/api/appointments', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAppointments(data);
          setFilteredAppointmentsCount(data.length);
        }
      }
    } catch (err) {
      console.warn('Could not refresh appointments:', err);
    }
  };

  // Add Appointment Callback (With Immediate Dual-Sync for Real-Time Reactivity)
  const handleAddAppointment = async (newApt: Appointment) => {
    // 1. Optimistically prepend new appointment so UI updates instantly
    setAppointments((prev) => {
      const filtered = prev.filter((a) => a.id !== newApt.id);
      return [newApt, ...filtered];
    });
    setFilteredAppointmentsCount((prev) => prev + 1);

    // 2. Immediately trigger backend re-fetch for appointments, clients & revenues
    try {
      await Promise.all([
        handleRefreshAppointments(),
        handleRefreshClients(),
        handleRefreshRevenues(),
      ]);
    } catch (e) {
      console.warn('Sync error after adding appointment:', e);
    }
  };

  // Open Checkout for Appointment (Payment & Invoicing for uncompleted appointments)
  const handleOpenCheckout = (apt: Appointment) => {
    if (!apt) return;
    // Strictly override state with the newly clicked appointment data
    setSelectedAppointmentForCheckout({ ...apt });
    setIsCheckoutOpen(true);
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setSelectedAppointmentForCheckout(null);
  };

  // Open Read-only Receipt Modal (For completed appointments only)
  const handleOpenReceipt = (apt: Appointment) => {
    if (!apt) return;
    setSelectedAppointmentForReceipt({ ...apt });
    setIsReceiptOpen(true);
  };

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false);
    setSelectedAppointmentForReceipt(null);
  };

  // Invoice Created Callback
  const handleInvoiceCreated = (invoice: GeneratedInvoice) => {
    // Update appointment status to 'مكتمل' and attach generated invoice
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === invoice.appointmentId ? { ...apt, status: 'مكتمل', invoice } : apt
      )
    );

    // Deduct inventory items from local state (whether charged or internal consumption)
    if (invoice.items && invoice.items.length > 0) {
      setInventoryItems((prev) =>
        prev.map((inv) => {
          const totalDeducted = invoice.items
            .filter((item) => item.id === inv.id)
            .reduce((sum, item) => sum + item.quantity, 0);

          if (totalDeducted > 0) {
            return {
              ...inv,
              quantityInStock: Math.max(0, inv.quantityInStock - totalDeducted),
            };
          }
          return inv;
        })
      );
    }

    // Trigger fresh re-fetch in background to keep all tables and analytics perfectly synced
    handleRefreshAppointments();
    handleRefreshRevenues();
    handleRefreshClients();
  };

  // Inventory Handlers
  const handleRefreshInventory = async () => {
    try {
      const res = await fetch('/api/inventory', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setInventoryItems(data);
      }
    } catch (err) {
      console.warn('Could not refresh inventory:', err);
    }
  };

  const handleAddItem = (newItem: InventoryItemType) => {
    setInventoryItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateStock = (id: string, newStock: number) => {
    setInventoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantityInStock: newStock } : item))
    );
  };

  // Staff Management Handlers
  const handleRefreshStaff = async () => {
    try {
      const res = await fetch('/api/staff', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setStaffList(data);
      }
    } catch (err) {
      console.warn('Could not refresh staff:', err);
    }
  };

  const handleAddStaff = (newStaff: StaffItem) => {
    setStaffList((prev) => [newStaff, ...prev]);
  };

  const handleUpdateStaff = (updatedStaff: StaffItem) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s))
    );
  };

  const handleDeleteStaff = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
  };

  // Client Management Handlers
  const handleRefreshClients = async () => {
    try {
      const res = await fetch('/api/clients', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setClientsList(data);
      }
    } catch (err) {
      console.warn('Could not refresh clients:', err);
    }
  };

  const handleAddClient = (newClient: ClientItem) => {
    setClientsList((prev) => [newClient, ...prev]);
  };

  const handleUpdateClient = (updatedClient: ClientItem) => {
    setClientsList((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
  };

  const handleDeleteClient = (id: string) => {
    setClientsList((prev) => prev.filter((c) => c.id !== id));
  };

  // Services & Categories Handlers
  const handleRefreshServices = async () => {
    try {
      const res = await fetch('/api/services', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setServices(data);
      }
    } catch (err) {
      console.warn('Could not refresh services:', err);
    }
  };

  const handleRefreshCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      }
    } catch (err) {
      console.warn('Could not refresh categories:', err);
    }
  };

  const handleAddService = (newService: ServiceItem) => {
    setServices((prev) => [newService, ...prev]);
  };

  const handleUpdateService = (updatedService: ServiceItem) => {
    setServices((prev) =>
      prev.map((s) => (s.id === updatedService.id ? updatedService : s))
    );
  };

  const handleDeleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddCategory = (newCat: CategoryItem) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const handleUpdateCategory = (updatedCat: CategoryItem) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Packages Handlers
  const handleRefreshPackages = async () => {
    try {
      const res = await fetch('/api/packages', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPackages(data);
      }
    } catch (err) {
      console.warn('Could not refresh packages:', err);
    }
  };

  const handleAddPackage = (newPkg: PackageItem) => {
    setPackages((prev) => [newPkg, ...prev]);
  };

  const handleUpdatePackage = (updatedPkg: PackageItem) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === updatedPkg.id ? updatedPkg : p))
    );
  };

  const handleDeletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  // Expenses Handlers
  const handleRefreshExpenses = async () => {
    try {
      const res = await fetch('/api/expenses', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setExpensesList(data);
      }
    } catch (err) {
      console.warn('Could not refresh expenses:', err);
    }
  };

  const handleAddExpense = (newExpense: ExpenseItem) => {
    setExpensesList((prev) => [newExpense, ...prev]);
  };

  const handleUpdateExpense = (updatedExpense: ExpenseItem) => {
    setExpensesList((prev) =>
      prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e))
    );
  };

  const handleDeleteExpense = (id: string) => {
    setExpensesList((prev) => prev.filter((e) => e.id !== id));
  };

  // Revenues Handlers
  const handleRefreshRevenues = async () => {
    try {
      const res = await fetch('/api/revenues', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setRevenuesList(data);
      }
    } catch (err) {
      console.warn('Could not refresh revenues:', err);
    }
  };

  const handleAddRevenue = (newRevenue: RevenueItem) => {
    setRevenuesList((prev) => [newRevenue, ...prev]);
  };

  const handleDeleteRevenue = (id: string) => {
    setRevenuesList((prev) => prev.filter((r) => r.id !== id));
  };

  // Update Status Callback
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );

    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn('Could not persist status to DB:', e);
    }
  };

  // Delete Appointment Callback (Immediate local React state update & DB sync)
  const handleDeleteAppointment = async (id: string) => {
    // Immediately remove from React state so table updates instantly without page refresh
    setAppointments((prev) => prev.filter((apt) => apt.id !== id));
    setFilteredAppointmentsCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        console.error('Failed to delete appointment from DB:', await res.text());
        // Re-sync with backend if server deletion fails
        handleRefreshAppointments();
      }
    } catch (e) {
      console.warn('Network error deleting appointment from DB:', e);
      handleRefreshAppointments();
    }
  };

  const getHeaderInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'الرئيسية',
          subtitle: 'نظرة عامة على مواعيد العيادة والخدمات اليومية',
        };
      case 'appointments':
        return {
          title: 'الحجوزات',
          subtitle: 'جدول مواعيد العملاء والجلسات القادمة',
        };
      case 'services':
        return {
          title: 'إدارة الخدمات والتصنيفات',
          subtitle: 'دليل خدمات العيادة والسبا وقائمة الأسعار والأقسام الطبية',
        };
      case 'clients':
        return {
          title: 'العملاء',
          subtitle: 'ملفات العملاء وسجلات المتابعة ونقاط الولاء',
        };
      case 'inventory':
        return {
          title: 'المخزون',
          subtitle: 'متابعة أرصدة المنتجات ومبيعات السبا والمستلزمات',
        };
      case 'dispatches':
        return {
          title: 'أذونات صرف المستهلكات',
          subtitle: 'أذونات الاستهلاك الداخلي للمواد والمستلزمات الطبية والتشغيلية',
        };
      case 'staff-management':
        return {
          title: 'إدارة المتخصصين والأطباء',
          subtitle: 'سجلات الكادر الطبي، التخصصات، ونظام التعاقد والعمولات',
        };
      case 'staff-reports':
        return {
          title: 'حسابات وعمولات المتخصصين',
          subtitle: 'تقارير أرباح المركز وحصص وعمولات وإيجارات الأطباء والأخصائيين',
        };
      case 'revenues':
        return {
          title: 'سجل الإيرادات والمداخيل المالية',
          subtitle: 'متابعة شاملة لجميع المداخيل المالية الناتجة تلقائياً عن الحجوزات والقيود اليدوية',
        };
      case 'expenses':
        return {
          title: 'إدارة المصروفات والنفقات',
          subtitle: 'تسجيل ومتابعة التكاليف التشغيلية، الإيجار، المرافق، والمستلزمات',
        };
      case 'analytics':
        return {
          title: 'التقارير والتحليلات المالية (P&L)',
          subtitle: 'متابعة قائمة الأرباح والخسائر، الإيرادات، عمولات المتخصصين، وصافي الربح',
        };
      case 'users':
        return {
          title: 'إدارة المستخدمين والصلاحيات',
          subtitle: 'إنشاء وتعديل حسابات النظام وتعيين أدوار المدراء وموظفي الاستقبال',
        };
      default:
        return {
          title: 'لوحة التحكم',
          subtitle: 'نظام إدارة العيادة والسبا',
        };
    }
  };

  // Unauthenticated user -> display luxurious LoginView
  if (!isAuthenticated) {
    return <LoginView />;
  }

  const headerInfo = getHeaderInfo();

  return (
    <div dir="rtl" className="min-h-screen print:min-h-full print:h-auto print:overflow-visible bg-[#fcfbf9] print:bg-white text-stone-800 flex font-sans">
      {/* Right Sidebar for RTL - Hidden on Print */}
      <div className="print:hidden">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          appointmentsCount={filteredAppointmentsCount}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:pr-64 print:pr-0 print:m-0 print:h-auto print:overflow-visible flex flex-col min-w-0">
        <div className="print:hidden">
          <Header
            title={headerInfo?.title || 'لوحة التحكم'}
            subtitle={headerInfo?.subtitle || ''}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        </div>

        <main className="flex-1 p-6 lg:p-8 print:p-0 print:m-0 print:h-auto print:overflow-visible max-w-6xl print:max-w-none w-full mx-auto">
          {currentTab === 'dashboard' && hasAccessToTab('dashboard') && (
            <DashboardView
              appointments={appointments}
              onNavigateToAppointments={() => setCurrentTab('appointments')}
              onOpenNewModal={() => setIsNewModalOpen(true)}
            />
          )}

          {currentTab === 'appointments' && hasAccessToTab('appointments') && (
            <AppointmentsView
              appointments={appointments}
              onOpenNewModal={() => setIsNewModalOpen(true)}
              onOpenCheckoutModal={handleOpenCheckout}
              onOpenReceiptModal={handleOpenReceipt}
              onUpdateStatus={handleUpdateStatus}
              onDeleteAppointment={handleDeleteAppointment}
              onRefresh={handleRefreshAppointments}
              onFilteredCountChange={setFilteredAppointmentsCount}
            />
          )}

          {currentTab === 'services' && hasAccessToTab('services') && (
            <ServicesView
              services={services}
              categories={categories}
              packages={packages}
              onRefreshServices={handleRefreshServices}
              onRefreshCategories={handleRefreshCategories}
              onRefreshPackages={handleRefreshPackages}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddPackage={handleAddPackage}
              onUpdatePackage={handleUpdatePackage}
              onDeletePackage={handleDeletePackage}
            />
          )}

          {currentTab === 'clients' && hasAccessToTab('clients') && (
            <ClientsView
              clients={clientsList}
              onRefreshClients={handleRefreshClients}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              services={services}
              packages={packages}
            />
          )}

          {currentTab === 'inventory' && hasAccessToTab('inventory') && (
            <InventoryView
              inventoryItems={inventoryItems}
              onRefreshInventory={handleRefreshInventory}
              onAddItem={handleAddItem}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {currentTab === 'dispatches' && hasAccessToTab('dispatches') && (
            <InternalDispatchView
              inventoryItems={inventoryItems}
              onRefreshInventory={handleRefreshInventory}
            />
          )}

          {currentTab === 'staff-management' && hasAccessToTab('staff-management') && (
            <StaffManagementView
              staffList={staffList}
              onRefreshStaff={handleRefreshStaff}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          )}

          {currentTab === 'staff-reports' && hasAccessToTab('staff-reports') && (
            <StaffReportsView />
          )}

          {currentTab === 'revenues' && hasAccessToTab('revenues') && (
            <RevenuesView
              revenues={revenuesList}
              onRefreshRevenues={handleRefreshRevenues}
              onAddRevenue={handleAddRevenue}
              onDeleteRevenue={handleDeleteRevenue}
            />
          )}

          {currentTab === 'expenses' && hasAccessToTab('expenses') && (
            <ExpensesView
              expenses={expensesList}
              onRefreshExpenses={handleRefreshExpenses}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {currentTab === 'analytics' && hasAccessToTab('analytics') && (
            <FinancialAnalyticsView />
          )}

          {currentTab === 'users' && hasAccessToTab('users') && (
            <UsersManagementView />
          )}
        </main>
      </div>

      {/* Add New Appointment Modal with Database Sync */}
      <NewAppointmentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onAddAppointment={handleAddAppointment}
        services={services}
        categories={categories}
        packages={packages}
        staffList={staffList}
        clientsList={clientsList}
        inventoryItems={inventoryItems}
      />

      {/* Checkout / Invoice Modal */}
      <CheckoutModal
        key={selectedAppointmentForCheckout?.id || 'checkout-closed'}
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
        appointment={selectedAppointmentForCheckout}
        inventoryItems={inventoryItems}
        onInvoiceCreated={handleInvoiceCreated}
      />

      {/* Read-Only Receipt / Invoice Modal for Completed Appointments */}
      <ReceiptModal
        key={selectedAppointmentForReceipt?.id || 'receipt-closed'}
        isOpen={isReceiptOpen}
        onClose={handleCloseReceipt}
        appointment={selectedAppointmentForReceipt}
        invoice={selectedAppointmentForReceipt?.invoice}
      />
    </div>
  );
}

export default App;
