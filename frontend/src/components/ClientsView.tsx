import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Calendar, 
  DollarSign, 
  FileText, 
  Eye, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Award, 
  Activity,
  CreditCard,
  UserCheck,
  Layers,
  Package as PackageIcon,
  Check
} from 'lucide-react';
import { 
  ClientItem, 
  ClientAppointmentItem, 
  ClientInvoiceItem, 
  ClientPackageItem, 
  ServiceItem, 
  PackageItem 
} from '../types';

interface ClientsViewProps {
  clients: ClientItem[];
  onRefreshClients: () => void;
  onAddClient: (newClient: ClientItem) => void;
  onUpdateClient: (updatedClient: ClientItem) => void;
  onDeleteClient: (id: string) => void;
  services?: ServiceItem[];
  packages?: PackageItem[];
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onRefreshClients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  services = [],
  packages = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedClientForProfile, setSelectedClientForProfile] = useState<ClientItem | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Profile Sub-tab
  const [profileActiveTab, setProfileActiveTab] = useState<'packages' | 'appointments' | 'invoices'>('packages');

  // Assign Package Modal state
  const [isAssignPackageModalOpen, setIsAssignPackageModalOpen] = useState(false);
  const [assignSource, setAssignSource] = useState<'service' | 'package' | 'custom'>('service');
  const [assignServiceId, setAssignServiceId] = useState('');
  const [assignPackageId, setAssignPackageId] = useState('');
  const [assignPackageName, setAssignPackageName] = useState('');
  const [assignTotalSessions, setAssignTotalSessions] = useState<number>(6);
  const [assignPricePaid, setAssignPricePaid] = useState<string>('0');
  const [assignNotes, setAssignNotes] = useState('');
  const [isSubmittingPackage, setIsSubmittingPackage] = useState(false);
  const [assignPackageError, setAssignPackageError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMedicalHistory, setFormMedicalHistory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Keep selectedClientForProfile in sync with latest clients list (real-time reactivity)
  React.useEffect(() => {
    if (selectedClientForProfile) {
      const fresh = clients.find((c) => c.id === selectedClientForProfile.id);
      if (fresh) {
        setSelectedClientForProfile(fresh);
      }
    }
  }, [clients]);

  // Open modal for Assigning Package
  const handleOpenAssignPackageModal = () => {
    setAssignSource('service');
    const firstSrv = services && services.length > 0 ? services[0] : null;
    if (firstSrv) {
      setAssignServiceId(firstSrv.id);
      setAssignPackageName(`باقة ${firstSrv.name} (6 جلسات)`);
      setAssignPricePaid((firstSrv.minPrice * 6).toString());
    } else {
      setAssignServiceId('');
      setAssignPackageName('باقة جلسات علاجية');
      setAssignPricePaid('1200');
    }
    setAssignPackageId(packages && packages.length > 0 ? packages[0].id : '');
    setAssignTotalSessions(6);
    setAssignNotes('');
    setAssignPackageError(null);
    setIsAssignPackageModalOpen(true);
  };

  const handleAssignSourceChange = (src: 'service' | 'package' | 'custom') => {
    setAssignSource(src);
    if (src === 'service') {
      const srv = services?.find((s) => s.id === assignServiceId) || services?.[0];
      if (srv) {
        setAssignServiceId(srv.id);
        setAssignPackageName(`باقة ${srv.name} (${assignTotalSessions} جلسات)`);
        setAssignPricePaid((srv.minPrice * assignTotalSessions).toString());
      }
    } else if (src === 'package') {
      const pkg = packages?.find((p) => p.id === assignPackageId) || packages?.[0];
      if (pkg) {
        setAssignPackageId(pkg.id);
        setAssignPackageName(pkg.name);
        setAssignPricePaid((pkg.fixedPrice || 1500).toString());
      }
    } else {
      setAssignPackageName('باقة مخصصة');
    }
  };

  const handleAssignPackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForProfile) return;

    if (!assignPackageName.trim()) {
      setAssignPackageError('يرجى تحديد اسم الباقة');
      return;
    }

    if (assignTotalSessions <= 0) {
      setAssignPackageError('عدد الجلسات يجب أن يكون أكبر من صفر');
      return;
    }

    setIsSubmittingPackage(true);
    setAssignPackageError(null);

    try {
      const payload = {
        clientId: selectedClientForProfile.id,
        packageId: assignSource === 'package' ? assignPackageId : null,
        serviceId: assignSource === 'service' ? assignServiceId : null,
        packageName: assignPackageName.trim(),
        totalSessions: assignTotalSessions,
        pricePaid: parseFloat(assignPricePaid) || 0,
        notes: assignNotes.trim() || null,
      };

      const res = await fetch('/api/client-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'تعذر إسناد الباقة للعميل');
      }

      const createdPackage: ClientPackageItem = await res.json();

      // Update client state
      const updatedPackages = [createdPackage, ...(selectedClientForProfile.clientPackages || [])];
      const updatedClient: ClientItem = {
        ...selectedClientForProfile,
        clientPackages: updatedPackages,
      };

      setSelectedClientForProfile(updatedClient);
      onUpdateClient(updatedClient);
      setIsAssignPackageModalOpen(false);
    } catch (err: any) {
      console.warn('Error assigning package:', err);
      setAssignPackageError(err.message || 'حدث خطأ أثناء حفظ الباقة');
    } finally {
      setIsSubmittingPackage(false);
    }
  };

  const handleIncrementPackageSession = async (pkg: ClientPackageItem) => {
    if (!selectedClientForProfile) return;
    if (pkg.usedSessions >= pkg.totalSessions) return;

    try {
      const newUsed = pkg.usedSessions + 1;
      const res = await fetch(`/api/client-packages/${pkg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usedSessions: newUsed }),
      });

      if (!res.ok) {
        throw new Error('فشل تحديث رصيد الجلسات');
      }

      const updated = await res.json();
      const updatedPackages = (selectedClientForProfile.clientPackages || []).map((p) =>
        p.id === pkg.id ? { ...p, ...updated } : p
      );
      const updatedClient: ClientItem = {
        ...selectedClientForProfile,
        clientPackages: updatedPackages,
      };

      setSelectedClientForProfile(updatedClient);
      onUpdateClient(updatedClient);
    } catch (err) {
      console.warn('Error updating session count:', err);
      alert('تعذر تحديث رصيد الجلسات');
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!selectedClientForProfile) return;
    if (!confirm('هل أنت متأكد من حذف هذه الباقة من سجل العميل؟')) return;

    try {
      const res = await fetch(`/api/client-packages/${packageId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('فشل حذف الباقة');
      }

      const updatedPackages = (selectedClientForProfile.clientPackages || []).filter(
        (p) => p.id !== packageId
      );
      const updatedClient: ClientItem = {
        ...selectedClientForProfile,
        clientPackages: updatedPackages,
      };

      setSelectedClientForProfile(updatedClient);
      onUpdateClient(updatedClient);
    } catch (err) {
      console.warn('Error deleting package:', err);
      alert('تعذر حذف الباقة');
    }
  };

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingClientId(null);
    setFormName('');
    setFormPhone('');
    setFormMedicalHistory('');
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (client: ClientItem) => {
    setEditingClientId(client.id);
    setFormName(client.name);
    setFormPhone(client.phone);
    setFormMedicalHistory(client.medicalHistory || '');
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setFormError('يرجى إدخال اسم العميل ورقم الهاتف');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      name: formName.trim(),
      phone: formPhone.trim(),
      medicalHistory: formMedicalHistory.trim() || null,
    };

    try {
      if (editingClientId) {
        // UPDATE Client
        const res = await fetch(`/api/clients/${editingClientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل تحديث بيانات العميل');
        }

        const updated = await res.json();
        onUpdateClient(updated);
        if (selectedClientForProfile?.id === updated.id) {
          setSelectedClientForProfile(updated);
        }
      } else {
        // CREATE Client
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل إضافة العميل');
        }

        const created = await res.json();
        onAddClient(created);
      }

      setIsAddEditModalOpen(false);
    } catch (err: any) {
      console.warn('API error during client save:', err);
      setFormError(err.message || 'حدث خطأ أثناء حفظ العميل');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Client
  const handleDeleteClient = async (client: ClientItem) => {
    if (!confirm(`هل أنت متأكد من حذف العميل "${client.name}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'لا يمكن حذف هذا العميل لوجود حجوزات أو فواتير مسجلة باسمه.');
        return;
      }

      onDeleteClient(client.id);
      if (selectedClientForProfile?.id === client.id) {
        setSelectedClientForProfile(null);
      }
    } catch (err: any) {
      console.warn('Error deleting client:', err);
      alert('تعذر حذف العميل، يرجى المحاولة لاحقاً');
    }
  };

  // Filtered Clients
  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.phone.includes(term);
  });

  // Overall CRM Metrics
  const totalClientsCount = clients.length;
  const totalLifetimeSpent = clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalVisitsCount = clients.reduce((sum, c) => sum + (c.totalVisits || 0), 0);
  const averageSpent = totalClientsCount > 0 ? Math.round(totalLifetimeSpent / totalClientsCount) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">إدارة العملاء والمرضى (CRM)</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            سجلات العملاء، الملفات الطبية، تاريخ الزيارات، وحسابات الفواتير
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshClients}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="تحديث البيانات من قاعدة البيانات"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">إجمالي العملاء</p>
            <h3 className="text-2xl font-bold text-stone-800 mt-1">{totalClientsCount}</h3>
            <p className="text-xs text-stone-400 mt-0.5">ملفات مسجلة بالمركز</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">إجمالي المدفوعات</p>
            <h3 className="text-2xl font-bold text-emerald-800 mt-1">
              {totalLifetimeSpent.toLocaleString()} <span className="text-xs font-normal text-stone-500">ج.م</span>
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">إجمالي مبيعات العملاء</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">إجمالي الزيارات والجلسات</p>
            <h3 className="text-2xl font-bold text-stone-800 mt-1">{totalVisitsCount}</h3>
            <p className="text-xs text-stone-400 mt-0.5">جلسة علاج طبيعي وسبا</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">متوسط إنفاق العميل</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">
              {averageSpent.toLocaleString()} <span className="text-xs font-normal text-stone-500">ج.م</span>
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-0.5">متوسط القيمة للعميل الواحد</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم العميل أو رقم الهاتف..."
            className="w-full pr-10 pl-4 py-2 text-sm rounded-xl border border-stone-200/80 bg-stone-50/50 focus:bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 placeholder-stone-400"
          />
        </div>

        <div className="text-xs text-stone-500 font-medium">
          تم العثور على <strong className="text-stone-800">{filteredClients.length}</strong> عميل
        </div>
      </div>

      {/* Clients Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-stone-50/70 border-b border-stone-200/80 text-xs font-semibold text-stone-600">
                <th className="py-3.5 px-6">اسم العميل (Client Name)</th>
                <th className="py-3.5 px-6">رقم الهاتف (Phone)</th>
                <th className="py-3.5 px-6">إجمالي الزيارات (Visits)</th>
                <th className="py-3.5 px-6">إجمالي المدفوعات (Total Spent)</th>
                <th className="py-3.5 px-6 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                    <p className="font-medium text-stone-600">لا يوجد عملاء مسجلين</p>
                    <p className="text-xs mt-1">اضغط على زر "إضافة عميل جديد" لتسجيل عميل جديد.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/50 transition-colors">
                    {/* اسم العميل */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100 shrink-0">
                          {c.name.slice(0, 2)}
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedClientForProfile(c)}
                            className="font-bold text-stone-800 hover:text-emerald-700 transition-colors text-right cursor-pointer"
                          >
                            {c.name}
                          </button>
                          {c.medicalHistory ? (
                            <div className="text-[11px] text-stone-400 truncate max-w-xs">
                              {c.medicalHistory}
                            </div>
                          ) : (
                            <div className="text-[11px] text-stone-300">لا توجد ملاحظات طبية</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* رقم الهاتف */}
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-stone-700 flex items-center gap-1.5" dir="ltr">
                        <Phone className="w-3 h-3 text-stone-400" />
                        {c.phone}
                      </span>
                    </td>

                    {/* إجمالي الزيارات */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-800">{c.totalVisits || 0}</span>
                        <span className="text-xs text-stone-400">زيارات</span>
                      </div>
                    </td>

                    {/* إجمالي المدفوعات */}
                    <td className="py-4 px-6 font-bold text-stone-800">
                      <span className="text-emerald-800 font-extrabold">
                        {(c.totalSpent || 0).toLocaleString()}
                      </span>{' '}
                      <span className="text-xs font-normal text-stone-500">ج.م</span>
                    </td>

                    {/* الإجراءات */}
                    <td className="py-4 px-6 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedClientForProfile(c)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="عرض الملف الشخصي وتاريخ الزيارات"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>الملف الشخصي</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          title="تعديل البيانات"
                        >
                          <Edit3 className="w-4 h-4 text-stone-600" />
                        </button>

                        <button
                          onClick={() => handleDeleteClient(c)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="حذف العميل"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* MODAL 1: الملف الشخصي للعميل (Client Profile Modal) */}
      {selectedClientForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div 
            className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-base border border-emerald-100">
                  {selectedClientForProfile.name.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-stone-800">{selectedClientForProfile.name}</h3>
                    <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      عميل نشط
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-mono text-stone-600" dir="ltr">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      {selectedClientForProfile.phone}
                    </span>
                    <span>•</span>
                    <span>تاريخ التسجيل: {selectedClientForProfile.joinDate || '2026-10-13'}</span>
                    <span>•</span>
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      {selectedClientForProfile.loyaltyPoints} نقطة ولاء
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleOpenEditModal(selectedClientForProfile)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                  <span>تعديل</span>
                </button>
                <button
                  onClick={() => setSelectedClientForProfile(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Medical Notes Banner if exists */}
            {selectedClientForProfile.medicalHistory && (
              <div className="px-6 py-2.5 bg-amber-50/70 border-b border-amber-100/80 text-xs text-amber-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>الملاحظات والحالة الصحية:</strong> {selectedClientForProfile.medicalHistory}
                </span>
              </div>
            )}

            {/* Quick Metrics Bar in Profile */}
            {(() => {
              const activePkgs = (selectedClientForProfile.clientPackages || []).filter(
                (p) => p.status === 'ACTIVE' && p.usedSessions < p.totalSessions
              );
              const remainingSessionsTotal = activePkgs.reduce(
                (sum, p) => sum + (p.totalSessions - p.usedSessions),
                0
              );

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-50/50 border-b border-stone-100 text-center">
                  <div className="bg-white p-3 rounded-xl border border-stone-200/70">
                    <span className="text-[11px] text-stone-400 block font-medium">إجمالي الزيارات</span>
                    <strong className="text-base text-stone-800">{selectedClientForProfile.totalVisits || 0} زيارة</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-stone-200/70">
                    <span className="text-[11px] text-emerald-700 block font-medium">إجمالي المدفوعات</span>
                    <strong className="text-base text-emerald-800">
                      {(selectedClientForProfile.totalSpent || 0).toLocaleString()} ج.م
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-stone-200/70">
                    <span className="text-[11px] text-amber-700 block font-medium">نقاط الولاء</span>
                    <strong className="text-base text-amber-800">{selectedClientForProfile.loyaltyPoints} نقطة</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-200/80 bg-purple-50/20">
                    <span className="text-[11px] text-purple-700 block font-bold">باقات وجلسات نشطة</span>
                    <strong className="text-base text-purple-900">
                      {activePkgs.length > 0 ? `${activePkgs.length} باقة (${remainingSessionsTotal} جلسة)` : 'لا توجد'}
                    </strong>
                  </div>
                </div>
              );
            })()}

            {/* Tabs Navigation in Profile */}
            <div className="px-6 pt-3 flex items-center gap-2 border-b border-stone-100 overflow-x-auto">
              <button
                onClick={() => setProfileActiveTab('packages')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  profileActiveTab === 'packages'
                    ? 'border-emerald-700 text-emerald-800'
                    : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>باقات وجلسات العميل ({selectedClientForProfile.clientPackages?.length || 0})</span>
              </button>

              <button
                onClick={() => setProfileActiveTab('appointments')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  profileActiveTab === 'appointments'
                    ? 'border-emerald-700 text-emerald-800'
                    : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>تاريخ الزيارات والحجوزات ({selectedClientForProfile.appointments?.length || 0})</span>
              </button>

              <button
                onClick={() => setProfileActiveTab('invoices')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  profileActiveTab === 'invoices'
                    ? 'border-emerald-700 text-emerald-800'
                    : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>الفواتير والمدفوعات ({selectedClientForProfile.invoices?.length || 0})</span>
              </button>
            </div>

            {/* Profile Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {profileActiveTab === 'packages' ? (
                /* Packages & Multi-Session Tracking Section */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                    <div>
                      <h4 className="text-sm font-bold text-stone-800">باقات وجلسات العميل (Active Packages & Sessions)</h4>
                      <p className="text-xs text-stone-400">متابعة رصيد الجلسات المتبقية ونسبة الاستهلاك</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAssignPackageModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إسناد باقة جديدة</span>
                    </button>
                  </div>

                  {!selectedClientForProfile.clientPackages || selectedClientForProfile.clientPackages.length === 0 ? (
                    <div className="py-12 text-center text-stone-400 text-xs">
                      <Layers className="w-10 h-10 mx-auto mb-2.5 text-stone-300" />
                      <p className="font-semibold text-stone-600">لا توجد باقات أو جلسات مسندة لهذا العميل حتى الآن</p>
                      <p className="text-stone-400 mt-1">يمكنك إسناد باقة ليزر، جلسات علاجية، أو عناية بالبشرة ومتابعتها تلقائياً.</p>
                      <button
                        type="button"
                        onClick={handleOpenAssignPackageModal}
                        className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إسناد باقة جديدة الآن</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {selectedClientForProfile.clientPackages.map((cp) => {
                        const isCompleted = cp.status === 'COMPLETED' || cp.usedSessions >= cp.totalSessions;
                        const pct = Math.min(100, Math.round((cp.usedSessions / cp.totalSessions) * 100));

                        return (
                          <div
                            key={cp.id}
                            className="p-4 rounded-2xl border border-stone-200/80 bg-white shadow-2xs hover:border-emerald-200 transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-bold text-stone-800 text-sm">{cp.packageName}</h5>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      isCompleted
                                        ? 'bg-stone-100 text-stone-600 border border-stone-200'
                                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {isCompleted ? 'مكتملة' : 'نشطة'}
                                  </span>
                                </div>
                                <p className="text-xs text-stone-400 mt-1">
                                  تاريخ الاشتراك: {cp.createdAt || '—'} • القيمة المسددة: <span className="font-semibold text-stone-700">{cp.pricePaid} ج.م</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleIncrementPackageSession(cp)}
                                  disabled={isCompleted}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-200/80 transition-colors cursor-pointer"
                                  title="تسجيل استهلاك جلسة يدوياً"
                                >
                                  +1 جلسة مستخدمة
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePackage(cp.id)}
                                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="حذف الباقة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-medium">
                                <span className="text-stone-700">
                                  تم استهلاك <strong className="text-stone-900">{cp.usedSessions}</strong> من أصل <strong className="text-stone-900">{cp.totalSessions}</strong> جلسة
                                </span>
                                <span className="text-emerald-800 font-bold">
                                  المتبقي: {Math.max(0, cp.totalSessions - cp.usedSessions)} جلسات ({pct}%)
                                </span>
                              </div>
                              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200/50">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isCompleted
                                      ? 'bg-stone-400'
                                      : 'bg-gradient-to-l from-emerald-600 to-teal-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>

                            {cp.notes && (
                              <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                                <span className="font-semibold text-stone-700">ملاحظات:</span> {cp.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : profileActiveTab === 'appointments' ? (
                /* Visit History Section */
                <div>
                  {!selectedClientForProfile.appointments || selectedClientForProfile.appointments.length === 0 ? (
                    <div className="py-10 text-center text-stone-400 text-xs">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p>لا توجد زيارات مسجلة لهذا العميل حتى الآن.</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-stone-200/70 overflow-hidden text-xs">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200/70 text-stone-500 text-[11px]">
                            <th className="py-2.5 px-3.5">التاريخ</th>
                            <th className="py-2.5 px-3.5">الخدمة</th>
                            <th className="py-2.5 px-3.5">الأخصائي</th>
                            <th className="py-2.5 px-3.5">السعر</th>
                            <th className="py-2.5 px-3.5">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {selectedClientForProfile.appointments.map((apt) => (
                            <tr key={apt.id} className="hover:bg-stone-50/40">
                              <td className="py-3 px-3.5 font-medium text-stone-700">{apt.date}</td>
                              <td className="py-3 px-3.5 font-bold text-stone-800">{apt.serviceName}</td>
                              <td className="py-3 px-3.5 text-stone-600">{apt.staffName}</td>
                              <td className="py-3 px-3.5 font-bold text-stone-800">{apt.finalPrice} ج.م</td>
                              <td className="py-3 px-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  apt.status === 'مكتمل'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : apt.status === 'مؤكد'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  {apt.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* Invoices Section */
                <div>
                  {!selectedClientForProfile.invoices || selectedClientForProfile.invoices.length === 0 ? (
                    <div className="py-10 text-center text-stone-400 text-xs">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p>لا توجد فواتير مسددة لهذا العميل حتى الآن.</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-stone-200/70 overflow-hidden text-xs">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200/70 text-stone-500 text-[11px]">
                            <th className="py-2.5 px-3.5">رقم الفاتورة</th>
                            <th className="py-2.5 px-3.5">التاريخ</th>
                            <th className="py-2.5 px-3.5">الخدمة</th>
                            <th className="py-2.5 px-3.5">المبلغ المسدد</th>
                            <th className="py-2.5 px-3.5">طريقة الدفع</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {selectedClientForProfile.invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-stone-50/40">
                              <td className="py-3 px-3.5 font-mono font-bold text-stone-800">{inv.invoiceNumber}</td>
                              <td className="py-3 px-3.5 text-stone-500">{inv.date}</td>
                              <td className="py-3 px-3.5 font-medium text-stone-800">{inv.serviceName || 'جلسة عيادة/سبا'}</td>
                              <td className="py-3 px-3.5 font-extrabold text-emerald-800">{inv.amount} ج.م</td>
                              <td className="py-3 px-3.5">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-medium">
                                  {inv.paymentMethod}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Footer */}
            <div className="p-4 border-t border-stone-100 flex items-center justify-end bg-stone-50/50">
              <button
                onClick={() => setSelectedClientForProfile(null)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-stone-800 hover:bg-stone-900 text-white transition-colors cursor-pointer"
              >
                إغلاق الملف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: إضافة أو تعديل عميل (Add / Edit Client Modal) */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div 
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-base">
                    {editingClientId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
                  </h3>
                  <p className="text-xs text-stone-400">تسجيل وتحديث بيانات العميل في النظام</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-right">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  اسم العميل بالكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سارة أحمد الشريف"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-medium"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  رقم الهاتف للتواصل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="مثال: 01012345678"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-mono"
                  dir="ltr"
                />
              </div>

              {/* Medical History */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  الملاحظات الطبية أو التفضيلات (اختياري)
                </label>
                <textarea
                  rows={3}
                  placeholder="مثال: حساسية جلدية، ضغط دم منضبط، تفضيل تدليك خفيف..."
                  value={formMedicalHistory}
                  onChange={(e) => setFormMedicalHistory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingClientId ? 'حفظ التعديلات' : 'إضافة العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: إسناد باقة جديدة للعميل (Assign New Package Modal) */}
      {isAssignPackageModalOpen && selectedClientForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-base">إسناد باقة وجلسات للعميل</h3>
                  <p className="text-xs text-stone-400">{selectedClientForProfile.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignPackageModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAssignPackageSubmit} className="p-6 space-y-4 text-right">
              {assignPackageError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{assignPackageError}</span>
                </div>
              )}

              {/* Source Type Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">مصدر الباقة</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAssignSourceChange('service')}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      assignSource === 'service'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    من الخدمات
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignSourceChange('package')}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      assignSource === 'package'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    من العروض
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignSourceChange('custom')}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      assignSource === 'custom'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    باقة مخصصة
                  </button>
                </div>
              </div>

              {/* Service Dropdown */}
              {assignSource === 'service' && services.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">اختر الخدمة</label>
                  <select
                    value={assignServiceId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setAssignServiceId(sid);
                      const s = services.find((x) => x.id === sid);
                      if (s) {
                        setAssignPackageName(`باقة ${s.name} (${assignTotalSessions} جلسات)`);
                        setAssignPricePaid((s.minPrice * assignTotalSessions).toString());
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 font-medium"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.minPrice} ج.م للجلسة)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Package Dropdown */}
              {assignSource === 'package' && packages.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">اختر العرض / الباكدج</label>
                  <select
                    value={assignPackageId}
                    onChange={(e) => {
                      const pid = e.target.value;
                      setAssignPackageId(pid);
                      const p = packages.find((x) => x.id === pid);
                      if (p) {
                        setAssignPackageName(p.name);
                        setAssignPricePaid((p.fixedPrice || 1500).toString());
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 font-medium"
                  >
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.fixedPrice || 0} ج.م)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Package Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  اسم الباقة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: باقة ليزر إزالة الشعر (6 جلسات)"
                  value={assignPackageName}
                  onChange={(e) => setAssignPackageName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 font-medium"
                />
              </div>

              {/* Total Sessions & Price Paid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    إجمالي عدد الجلسات <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={assignTotalSessions}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10) || 1;
                      setAssignTotalSessions(n);
                      if (assignSource === 'service') {
                        const s = services.find((x) => x.id === assignServiceId);
                        if (s) {
                          setAssignPackageName(`باقة ${s.name} (${n} جلسات)`);
                          setAssignPricePaid((s.minPrice * n).toString());
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    السعر المدفوع (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={assignPricePaid}
                    onChange={(e) => setAssignPricePaid(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 font-bold text-center"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ملاحظات أو شروط الباقة</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات الطبيب أو أي شروط خاصة بالباقة..."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAssignPackageModalOpen(false)}
                  disabled={isSubmittingPackage}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-stone-500 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPackage}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPackage ? 'جاري الحفظ...' : 'حفظ وإسناد الباقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
