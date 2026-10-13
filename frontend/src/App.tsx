import { useState, useEffect } from 'react';
import { Sidebar, TabType } from './components/Sidebar';
import { Header } from './components/Header';
import { AppointmentsView } from './components/AppointmentsView';
import { DashboardView } from './components/DashboardView';
import { ServicesView } from './components/ServicesView';
import { ClientsView } from './components/ClientsView';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { CheckoutModal } from './components/CheckoutModal';
import { InventoryView } from './components/InventoryView';
import { StaffManagementView } from './components/StaffManagementView';
import { StaffReportsView } from './components/StaffReportsView';
import { ExpensesView } from './components/ExpensesView';
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

  // Checkout modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedAppointmentForCheckout, setSelectedAppointmentForCheckout] = useState<Appointment | null>(null);

  // Database-backed states
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [packages, setPackages] = useState<PackageItem[]>(INITIAL_PACKAGES);
  const [staffList, setStaffList] = useState<StaffItem[]>(INITIAL_STAFF);
  const [clientsList, setClientsList] = useState<ClientItem[]>(INITIAL_CLIENTS);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemType[]>(INITIAL_INVENTORY);
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>(INITIAL_EXPENSES);

  // Fetch initial data from PostgreSQL Backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, categoriesRes, packagesRes, staffRes, clientsRes, aptsRes, invRes, expensesRes] = await Promise.all([
          fetch('/api/services').catch(() => null),
          fetch('/api/categories').catch(() => null),
          fetch('/api/packages').catch(() => null),
          fetch('/api/staff').catch(() => null),
          fetch('/api/clients').catch(() => null),
          fetch('/api/appointments').catch(() => null),
          fetch('/api/inventory').catch(() => null),
          fetch('/api/expenses').catch(() => null),
        ]);

        if (servicesRes && servicesRes.ok) {
          const sData = await servicesRes.json();
          if (Array.isArray(sData) && sData.length > 0) setServices(sData);
        }

        if (categoriesRes && categoriesRes.ok) {
          const catData = await categoriesRes.json();
          if (Array.isArray(catData) && catData.length > 0) setCategories(catData);
        }

        if (packagesRes && packagesRes.ok) {
          const pData = await packagesRes.json();
          if (Array.isArray(pData) && pData.length > 0) setPackages(pData);
        }

        if (staffRes && staffRes.ok) {
          const stData = await staffRes.json();
          if (Array.isArray(stData) && stData.length > 0) setStaffList(stData);
        }

        if (clientsRes && clientsRes.ok) {
          const cData = await clientsRes.json();
          if (Array.isArray(cData) && cData.length > 0) setClientsList(cData);
        }

        if (aptsRes && aptsRes.ok) {
          const aData = await aptsRes.json();
          if (Array.isArray(aData) && aData.length > 0) setAppointments(aData);
        }

        if (invRes && invRes.ok) {
          const iData = await invRes.json();
          if (Array.isArray(iData) && iData.length > 0) setInventoryItems(iData);
        }

        if (expensesRes && expensesRes.ok) {
          const expData = await expensesRes.json();
          if (Array.isArray(expData) && expData.length > 0) setExpensesList(expData);
        }
      } catch (err) {
        console.warn('API is unreachable, using local fallback state:', err);
      }
    };

    fetchData();
  }, []);

  // Add Appointment Callback
  const handleAddAppointment = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);
  };

  // Open Checkout for Appointment
  const handleOpenCheckout = (apt: Appointment) => {
    setSelectedAppointmentForCheckout(apt);
    setIsCheckoutOpen(true);
  };

  // Invoice Created Callback
  const handleInvoiceCreated = (invoice: GeneratedInvoice) => {
    // Update appointment status to 'مكتمل'
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === invoice.appointmentId ? { ...apt, status: 'مكتمل' } : apt
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
  };

  // Inventory Handlers
  const handleRefreshInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
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
      const res = await fetch('/api/staff');
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
      const res = await fetch('/api/clients');
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
      const res = await fetch('/api/services');
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
      const res = await fetch('/api/categories');
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

  // Expenses Handlers
  const handleRefreshExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
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

  // Delete Appointment Callback
  const handleDeleteAppointment = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الحجز نهائياً؟')) {
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));

      try {
        await fetch(`/api/appointments/${id}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.warn('Could not delete from DB:', e);
      }
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
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:pr-64 print:pr-0 print:m-0 print:h-auto print:overflow-visible flex flex-col min-w-0">
        <div className="print:hidden">
          <Header
            title={headerInfo.title}
            subtitle={headerInfo.subtitle}
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
              onUpdateStatus={handleUpdateStatus}
              onDeleteAppointment={handleDeleteAppointment}
            />
          )}

          {currentTab === 'services' && hasAccessToTab('services') && (
            <ServicesView
              services={services}
              categories={categories}
              onRefreshServices={handleRefreshServices}
              onRefreshCategories={handleRefreshCategories}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {currentTab === 'clients' && hasAccessToTab('clients') && (
            <ClientsView
              clients={clientsList}
              onRefreshClients={handleRefreshClients}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
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
        packages={packages}
        staffList={staffList}
        clientsList={clientsList}
      />

      {/* Checkout / Invoice Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedAppointmentForCheckout(null);
        }}
        appointment={selectedAppointmentForCheckout}
        inventoryItems={inventoryItems}
        onInvoiceCreated={handleInvoiceCreated}
      />
    </div>
  );
}

export default App;
