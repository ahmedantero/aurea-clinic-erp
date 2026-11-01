import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Phone, 
  Briefcase, 
  BadgePercent, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Wallet,
  Clock,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StaffMemberItem, StaffTransactionItem, PayrollRecordItem } from '../types';
import { Pagination } from './ui/Pagination';
import { usePagination } from '../hooks/usePagination';

export const HRView: React.FC = () => {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError, confirm } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'staff' | 'transactions' | 'payroll'>('staff');

  // Data states
  const [staffList, setStaffList] = useState<StaffMemberItem[]>([]);
  const [transactions, setTransactions] = useState<StaffTransactionItem[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Month-Year selection for payroll (Default: Current Year-Month e.g. 2026-10)
  const currentDefaultMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(currentDefaultMonth);

  // Staff Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMemberItem | null>(null);
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    role: '',
    baseSalary: '',
    phone: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active',
  });

  // Transaction Form Data
  const [txFormData, setTxFormData] = useState({
    staffId: '',
    type: 'ADVANCE',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [txSubmitting, setTxSubmitting] = useState(false);

  // Search & Filter
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [txFilterStaffId, setTxFilterStaffId] = useState('ALL');

  // Issuing Payroll Processing state
  const [issuingStaffId, setIssuingStaffId] = useState<string | null>(null);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'x-user-id': user?.id || '',
    'Authorization': `Bearer ${user?.id || ''}`,
  }), [user?.id]);

  // Fetch all HR data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [staffRes, txRes, payrollRes] = await Promise.all([
        fetch('/api/hr/staff', { headers: authHeaders }),
        fetch('/api/hr/transactions', { headers: authHeaders }),
        fetch('/api/hr/payroll', { headers: authHeaders }),
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(staffData);
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData);
      }
      if (payrollRes.ok) {
        const payrollData = await payrollRes.json();
        setPayrollRecords(payrollData);
      }
    } catch (err) {
      console.error('Failed to load HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (type === 'success') {
      toastSuccess(text);
    } else {
      toastError(text);
    }
    setTimeout(() => setMessage(null), 5000);
  };

  // 1. Staff Save / Update
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormData.name || !staffFormData.role || !staffFormData.baseSalary) {
      showNotification('error', 'يرجى استيفاء الحقول الإلزامية (الاسم، الوظيفة، الراتب الأساسي)');
      return;
    }

    try {
      const url = editingStaff ? `/api/hr/staff/${editingStaff.id}` : '/api/hr/staff';
      const method = editingStaff ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify({
          name: staffFormData.name,
          role: staffFormData.role,
          baseSalary: parseFloat(staffFormData.baseSalary),
          phone: staffFormData.phone,
          joinDate: staffFormData.joinDate,
          status: staffFormData.status,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشلت العملية');
      }

      showNotification('success', editingStaff ? 'تم تعديل بيانات الموظف بنجاح' : 'تم إضافة الموظف الجديد بنجاح');
      setIsStaffModalOpen(false);
      setEditingStaff(null);
      setStaffFormData({
        name: '',
        role: '',
        baseSalary: '',
        phone: '',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      });
      fetchAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'حدث خطأ أثناء حفظ بيانات الموظف');
    }
  };

  // Delete Staff
  const handleDeleteStaff = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'حذف الموظف',
      message: `هل أنت متأكد من رغبتك في حذف الموظف "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'نعم، حذف الموظف',
      cancelText: 'إلغاء',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/hr/staff/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        showNotification('success', 'تم حذف الموظف بنجاح');
        fetchAllData();
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'فشل حذف الموظف');
      }
    } catch (err) {
      showNotification('error', 'حدث خطأ في الاتصال');
    }
  };

  // 2. Submit Transaction (سلفة، مكافأة، خصم)
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txFormData.staffId) {
      showNotification('error', 'يرجى اختيار الموظف أولاً');
      return;
    }
    const amt = parseFloat(txFormData.amount);
    if (isNaN(amt) || amt <= 0) {
      showNotification('error', 'يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    setTxSubmitting(true);
    try {
      const res = await fetch('/api/hr/transactions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          staffId: txFormData.staffId,
          type: txFormData.type,
          amount: amt,
          date: txFormData.date,
          notes: txFormData.notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل تسجيل الحركة');
      }

      showNotification('success', 'تم تسجيل الحركة المالية للموظف بنجاح');
      setTxFormData({
        staffId: txFormData.staffId, // Keep staff selected for convenience
        type: 'ADVANCE',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setTxSubmitting(false);
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'حذف الحركة المالية',
      message: 'هل أنت متأكد من رغبتك في حذف هذه الحركة المالية للموظف؟',
      confirmText: 'نعم، حذف الحركة',
      cancelText: 'إلغاء',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/hr/transactions/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        showNotification('success', 'تم حذف الحركة المالية بنجاح');
        fetchAllData();
      }
    } catch (err) {
      showNotification('error', 'حدث خطأ أثناء الحذف');
    }
  };

  // 3. Issue Payroll
  const handleIssuePayroll = async (
    staff: StaffMemberItem, 
    totals: { base: number; bonuses: number; deductions: number; advances: number; net: number }
  ) => {
    const isConfirmed = await confirm({
      title: 'اعتماد وصرف الراتب',
      message: `هل أنت متأكد من اعتماد وصرف راتب شهر (${selectedMonthYear}) للموظف "${staff.name}" بصافي قدره (${totals.net.toLocaleString()} ج.م) وترحيله تلقائياً للمصروفات؟`,
      confirmText: 'تأكيد وصرف الراتب',
      cancelText: 'إلغاء',
      type: 'warning',
    });
    if (!isConfirmed) return;

    setIssuingStaffId(staff.id);
    try {
      const res = await fetch('/api/payroll/issue', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          staffId: staff.id,
          monthYear: selectedMonthYear,
          baseSalary: totals.base,
          totalBonuses: totals.bonuses,
          totalDeductions: totals.deductions,
          totalAdvances: totals.advances,
          netPaid: totals.net,
          notes: `مسير رواتب شهر ${selectedMonthYear}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل صرف الراتب');
      }

      showNotification('success', `تم صرف راتب ${staff.name} لشهر ${selectedMonthYear} بنجاح وترحيله إلى المصروفات`);
      fetchAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'حدث خطأ أثناء صرف الراتب');
    } finally {
      setIssuingStaffId(null);
    }
  };

  // Monthly Calculations Helper
  const getStaffMonthlyTransactions = (staffId: string, monthYear: string) => {
    const [yearStr, monthStr] = monthYear.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    return transactions.filter(t => {
      if (t.staffId !== staffId) return false;
      if (!t.date) return false;
      const tDate = new Date(t.date);
      return tDate.getFullYear() === year && (tDate.getMonth() + 1) === month;
    });
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    if (!staffSearchQuery.trim()) return staffList;
    const q = staffSearchQuery.toLowerCase();
    return staffList.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.role.toLowerCase().includes(q) || 
      (s.phone && s.phone.includes(q))
    );
  }, [staffList, staffSearchQuery]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (txFilterStaffId !== 'ALL' && t.staffId !== txFilterStaffId) return false;
      return true;
    });
  }, [transactions, txFilterStaffId]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalStaff = staffList.length;
    const activeStaff = staffList.filter(s => s.status === 'Active').length;
    const totalBaseSalary = staffList.reduce((sum, s) => sum + (s.status === 'Active' ? s.baseSalary : 0), 0);
    
    // Transactions this selected month
    const [yearStr, monthStr] = selectedMonthYear.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const monthTxs = transactions.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    const monthAdvances = monthTxs.filter(t => t.type === 'ADVANCE').reduce((s, t) => s + t.amount, 0);
    const monthBonuses = monthTxs.filter(t => t.type === 'BONUS').reduce((s, t) => s + t.amount, 0);
    const monthDeductions = monthTxs.filter(t => t.type === 'DEDUCTION').reduce((s, t) => s + t.amount, 0);

    const monthPayrollsIssued = payrollRecords.filter(p => p.monthYear === selectedMonthYear);
    const totalNetPaidIssued = monthPayrollsIssued.reduce((s, p) => s + p.netPaid, 0);

    return {
      totalStaff,
      activeStaff,
      totalBaseSalary,
      monthAdvances,
      monthBonuses,
      monthDeductions,
      monthPayrollsIssuedCount: monthPayrollsIssued.length,
      totalNetPaidIssued,
    };
  }, [staffList, transactions, payrollRecords, selectedMonthYear]);

  // Luxury Pagination for Staff Directory
  const {
    currentPage: staffPage,
    setCurrentPage: setStaffPage,
    pageSize: staffPageSize,
    setPageSize: setStaffPageSize,
    paginatedData: paginatedStaff,
    resetPage: resetStaffPage,
  } = usePagination(filteredStaff, { initialPageSize: 10 });

  useEffect(() => {
    resetStaffPage();
  }, [staffSearchQuery]);

  // Luxury Pagination for Staff Transactions
  const {
    currentPage: txPage,
    setCurrentPage: setTxPage,
    pageSize: txPageSize,
    setPageSize: setTxPageSize,
    paginatedData: paginatedTransactions,
    resetPage: resetTxPage,
  } = usePagination(filteredTransactions, { initialPageSize: 10 });

  useEffect(() => {
    resetTxPage();
  }, [txFilterStaffId]);

  // Luxury Pagination for Historical Payroll
  const {
    currentPage: payrollPage,
    setCurrentPage: setPayrollPage,
    pageSize: payrollPageSize,
    setPageSize: setPayrollPageSize,
    paginatedData: paginatedPayroll,
    resetPage: resetPayrollPage,
  } = usePagination(payrollRecords, { initialPageSize: 10 });

  useEffect(() => {
    resetPayrollPage();
  }, [selectedMonthYear]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12" dir="rtl">
      {/* Toast Notification */}
      {message && (
        <div 
          className={`p-4 rounded-xl flex items-center justify-between border shadow-sm transition-all ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold text-sm">{message.text}</span>
          </div>
          <button 
            onClick={() => setMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-stone-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-l from-[#0f3b2c] via-[#164e3b] to-[#0f3b2c] p-6 lg:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d4af37]/20 text-[#f5e6a3] border border-[#d4af37]/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                نظام إدارة الموارد البشرية والرواتب
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              إدارة الموظفين والرواتب (HR & Payroll)
            </h1>
            <p className="text-stone-300 text-sm mt-1 max-w-xl">
              إدارة كادر العمل، تسجيل السلف والمكافآت والخصومات، ومسير الرواتب المعتمد مع الترحيل التلقائي المباشر للمصروفات وسجل التدقيق.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchAllData}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/10 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
            <button
              onClick={() => {
                setEditingStaff(null);
                setStaffFormData({
                  name: '',
                  role: '',
                  baseSalary: '',
                  phone: '',
                  joinDate: new Date().toISOString().split('T')[0],
                  status: 'Active',
                });
                setIsStaffModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#b8952b] text-[#0f3b2c] font-black text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards inside banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-stone-300 text-xs mb-1">
              <Users className="w-4 h-4 text-[#d4af37]" />
              <span>إجمالي الموظفين</span>
            </div>
            <div className="text-xl font-bold text-white">
              {stats.totalStaff} <span className="text-xs font-normal text-emerald-300">({stats.activeStaff} نشط)</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-stone-300 text-xs mb-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>كتلة الرواتب الأساسية</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {stats.totalBaseSalary.toLocaleString()} <span className="text-xs font-normal text-stone-300">ج.م</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-stone-300 text-xs mb-1">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>سلف الشهر الحالي</span>
            </div>
            <div className="text-xl font-bold text-amber-300 font-mono">
              {stats.monthAdvances.toLocaleString()} <span className="text-xs font-normal text-stone-300">ج.م</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-stone-300 text-xs mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>المنصرف لشهر ({selectedMonthYear})</span>
            </div>
            <div className="text-xl font-bold text-emerald-300 font-mono">
              {stats.totalNetPaidIssued.toLocaleString()} <span className="text-xs font-normal text-stone-300">ج.م</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          onClick={() => setActiveSubTab('staff')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'staff'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>سجل الموظفين</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-600 font-semibold">
            {staffList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'transactions'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <BadgePercent className="w-4 h-4" />
          <span>السلف والمكافآت والخصومات</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-600 font-semibold">
            {transactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('payroll')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'payroll'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>مسير صرف الرواتب</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-900 font-semibold">
            شهر {selectedMonthYear}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: STAFF DIRECTORY */}
      {/* ======================================================== */}
      {activeSubTab === 'staff' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="بحث باسم الموظف أو المسمى أو الهاتف..."
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-2 rounded-lg bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              />
            </div>
            <div className="text-xs text-stone-500 font-medium">
              يظهر <span className="font-bold text-stone-800">{filteredStaff.length}</span> من أصل {staffList.length} موظف
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto silk-scrollbar">
              <table className="w-full text-right border-collapse text-sm min-w-[760px]">
                <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/90 shadow-2xs">
                  <tr className="text-stone-700 font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-4">اسم الموظف</th>
                    <th className="py-4 px-4">المسمى الوظيفي</th>
                    <th className="py-4 px-4">الراتب الأساسي</th>
                    <th className="py-4 px-4">رقم الهاتف</th>
                    <th className="py-4 px-4">تاريخ الانضمام</th>
                    <th className="py-4 px-4">الحالة</th>
                    <th className="py-4 px-4">مسجل بواسطة (Audit)</th>
                    <th className="py-4 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-stone-400">
                        <Users className="w-10 h-10 mx-auto text-stone-300 mb-2 stroke-1" />
                        <p className="font-medium text-stone-600">لم يتم العثور على موظفين مسجلين</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((staff, idx) => (
                      <tr 
                        key={staff.id} 
                        className={`transition-colors duration-150 hover:bg-emerald-50/40 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-stone-800">
                          {staff.name}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold">
                            <Briefcase className="w-3.5 h-3.5 text-stone-400" />
                            {staff.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700 font-mono">
                          {staff.baseSalary.toLocaleString()} ج.م
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 text-xs font-mono">
                          {staff.phone ? (
                            <span className="flex items-center gap-1 text-stone-600">
                              <Phone className="w-3.5 h-3.5 text-stone-400" />
                              {staff.phone}
                            </span>
                          ) : (
                            <span className="text-stone-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-stone-500 text-xs">
                          {staff.joinDate || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            staff.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {staff.status === 'Active' ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {staff.createdBy ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[11px] font-medium border border-stone-200" title={`User ID: ${staff.createdBy.id}`}>
                              <span>بواسطة:</span>
                              <span className="font-bold">{staff.createdBy.name || staff.createdBy.username}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400">النظام</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingStaff(staff);
                                setStaffFormData({
                                  name: staff.name,
                                  role: staff.role,
                                  baseSalary: String(staff.baseSalary),
                                  phone: staff.phone || '',
                                  joinDate: staff.joinDate || new Date().toISOString().split('T')[0],
                                  status: staff.status || 'Active',
                                });
                                setIsStaffModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="تعديل"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff.id, staff.name)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف"
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

            <Pagination
              currentPage={staffPage}
              totalItems={filteredStaff.length}
              pageSize={staffPageSize}
              onPageChange={setStaffPage}
              onPageSizeChange={setStaffPageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              itemLabel="موظف"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TRANSACTIONS (ADVANCES, BONUSES, DEDUCTIONS) */}
      {/* ======================================================== */}
      {activeSubTab === 'transactions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction Entry Form */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs h-fit">
            <h3 className="font-bold text-base text-stone-800 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>تسجيل حركة مالية جديدة</span>
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              إضافة سلفة، مكافأة تشجيعية، أو خصم جزائي للموظف
            </p>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  الموظف <span className="text-rose-500">*</span>
                </label>
                <select
                  value={txFormData.staffId}
                  onChange={(e) => setTxFormData({ ...txFormData, staffId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-semibold focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  required
                >
                  <option value="">-- اختر الموظف --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  نوع الحركة <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxFormData({ ...txFormData, type: 'ADVANCE' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      txFormData.type === 'ADVANCE'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <span>سلفة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxFormData({ ...txFormData, type: 'BONUS' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      txFormData.type === 'BONUS'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                    <span>مكافأة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxFormData({ ...txFormData, type: 'DEDUCTION' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      txFormData.type === 'DEDUCTION'
                        ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                    <span>خصم</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  المبلغ (ج.م) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="0.00"
                  value={txFormData.amount}
                  onChange={(e) => setTxFormData({ ...txFormData, amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold font-mono focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  التاريخ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={txFormData.date}
                  onChange={(e) => setTxFormData({ ...txFormData, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  البيان / الملاحظات
                </label>
                <textarea
                  rows={2}
                  placeholder="سبب السلفة أو المكافأة أو الخصم..."
                  value={txFormData.notes}
                  onChange={(e) => setTxFormData({ ...txFormData, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={txSubmitting}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{txSubmitting ? 'جاري الحفظ...' : 'تسجيل الحركة الآن'}</span>
              </button>
            </form>
          </div>

          {/* Transactions Log Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-700">تصفية بالموظف:</span>
                <select
                  value={txFilterStaffId}
                  onChange={(e) => setTxFilterStaffId(e.target.value)}
                  className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="ALL">كل الموظفين</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-stone-500 font-medium">
                إجمالي الحركات: <span className="font-bold text-stone-800">{filteredTransactions.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold text-xs">
                      <th className="py-3 px-4">الموظف</th>
                      <th className="py-3 px-4">نوع الحركة</th>
                      <th className="py-3 px-4">المبلغ</th>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">البيان</th>
                      <th className="py-3 px-4">مسجل بواسطة</th>
                      <th className="py-3 px-4 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-stone-400">
                          <BadgePercent className="w-8 h-8 mx-auto text-stone-300 mb-1 stroke-1" />
                          <p className="font-medium text-xs">لا توجد حركات مسجلة</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-stone-800">
                            {tx.staffName}
                          </td>
                          <td className="py-3 px-4">
                            {tx.type === 'ADVANCE' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Wallet className="w-3 h-3 text-amber-600" />
                                سلفة
                              </span>
                            )}
                            {tx.type === 'BONUS' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <ArrowUpCircle className="w-3 h-3 text-emerald-600" />
                                مكافأة
                              </span>
                            )}
                            {tx.type === 'DEDUCTION' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <ArrowDownCircle className="w-3 h-3 text-rose-600" />
                                خصم
                              </span>
                            )}
                          </td>
                          <td className={`py-3 px-4 font-bold font-mono ${
                            tx.type === 'BONUS' ? 'text-emerald-700' : tx.type === 'DEDUCTION' ? 'text-rose-700' : 'text-amber-800'
                          }`}>
                            {tx.amount.toLocaleString()} ج.م
                          </td>
                          <td className="py-3 px-4 text-xs text-stone-500 font-mono">
                            {tx.date}
                          </td>
                          <td className="py-3 px-4 text-xs text-stone-600 max-w-xs truncate" title={tx.notes}>
                            {tx.notes || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {tx.createdBy ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[11px] font-medium border border-stone-200">
                                {tx.createdBy.name || tx.createdBy.username}
                              </span>
                            ) : (
                              <span className="text-[11px] text-stone-400">النظام</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="p-1 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={txPage}
                totalItems={filteredTransactions.length}
                pageSize={txPageSize}
                onPageChange={setTxPage}
                onPageSizeChange={setTxPageSize}
                pageSizeOptions={[10, 20, 50, 100]}
                itemLabel="حركة مالية"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PAYROLL ISSUANCE (صرف الرواتب) */}
      {/* ======================================================== */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-6">
          {/* Month Selector Bar */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-bold text-sm text-stone-800">
                  تحديد مسير رواتب الشهر
                </h3>
                <p className="text-xs text-stone-400">
                  اختر الشهر والسنة لحساب السلف والخصومات وصافي المستحق آلياً
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-stone-700">الشهر المستهدف:</label>
              <input
                type="month"
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="p-2 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-800 focus:outline-hidden focus:border-emerald-600 focus:bg-white cursor-pointer"
              />
            </div>
          </div>

          {/* Active Payroll Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between">
              <h4 className="font-bold text-sm text-stone-800">
                جدول مسير رواتب الكادر لشهر ({selectedMonthYear})
              </h4>
              <span className="text-xs text-stone-500">
                الصيغة: الصافي = الأساسي + المكافآت - الخصومات - السلف
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold text-xs">
                    <th className="py-3 px-4">الموظف</th>
                    <th className="py-3 px-4">الوظيفة</th>
                    <th className="py-3 px-4">الراتب الأساسي</th>
                    <th className="py-3 px-4 text-emerald-800">(+) مكافآت</th>
                    <th className="py-3 px-4 text-rose-800">(-) خصومات</th>
                    <th className="py-3 px-4 text-amber-800">(-) سلف</th>
                    <th className="py-3 px-4 font-black">(=) صافي المستحق</th>
                    <th className="py-3 px-4 text-center">حالة الصرف</th>
                    <th className="py-3 px-4 text-center">إجراء الصرف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {staffList.filter(s => s.status === 'Active').map((staff) => {
                    const monthlyTxs = getStaffMonthlyTransactions(staff.id, selectedMonthYear);
                    const bonuses = monthlyTxs.filter(t => t.type === 'BONUS').reduce((s, t) => s + t.amount, 0);
                    const deductions = monthlyTxs.filter(t => t.type === 'DEDUCTION').reduce((s, t) => s + t.amount, 0);
                    const advances = monthlyTxs.filter(t => t.type === 'ADVANCE').reduce((s, t) => s + t.amount, 0);
                    const net = Math.max(0, staff.baseSalary + bonuses - deductions - advances);

                    const alreadyIssued = payrollRecords.find(
                      p => p.staffId === staff.id && p.monthYear === selectedMonthYear
                    );

                    return (
                      <tr key={staff.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-800">
                          {staff.name}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 text-xs">
                          {staff.role}
                        </td>
                        <td className="py-3.5 px-4 font-semibold font-mono text-stone-700">
                          {staff.baseSalary.toLocaleString()} ج.م
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">
                          +{bonuses.toLocaleString()} ج.م
                        </td>
                        <td className="py-3.5 px-4 font-mono text-rose-700 font-semibold">
                          -{deductions.toLocaleString()} ج.م
                        </td>
                        <td className="py-3.5 px-4 font-mono text-amber-700 font-semibold">
                          -{advances.toLocaleString()} ج.م
                        </td>
                        <td className="py-3.5 px-4 font-black font-mono text-base text-[#0f3b2c]">
                          {net.toLocaleString()} ج.م
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {alreadyIssued ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              تم الصرف ({alreadyIssued.paymentDate})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              غير منصرف
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {alreadyIssued ? (
                            <span className="text-xs text-stone-400 font-medium">
                              مُعتمد ومُرحل
                            </span>
                          ) : (
                            <button
                              onClick={() => handleIssuePayroll(staff, {
                                base: staff.baseSalary,
                                bonuses,
                                deductions,
                                advances,
                                net,
                              })}
                              disabled={issuingStaffId === staff.id}
                              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span>{issuingStaffId === staff.id ? 'جاري الصرف...' : 'صرف الراتب'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Already Issued History Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-stone-50/80 border-b border-stone-200">
              <h4 className="font-bold text-sm text-stone-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>سجل أذونات صرف الرواتب المعتمدة السابقة (Historical Payroll Records)</span>
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold text-xs">
                    <th className="py-3 px-4">الموظف</th>
                    <th className="py-3 px-4">الشهر</th>
                    <th className="py-3 px-4">الأساسي</th>
                    <th className="py-3 px-4">المكافآت</th>
                    <th className="py-3 px-4">الخصومات</th>
                    <th className="py-3 px-4">السلف</th>
                    <th className="py-3 px-4 font-bold">الصافي المصروف</th>
                    <th className="py-3 px-4">تاريخ الصرف</th>
                    <th className="py-3 px-4">معتمد بواسطة (Audit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {payrollRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-stone-400 text-xs">
                        لم يتم صرف رواتب حتى الآن
                      </td>
                    </tr>
                  ) : (
                    paginatedPayroll.map((rec) => (
                      <tr key={rec.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-stone-800">
                          {rec.staffName}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-800 text-xs">
                          {rec.monthYear}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-600 text-xs">
                          {rec.baseSalary.toLocaleString()} ج.م
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-700 text-xs">
                          +{rec.totalBonuses.toLocaleString()} ج.م
                        </td>
                        <td className="py-3 px-4 font-mono text-rose-700 text-xs">
                          -{rec.totalDeductions.toLocaleString()} ج.م
                        </td>
                        <td className="py-3 px-4 font-mono text-amber-700 text-xs">
                          -{rec.totalAdvances.toLocaleString()} ج.م
                        </td>
                        <td className="py-3 px-4 font-black font-mono text-stone-900">
                          {rec.netPaid.toLocaleString()} ج.م
                        </td>
                        <td className="py-3 px-4 text-xs text-stone-500 font-mono">
                          {rec.paymentDate}
                        </td>
                        <td className="py-3 px-4">
                          {rec.createdBy ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[11px] font-medium border border-stone-200">
                              بواسطة: <span className="font-bold">{rec.createdBy.name || rec.createdBy.username}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400">المدير العام</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={payrollPage}
              totalItems={payrollRecords.length}
              pageSize={payrollPageSize}
              onPageChange={setPayrollPage}
              onPageSizeChange={setPayrollPageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              itemLabel="إذن صرف راتب"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT STAFF MEMBER */}
      {/* ======================================================== */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0f3b2c]/25 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-b from-[#fdfbf7] via-[#fcfaf5] to-[#f7f4ed] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl max-w-lg w-full p-6 shadow-[0_25px_70px_-15px_rgba(15,59,44,0.22)] border border-stone-200/90 dark:border-white/10 relative overflow-hidden">
            <button
              onClick={() => setIsStaffModalOpen(false)}
              className="absolute top-5 left-5 p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              <span>{editingStaff ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-5">
              سجل تفاصيل الموظف ومستحقاته الأساسية في النظام
            </p>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  اسم الموظف الكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: د. أحمد فتحي"
                  value={staffFormData.name}
                  onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    المسمى الوظيفي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: موظف استقبال"
                    value={staffFormData.role}
                    onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    الراتب الأساسي (ج.م) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={staffFormData.baseSalary}
                    onChange={(e) => setStaffFormData({ ...staffFormData, baseSalary: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold font-mono focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    placeholder="010xxxxxxxx"
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    تاريخ الانضمام
                  </label>
                  <input
                    type="date"
                    value={staffFormData.joinDate}
                    onChange={(e) => setStaffFormData({ ...staffFormData, joinDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  حالة الموظف
                </label>
                <select
                  value={staffFormData.status}
                  onChange={(e) => setStaffFormData({ ...staffFormData, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white font-semibold"
                >
                  <option value="Active">نشط (Active)</option>
                  <option value="Inactive">غير نشط (Inactive)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200/70 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
                  <span>{editingStaff ? 'تحديث البيانات' : 'حفظ الموظف'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
